<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Invoice;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    use ApiResponses;

    public function metrics(Request $request)
    {
        $totalUrgent = Order::whereIn('urgency', ['urgent', 'critical'])->count();
        $totalPending = Order::where('status', 'pending')->count();
        $totalDispatched = Order::where('status', 'dispatched')->count();
        $totalDelivered = Order::where('status', 'delivered')->count();
        $totalUndelivered = Order::where('status', '!=', 'delivered')->count();

        $totalReplacementValue = \App\Models\ReturnVoucher::where('return_type', 'physical_replacement')
            ->selectRaw('SUM(replacement_quantity * unit_price) as total')
            ->value('total') ?? 0;

        $totalOrdersValue = Order::sum('total_amount');
        $netExpectedValue = $totalOrdersValue - $totalReplacementValue;

        return $this->success([
            'totalUrgent' => $totalUrgent,
            'totalPending' => $totalPending,
            'totalDispatched' => $totalDispatched,
            'totalDelivered' => $totalDelivered,
            'totalUndelivered' => $totalUndelivered,
            'totalReplacementValue' => (float)$totalReplacementValue,
            'netExpectedValue' => (float)$netExpectedValue,
        ]);
    }

    public function index(Request $request)
    {
        $orders = Order::with(['customer.parent', 'salesStore', 'items.product', 'deliveries.driver', 'deliveries.returnSalesStore', 'returnVouchers'])
            ->when($request->search, function($q) use ($request) {
                $q->where('order_number', 'like', "%{$request->search}%")
                  ->orWhere('fiscal_document_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', function($c) use ($request) {
                      $c->where('name', 'like', "%{$request->search}%");
                  });
            })
            ->when($request->status, function($q) use ($request) {
                if ($request->status === 'missed') {
                    $q->where('status', '!=', 'delivered')
                      ->where('required_delivery_date', '<', now()->toDateString());
                } else {
                    $statuses = explode(',', $request->status);
                    if (count($statuses) > 1) {
                        $q->whereIn('status', $statuses);
                    } else {
                        $q->where('status', $request->status);
                    }
                }
            })
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->urgency, fn($q) => $q->where('urgency', $request->urgency))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fiscal_document_number' => 'nullable|string|max:255',
            'customer_id' => 'required|exists:customers,id',
            'sales_store_id' => 'required|exists:sales_stores,id',
            'order_date' => 'required|date|before_or_equal:today',
            'required_delivery_date' => 'required|date|after_or_equal:order_date',
            'urgency' => 'required|in:normal,urgent,critical',
            'order_notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.batch_reference' => 'nullable|string|max:50|regex:/^[A-Za-z0-9\-_]+$/',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'admin_override_reason' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($validated) {
            $year = date('Y');
            $maxOrder = Order::whereYear('created_at', $year)
                ->where('order_number', 'like', "LHO-{$year}-%")
                ->orderBy('order_number', 'desc')
                ->first();

            $nextSequence = 1;
            if ($maxOrder) {
                $parts = explode('-', $maxOrder->order_number);
                $lastSequence = (int)end($parts);
                $nextSequence = $lastSequence + 1;
            }

            do {
                $orderNumber = 'LHO-' . $year . '-' . str_pad($nextSequence, 4, '0', STR_PAD_LEFT);
                $nextSequence++;
            } while (Order::where('order_number', $orderNumber)->exists());

            $order = Order::create([
                'order_number' => $orderNumber,
                'fiscal_document_number' => $validated['fiscal_document_number'] ?? null,
                'customer_id' => $validated['customer_id'],
                'sales_store_id' => $validated['sales_store_id'],
                'order_date' => $validated['order_date'],
                'required_delivery_date' => $validated['required_delivery_date'],
                'urgency' => $validated['urgency'],
                'order_notes' => $validated['order_notes'] ?? null,
                'total_amount' => 0, // Will update after items
                'admin_override_reason' => $validated['admin_override_reason'] ?? null,
                'created_by' => auth()->id(),
                'status' => 'pending'
            ]);

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $lineTotal;

                $prod = \App\Models\Product::findOrFail($item['product_id']);
                $supportsBatch = $this->productSupportsBatch($prod);
                $batchRef = $supportsBatch ? ($item['batch_reference'] ?? null) : null;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'batch_reference' => $batchRef,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $lineTotal,
                ]);
            }

            $order->update(['total_amount' => $totalAmount]);

            return $this->success($order->load('items.product', 'customer'), 'Order created successfully', 201);
        });
    }

    public function show($id)
    {
        $order = Order::with([
            'customer.zone', 
            'customer.parent', 
            'salesStore', 
            'items.product', 
            'invoice', 
            'deliveries.proofs', 
            'deliveries.driver', 
            'deliveries.returnSalesStore',
            'deliveries.undoneBy',
            'statusHistory.user',
            'returnVouchers.product',
            'returnVouchers.replacementSalesStore'
        ])->findOrFail($id);
        return $this->success($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,ready_for_dispatch,dispatched',
            'notes' => 'nullable|string',
            'admin_override_reason' => 'nullable|string',
        ]);

        $order = Order::with(['items', 'invoice'])->findOrFail($id);
        
        $oldStatus = $order->status;
        $newStatus = $request->status;

        if ($oldStatus === $newStatus) {
            return $this->success($order, "Order status is already {$newStatus}");
        }

        // Trigger stock deduction and invoice raising when moving out of pending
        if ($oldStatus === 'pending' && in_array($newStatus, ['processing', 'ready_for_dispatch', 'dispatched'])) {
            try {
                return DB::transaction(function () use ($order, $newStatus, $request) {
                    $order->commitOrder($request->admin_override_reason);

                    // Transition status
                    $order->update(['status' => $newStatus]);
                    $order->statusHistory()->create([
                        'status' => $newStatus,
                        'changed_by' => auth()->id(),
                        'notes' => $request->notes,
                    ]);

                    return $this->success($order, "Order status updated to {$newStatus}");
                });
            } catch (\Exception $e) {
                return $this->error($e->getMessage(), 422);
            }
        }

        // Standard status updates (e.g. processing -> ready_for_dispatch)
        $order->update(['status' => $newStatus]);
        $order->statusHistory()->create([
            'status' => $newStatus,
            'changed_by' => auth()->id(),
            'notes' => $request->notes,
        ]);

        return $this->success($order, "Order status updated to {$newStatus}");
    }

    public function update(Request $request, $id)
    {
        $order = Order::with(['items', 'invoice'])->findOrFail($id);

        if (in_array($order->status, ['dispatched', 'delivered'])) {
            return $this->error("Cannot edit an order that has already been dispatched or delivered.", 422);
        }

        $validated = $request->validate([
            'fiscal_document_number' => 'nullable|string|max:255',
            'customer_id' => 'required|exists:customers,id',
            'sales_store_id' => 'required|exists:sales_stores,id',
            'order_date' => 'required|date',
            'required_delivery_date' => 'required|date',
            'urgency' => 'required|in:normal,urgent,critical',
            'order_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.batch_reference' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'admin_override_reason' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($order, $validated) {
            $isCommitted = ($order->status !== 'pending');

            if ($isCommitted) {
                // --- REVERT OLD ALLOCATIONS ---
                // 1. Refund stock for all old items
                foreach ($order->items as $item) {
                    $stock = \App\Models\SalesStoreStock::where('sales_store_id', $order->sales_store_id)
                        ->where('product_id', $item->product_id)
                        ->where('batch_reference', $item->batch_reference)
                        ->first();
                    if ($stock) {
                        $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                        $stock->updateStock('take', -$item->quantity, $item->product->sales_unit_price ?? $item->product->default_unit_price);
                    }
                }
                \App\Models\SalesStoreMovement::where('reference_id', $order->id)->delete();

                // 2. Adjust old customer account balance & delete old invoice/transaction
                if ($order->invoice) {
                    $oldAccount = \App\Models\CustomerAccount::where('customer_id', $order->customer_id)->first();
                    if ($oldAccount) {
                        $oldAccount->decrement('current_balance', $order->total_amount);
                        $oldAccount->decrement('total_invoiced', $order->total_amount);
                    }
                    \App\Models\AccountTransaction::where('reference_number', $order->invoice->invoice_number)->delete();
                    $order->invoice->delete();
                }
            }

            // 3. Delete old items
            $order->items()->delete();

            if ($isCommitted) {
                // --- APPLY NEW ALLOCATIONS ---
                // 4. Validate stock for all new items
                foreach ($validated['items'] as $item) {
                    $prod = \App\Models\Product::findOrFail($item['product_id']);
                    $supportsBatch = $this->productSupportsBatch($prod);
                    $batchRef = $supportsBatch ? ($item['batch_reference'] ?? null) : null;

                    if ($supportsBatch && $batchRef) {
                        $stock = \App\Models\SalesStoreStock::where('sales_store_id', $validated['sales_store_id'])
                            ->where('product_id', $item['product_id'])
                            ->where('batch_reference', $batchRef)
                            ->first();
                        $ledger = \App\Models\SalesStoreStock::getLedgerStock($validated['sales_store_id'], $item['product_id'], $batchRef);
                        $raw = $stock ? (float)$stock->current_quantity : 0.0;
                        $available = max($ledger, $raw);
                    } else {
                        $stocksQuery = \App\Models\SalesStoreStock::where('sales_store_id', $validated['sales_store_id'])
                            ->where('product_id', $item['product_id'])
                            ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'));
                        
                        $raw = (float)$stocksQuery->sum('current_quantity');
                        
                        $batches = (clone $stocksQuery)->pluck('batch_reference')->unique();
                        
                        $ledger = 0.0;
                        foreach ($batches as $bRef) {
                            $ledger += \App\Models\SalesStoreStock::getLedgerStock($validated['sales_store_id'], $item['product_id'], $bRef);
                        }
                        if ($batches->isEmpty()) {
                            $ledger = \App\Models\SalesStoreStock::getLedgerStock($validated['sales_store_id'], $item['product_id'], null);
                        }
                        
                        $available = max($ledger, $raw);
                    }
                    
                    if ($available < (float) $item['quantity'] && empty($validated['admin_override_reason'])) {
                        $productName = $prod->name;
                        $batchStr = $batchRef ? " (Batch: {$batchRef})" : "";
                        return $this->error("Insufficient stock for {$productName}{$batchStr} in the selected sales store (Available: {$available}).", 422);
                    }
                }
            }

            // 5. Update order details
            $order->update([
                'fiscal_document_number' => $validated['fiscal_document_number'] ?? null,
                'customer_id' => $validated['customer_id'],
                'sales_store_id' => $validated['sales_store_id'],
                'order_date' => $validated['order_date'],
                'required_delivery_date' => $validated['required_delivery_date'],
                'urgency' => $validated['urgency'],
                'order_notes' => $validated['order_notes'] ?? null,
                'admin_override_reason' => $validated['admin_override_reason'] ?? null,
            ]);

            // 6. Create new items and debit stock (if committed)
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $lineTotal;

                $prod = \App\Models\Product::findOrFail($item['product_id']);
                $supportsBatch = $this->productSupportsBatch($prod);
                $batchRef = $supportsBatch ? ($item['batch_reference'] ?? null) : null;

                if ($isCommitted) {
                    if ($supportsBatch && $batchRef) {
                        OrderItem::create([
                            'order_id' => $order->id,
                            'product_id' => $item['product_id'],
                            'batch_reference' => $batchRef,
                            'quantity' => $item['quantity'],
                            'unit_price' => $item['unit_price'],
                            'line_total' => $lineTotal,
                        ]);

                        $stock = \App\Models\SalesStoreStock::firstOrCreate(
                            [
                                'sales_store_id' => $validated['sales_store_id'],
                                'product_id' => $item['product_id'],
                                'batch_reference' => $batchRef,
                            ],
                            ['current_quantity' => 0, 'updated_by' => auth()->id()]
                        );
                        $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                        $stock->updateStock('take', $item['quantity'], $prod->sales_unit_price ?? $prod->default_unit_price);

                        \App\Models\SalesStoreMovement::create([
                            'movement_date' => $validated['order_date'],
                            'sales_store_id' => $validated['sales_store_id'],
                            'product_id' => $item['product_id'],
                            'batch_reference' => $batchRef,
                            'movement_type' => 'dispatch_out',
                            'quantity' => $item['quantity'],
                            'reference_id' => $order->id,
                            'created_by' => auth()->id(),
                            'notes' => "Sold for Order: " . $order->order_number . " (Updated)",
                        ]);
                    } else {
                        $remainingToDebit = $item['quantity'];
                        $stocks = \App\Models\SalesStoreStock::where('sales_store_id', $validated['sales_store_id'])
                            ->where('product_id', $item['product_id'])
                            ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                            ->where('current_quantity', '>', 0)
                            ->orderBy('created_at', 'asc')
                            ->get();

                        if ($stocks->isEmpty()) {
                            $stock = \App\Models\SalesStoreStock::firstOrCreate(
                                [
                                    'sales_store_id' => $validated['sales_store_id'],
                                    'product_id' => $item['product_id'],
                                    'batch_reference' => null,
                                ],
                                ['current_quantity' => 0, 'updated_by' => auth()->id()]
                            );
                            $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                            $stock->updateStock('take', $remainingToDebit, $prod->sales_unit_price ?? $prod->default_unit_price);

                            OrderItem::create([
                                'order_id' => $order->id,
                                'product_id' => $item['product_id'],
                                'batch_reference' => null,
                                'quantity' => $remainingToDebit,
                                'unit_price' => $item['unit_price'],
                                'line_total' => $lineTotal,
                            ]);

                            \App\Models\SalesStoreMovement::create([
                                'movement_date' => $validated['order_date'],
                                'sales_store_id' => $validated['sales_store_id'],
                                'product_id' => $item['product_id'],
                                'batch_reference' => null,
                                'movement_type' => 'dispatch_out',
                                'quantity' => $remainingToDebit,
                                'reference_id' => $order->id,
                                'created_by' => auth()->id(),
                                'notes' => "Sold for Order: " . $order->order_number . " (Stock Override - Updated)",
                            ]);
                        } else {
                            foreach ($stocks as $stock) {
                                if ($remainingToDebit <= 0) break;

                                $debitAmount = min($stock->current_quantity, $remainingToDebit);
                                $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                                $stock->updateStock('take', $debitAmount, $prod->sales_unit_price ?? $prod->default_unit_price);

                                $segmentBatch = $stock->batch_reference;
                                $segmentLineTotal = $debitAmount * $item['unit_price'];

                                OrderItem::create([
                                    'order_id' => $order->id,
                                    'product_id' => $item['product_id'],
                                    'batch_reference' => $segmentBatch,
                                    'quantity' => $debitAmount,
                                    'unit_price' => $item['unit_price'],
                                    'line_total' => $segmentLineTotal,
                                ]);

                                \App\Models\SalesStoreMovement::create([
                                    'movement_date' => $validated['order_date'],
                                    'sales_store_id' => $validated['sales_store_id'],
                                    'product_id' => $item['product_id'],
                                    'batch_reference' => $segmentBatch,
                                    'movement_type' => 'dispatch_out',
                                    'quantity' => $debitAmount,
                                    'reference_id' => $order->id,
                                    'created_by' => auth()->id(),
                                    'notes' => "Sold for Order: " . $order->order_number . ($segmentBatch ? " (FIFO Batch: {$segmentBatch} - Updated)" : " (Updated)"),
                                ]);

                                $remainingToDebit -= $debitAmount;
                            }

                            if ($remainingToDebit > 0) {
                                $lastStock = $stocks->last();
                                $lastStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                                $lastStock->updateStock('take', $remainingToDebit, $prod->sales_unit_price ?? $prod->default_unit_price);

                                OrderItem::create([
                                    'order_id' => $order->id,
                                    'product_id' => $item['product_id'],
                                    'batch_reference' => $lastStock->batch_reference,
                                    'quantity' => $remainingToDebit,
                                    'unit_price' => $item['unit_price'],
                                    'line_total' => $remainingToDebit * $item['unit_price'],
                                ]);

                                \App\Models\SalesStoreMovement::create([
                                    'movement_date' => $validated['order_date'],
                                    'sales_store_id' => $validated['sales_store_id'],
                                    'product_id' => $item['product_id'],
                                    'batch_reference' => $lastStock->batch_reference,
                                    'movement_type' => 'dispatch_out',
                                    'quantity' => $remainingToDebit,
                                    'reference_id' => $order->id,
                                    'created_by' => auth()->id(),
                                    'notes' => "Sold for Order: " . $order->order_number . " (FIFO Override Spill - Updated)",
                                ]);
                            }
                        }
                    }
                } else {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'batch_reference' => $batchRef,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'line_total' => $lineTotal,
                    ]);
                }
            }

            $order->update(['total_amount' => $totalAmount]);

            if ($isCommitted) {
                // Re-generate invoice
                $invoiceNumber = 'LHI-' . date('Y') . '-' . str_pad(Invoice::whereYear('created_at', date('Y'))->count() + 1, 4, '0', STR_PAD_LEFT);
                Invoice::create([
                    'invoice_number' => $invoiceNumber,
                    'order_id' => $order->id,
                    'customer_id' => $order->customer_id,
                    'issue_date' => now(),
                    'due_date' => now()->addDays(7),
                    'subtotal' => $totalAmount,
                    'tax_amount' => 0,
                    'total_amount' => $totalAmount,
                    'payment_method' => 'cash',
                    'status' => 'unpaid',
                    'created_by' => auth()->id(),
                ]);

                // Update Customer Account Balance
                $account = \App\Models\CustomerAccount::firstOrCreate(
                    ['customer_id' => $order->customer_id],
                    ['current_balance' => 0, 'total_invoiced' => 0, 'total_paid' => 0]
                );
                $account->increment('current_balance', $totalAmount);
                $account->increment('total_invoiced', $totalAmount);

                // Log Account Transaction
                \App\Models\AccountTransaction::create([
                    'customer_id' => $order->customer_id,
                    'type' => 'invoice_raised',
                    'reference_number' => $invoiceNumber,
                    'description' => "Invoice raised for Updated Order: " . $order->order_number,
                    'debit_amount' => $totalAmount,
                    'running_balance' => $account->current_balance,
                    'transaction_date' => now()->toDateString(),
                    'created_by' => auth()->id(),
                ]);
            }

            return $this->success($order->load('items.product', 'customer'), 'Order updated successfully');
        });
    }

    public function destroy($id)
    {
        $order = Order::with(['items', 'invoice'])->findOrFail($id);

        if (in_array($order->status, ['dispatched', 'delivered'])) {
            return $this->error("Cannot delete an order that has already been dispatched or delivered.", 422);
        }

        return DB::transaction(function () use ($order) {
            $isCommitted = ($order->status !== 'pending');

            if ($isCommitted) {
                // 1. Refund stock for all items and delete movements
                foreach ($order->items as $item) {
                    $stock = \App\Models\SalesStoreStock::where('sales_store_id', $order->sales_store_id)
                        ->where('product_id', $item->product_id)
                        ->where('batch_reference', $item->batch_reference)
                        ->first();
                    if ($stock) {
                        $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                        $stock->updateStock('take', -$item->quantity, $item->product->sales_unit_price ?? $item->product->default_unit_price);
                    }
                }
                \App\Models\SalesStoreMovement::where('reference_id', $order->id)->delete();

                // 2. Adjust Customer Account & Invoice
                if ($order->invoice) {
                    $account = \App\Models\CustomerAccount::where('customer_id', $order->customer_id)->first();
                    if ($account) {
                        $account->decrement('current_balance', $order->total_amount);
                        $account->decrement('total_invoiced', $order->total_amount);
                    }
                    \App\Models\AccountTransaction::where('reference_number', $order->invoice->invoice_number)->delete();
                    $order->invoice->delete();
                }
            }

            // 3. Delete status history, items, and order
            $order->statusHistory()->delete();
            $order->items()->delete();
            $order->delete();

            return $this->success(null, 'Order deleted successfully');
        });
    }

    public function updateFdn(Request $request, $id)
    {
        $validated = $request->validate([
            'fiscal_document_number' => 'nullable|string|max:255',
        ]);

        $order = Order::findOrFail($id);
        $order->update([
            'fiscal_document_number' => $validated['fiscal_document_number'] ?? null,
        ]);

        return $this->success($order, 'Fiscal Document Number updated successfully');
    }

    private function productSupportsBatch($product)
    {
        if ($product->category === 'eggs') {
            return true;
        }
        if ($product->category === 'poultry' && $product->code !== 'POU-LVE') {
            return true;
        }
        return false;
    }
}
