<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OrderReplacementAllocation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderReplacementAllocationController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $query = OrderReplacementAllocation::with([
            'order.customer',
            'product',
            'salesStore',
            'creator',
            'driver'
        ]);

        // Filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        if ($request->has('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('order', function ($o) use ($search) {
                    $o->where('order_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function ($c) use ($search) {
                          $c->where('name', 'like', "%{$search}%");
                      });
                })->orWhereHas('product', function ($p) use ($search) {
                    $p->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
            });
        }

        $allAllocations = $query->latest()->get();

        // Calculate metrics using only active (non-returned) allocations
        $activeAllocations = $allAllocations->where('status', '!=', 'returned');
        $totalCount = $activeAllocations->count();
        $totalQty = $activeAllocations->sum('allocated_quantity');
        
        $totalValue = 0;
        foreach ($activeAllocations as $alloc) {
            // Find order item price or fallback to product price
            $orderItem = OrderItem::where('order_id', $alloc->order_id)
                ->where('product_id', $alloc->product_id)
                ->first();
            $price = $orderItem ? (float)$orderItem->unit_price : (float)($alloc->product->sales_unit_price ?? $alloc->product->default_unit_price ?? 0);
            
            $totalValue += $alloc->allocated_quantity * $price;
        }

        // Paginate manually or using helper
        $perPage = $request->per_page ?? 15;
        $page = $request->page ?? 1;
        $paginated = $query->latest()->paginate($perPage);

        // Attach price to items
        foreach ($paginated->items() as $alloc) {
            $orderItem = OrderItem::where('order_id', $alloc->order_id)
                ->where('product_id', $alloc->product_id)
                ->first();
            $alloc->unit_price = $orderItem ? (float)$orderItem->unit_price : (float)($alloc->product->sales_unit_price ?? $alloc->product->default_unit_price ?? 0);
            $alloc->monetary_value = $alloc->allocated_quantity * $alloc->unit_price;
        }

        return $this->success([
            'data' => $paginated,
            'metrics' => [
                'total_count' => $totalCount,
                'total_quantity' => (float)$totalQty,
                'total_value' => (float)$totalValue
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'product_id' => 'required|exists:products,id',
            'sales_store_id' => 'required|exists:sales_stores,id',
            'batch_reference' => 'nullable|string|max:50|regex:/^[A-Za-z0-9\-_]+$/',
            'allocated_quantity' => 'required|numeric|min:0.01',
            'driver_id' => 'required|exists:drivers,id',
            'vehicle_id' => 'nullable|string|exists:vehicles,id',
        ]);

        return DB::transaction(function () use ($validated) {
            $order = Order::findOrFail($validated['order_id']);
            $product = Product::findOrFail($validated['product_id']);

            if (!empty($validated['vehicle_id'])) {
                \App\Models\Driver::where('id', $validated['driver_id'])->update(['vehicle_id' => $validated['vehicle_id']]);
            }

            // Validate inventory stock level
            $batch = $validated['batch_reference'] ?? null;
            $stock = SalesStoreStock::where('sales_store_id', $validated['sales_store_id'])
                ->where('product_id', $validated['product_id'])
                ->where('batch_reference', $batch)
                ->first();

            $ledger = SalesStoreStock::getLedgerStock($validated['sales_store_id'], $validated['product_id'], $batch);
            $raw = $stock ? (float)$stock->current_quantity : 0.0;
            $available = max($ledger, $raw);
            
            if ($available < (float)$validated['allocated_quantity']) {
                return $this->error("Insufficient stock for {$product->name} (Batch: " . ($batch ?? 'Unbatched') . ") in the selected sales store. Available: {$available}.", 422);
            }

            if (!$stock) {
                $stock = SalesStoreStock::create([
                    'sales_store_id' => $validated['sales_store_id'],
                    'product_id' => $validated['product_id'],
                    'batch_reference' => $batch,
                    'current_quantity' => 0.0,
                    'updated_by' => auth()->id()
                ]);
            }

            // Decrement Stock
            $stock->update([
                'updated_by' => auth()->id(),
                'last_updated' => now()
            ]);
            $stock->updateStock('replace', $validated['allocated_quantity'], $product->sales_unit_price ?? $product->default_unit_price);

            // Create Allocation
            $allocation = OrderReplacementAllocation::create([
                'order_id' => $validated['order_id'],
                'driver_id' => $validated['driver_id'],
                'product_id' => $validated['product_id'],
                'sales_store_id' => $validated['sales_store_id'],
                'batch_reference' => $batch,
                'allocated_quantity' => $validated['allocated_quantity'],
                'delivered_quantity' => 0.00,
                'returned_quantity' => 0.00,
                'status' => 'allocated',
                'created_by' => auth()->id()
            ]);

            // Create Store Movement
            SalesStoreMovement::create([
                'movement_date' => now()->toDateString(),
                'sales_store_id' => $validated['sales_store_id'],
                'product_id' => $validated['product_id'],
                'batch_reference' => $batch,
                'movement_type' => 'dispatch_out',
                'quantity' => $validated['allocated_quantity'],
                'reference_id' => $allocation->id,
                'created_by' => auth()->id(),
                'notes' => "Replacement pre-allocated for Order: {$order->order_number}"
            ]);

            return $this->success($allocation->load(['order', 'product', 'salesStore', 'driver']), 'Replacement allocated successfully');
        });
    }

    public function returnAllocation(Request $request, $id)
    {
        $validated = $request->validate([
            'sales_store_id' => 'required|exists:sales_stores,id',
            'batch_reference' => 'nullable|string',
            'quantity' => 'required|numeric|min:0.01'
        ]);

        return DB::transaction(function () use ($validated, $id) {
            $allocation = OrderReplacementAllocation::with('product', 'order')->findOrFail($id);

            $leftover = $allocation->allocated_quantity - $allocation->delivered_quantity - $allocation->returned_quantity;
            if ((float)$validated['quantity'] > (float)$leftover) {
                return $this->error("Cannot return more than the remaining leftover quantity ({$leftover}).", 422);
            }

            // Return to inventory
            $stock = SalesStoreStock::firstOrCreate(
                [
                    'sales_store_id' => $validated['sales_store_id'],
                    'product_id' => $allocation->product_id,
                    'batch_reference' => $validated['batch_reference'] ?? null,
                ],
                [
                    'current_quantity' => 0.00,
                    'updated_by' => auth()->id()
                ]
            );

            $stock->update([
                'updated_by' => auth()->id(),
                'last_updated' => now()
            ]);
            $stock->updateStock('replace', -$validated['quantity'], $allocation->product->sales_unit_price ?? $allocation->product->default_unit_price);

            // Increment returned quantity
            $allocation->increment('returned_quantity', $validated['quantity']);
            
            // Update status
            $totalClosed = $allocation->delivered_quantity + $allocation->returned_quantity;
            if ((float)$totalClosed >= (float)$allocation->allocated_quantity) {
                $allocation->update(['status' => 'returned']);
            } else {
                $allocation->update(['status' => 'partially_returned']);
            }

            // Log movement
            SalesStoreMovement::create([
                'movement_date' => now()->toDateString(),
                'sales_store_id' => $validated['sales_store_id'],
                'product_id' => $allocation->product_id,
                'batch_reference' => $validated['batch_reference'] ?? null,
                'movement_type' => 'return_in',
                'quantity' => $validated['quantity'],
                'reference_id' => $allocation->id,
                'created_by' => auth()->id(),
                'notes' => "Leftover replacements returned from Order: {$allocation->order->order_number}"
            ]);

            return $this->success($allocation->fresh(), 'Leftover replacements returned to store successfully');
        });
    }

    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'driver_id' => 'required|exists:drivers,id',
            'vehicle_id' => 'nullable|string|exists:vehicles,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.sales_store_id' => 'required|exists:sales_stores,id',
            'items.*.batch_reference' => 'nullable|string|max:50|regex:/^[A-Za-z0-9\-_]+$/',
            'items.*.allocated_quantity' => 'required|numeric|min:0.01'
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $order = Order::findOrFail($validated['order_id']);
                $createdAllocations = [];

                if (!empty($validated['vehicle_id'])) {
                    \App\Models\Driver::where('id', $validated['driver_id'])->update(['vehicle_id' => $validated['vehicle_id']]);
                }

                foreach ($validated['items'] as $item) {
                    $product = Product::findOrFail($item['product_id']);

                    // Validate inventory stock level
                    $batch = $item['batch_reference'] ?? null;
                    $stock = SalesStoreStock::where('sales_store_id', $item['sales_store_id'])
                        ->where('product_id', $item['product_id'])
                        ->where('batch_reference', $batch)
                        ->first();

                    $ledger = SalesStoreStock::getLedgerStock($item['sales_store_id'], $item['product_id'], $batch);
                    $raw = $stock ? (float)$stock->current_quantity : 0.0;
                    $available = max($ledger, $raw);
                    
                    if ($available < (float)$item['allocated_quantity']) {
                        throw new \Exception("Insufficient stock for {$product->name} (Batch: " . ($batch ?? 'Unbatched') . ") in the selected sales store. Available: {$available}.");
                    }

                    if (!$stock) {
                        $stock = SalesStoreStock::create([
                            'sales_store_id' => $item['sales_store_id'],
                            'product_id' => $item['product_id'],
                            'batch_reference' => $batch,
                            'current_quantity' => 0.0,
                            'updated_by' => auth()->id()
                        ]);
                    }

                    // Decrement Stock
                    $stock->update([
                        'updated_by' => auth()->id(),
                        'last_updated' => now()
                    ]);
                    $stock->updateStock('replace', $item['allocated_quantity'], $product->sales_unit_price ?? $product->default_unit_price);

                    // Create Allocation
                    $allocation = OrderReplacementAllocation::create([
                        'order_id' => $validated['order_id'],
                        'driver_id' => $validated['driver_id'],
                        'product_id' => $item['product_id'],
                        'sales_store_id' => $item['sales_store_id'],
                        'batch_reference' => $batch,
                        'allocated_quantity' => $item['allocated_quantity'],
                        'delivered_quantity' => 0.00,
                        'returned_quantity' => 0.00,
                        'status' => 'allocated',
                        'created_by' => auth()->id()
                    ]);

                    // Create Store Movement
                    SalesStoreMovement::create([
                        'movement_date' => now()->toDateString(),
                        'sales_store_id' => $item['sales_store_id'],
                        'product_id' => $item['product_id'],
                        'batch_reference' => $batch,
                        'movement_type' => 'dispatch_out',
                        'quantity' => $item['allocated_quantity'],
                        'reference_id' => $allocation->id,
                        'created_by' => auth()->id(),
                        'notes' => "Replacement pre-allocated for Order: {$order->order_number}"
                    ]);

                    $createdAllocations[] = $allocation->load(['product', 'salesStore', 'driver']);
                }

                return $this->success($createdAllocations, 'Replacement allocations created successfully');
            });
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
