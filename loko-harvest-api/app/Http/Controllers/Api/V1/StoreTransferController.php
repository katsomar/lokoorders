<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StoreTransfer;
use App\Models\ProductionStoreStock;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreTransferController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $status = $request->status ?? 'approved';

        $query = StoreTransfer::with(['product', 'user', 'productionStore', 'salesStore'])
            ->where('status', $status)
            ->when($request->production_store_id, fn($q) => $q->where('production_store_id', $request->production_store_id))
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->when($request->start_date, fn($q) => $q->whereDate('transfer_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('transfer_date', '<=', $request->end_date));

        // Calculate aggregates on the database level
        $totalQty = (float)$query->sum('quantity');
        $totalVal = (float)$query->sum(DB::raw('quantity * unit_price'));

        $totalQtyTrays = (float)StoreTransfer::join('products', 'store_transfers.product_id', '=', 'products.id')
            ->where('store_transfers.status', $status)
            ->when($request->production_store_id, fn($q) => $q->where('store_transfers.production_store_id', $request->production_store_id))
            ->when($request->product_id, fn($q) => $q->where('store_transfers.product_id', $request->product_id))
            ->when($request->start_date, fn($q) => $q->whereDate('store_transfers.transfer_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('store_transfers.transfer_date', '<=', $request->end_date))
            ->where('products.unit_of_measure', 'trays')
            ->sum('store_transfers.quantity');

        $totalQtyOthers = $totalQty - $totalQtyTrays;

        $productValues = DB::table('store_transfers')
            ->join('products', 'store_transfers.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(store_transfers.quantity * store_transfers.unit_price) as value'))
            ->where('store_transfers.status', $status)
            ->when($request->production_store_id, fn($q) => $q->where('store_transfers.production_store_id', $request->production_store_id))
            ->when($request->product_id, fn($q) => $q->where('store_transfers.product_id', $request->product_id))
            ->when($request->start_date, fn($q) => $q->whereDate('store_transfers.transfer_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('store_transfers.transfer_date', '<=', $request->end_date))
            ->groupBy('products.name')
            ->pluck('value', 'products.name')
            ->toArray();

        foreach ($productValues as $k => $v) {
            $productValues[$k] = (float)$v;
        }

        $transfers = $query->latest()->paginate($request->per_page ?? 15);

        $response = $transfers->toArray();
        $response['aggregates'] = [
            'total_quantity' => $totalQty,
            'total_quantity_trays' => $totalQtyTrays,
            'total_quantity_others' => $totalQtyOthers,
            'total_valuation' => $totalVal,
            'count' => $transfers->total(),
            'product_values' => $productValues
        ];

        return $this->success($response);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'production_store_id' => 'required|exists:production_stores,id',
            'sales_store_id' => 'required|exists:sales_stores,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'batch_reference' => 'nullable|string',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $product = \App\Models\Product::findOrFail($validated['product_id']);
        $allowedCodes = ['EGG-WHT', 'EGG-BRN', 'EGG-CRM', 'POU-DRS', 'POU-LVE', 'BY-MNR'];
        if (!in_array($product->code, $allowedCodes)) {
            return $this->error('Only white plain trays, brown plain trays, cream plain trays, live chicken, dressed chicken, and manure can be transferred from production to sales stores.', 422);
        }

        $supportsBatch = $this->productSupportsBatch($product);
        $batchRef = $supportsBatch ? ($validated['batch_reference'] ?? null) : null;

        $user = auth()->user() ?? \App\Models\User::first();

        // If the user is an order manager, we only save it as a pending request.
        if ($user && $user->role === 'order_manager') {
            $firstStock = ProductionStoreStock::where('production_store_id', $validated['production_store_id'])
                ->where('product_id', $validated['product_id'])
                ->when($supportsBatch && $batchRef, fn($q) => $q->where('batch_reference', $batchRef))
                ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                ->where('current_quantity', '>', 0)
                ->orderBy('created_at', 'asc')
                ->first();

            $transferPrice = $firstStock && $firstStock->valuation_price ? $firstStock->valuation_price : ($product->production_unit_price ?? $product->default_unit_price);

            $transfer = StoreTransfer::create([
                'transfer_date' => $validated['transfer_date'],
                'production_store_id' => $validated['production_store_id'],
                'sales_store_id' => $validated['sales_store_id'],
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'unit_price' => $transferPrice,
                'batch_reference' => $batchRef,
                'transferred_by' => $user->id,
                'notes' => $validated['notes'],
                'status' => 'pending',
            ]);

            return $this->success($transfer, 'Stock transfer request submitted successfully and is pending approval.', 201);
        }

        return DB::transaction(function () use ($validated, $product, $supportsBatch, $batchRef, $user) {
            $fromStoreId = $validated['production_store_id'];
            $toStoreId = $validated['sales_store_id'];
            $productId = $validated['product_id'];
            $qty = $validated['quantity'];

            // 1. Check production stock for this specific store
            if ($supportsBatch && $batchRef) {
                // Check specific batch stock
                $productionStock = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->where('batch_reference', $batchRef)
                    ->first();

                $availableQty = $productionStock ? (float) $productionStock->current_quantity : 0.0;
                if ($availableQty < $qty) {
                    return $this->error('Insufficient stock in the specified batch at the production store', 422, [
                        'available' => $availableQty
                    ]);
                }
            } else {
                // Check total stock (if FIFO or unbatched)
                $totalQuantity = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                    ->sum('current_quantity');
                
                if ($totalQuantity < $qty) {
                    return $this->error('Insufficient production store stock at the specified store', 422, [
                        'available' => $totalQuantity
                    ]);
                }
            }

            // 2. Resolve transfer unit price (production valuation rate)
            $firstStock = ProductionStoreStock::where('production_store_id', $fromStoreId)
                ->where('product_id', $productId)
                ->when($supportsBatch && $batchRef, fn($q) => $q->where('batch_reference', $batchRef))
                ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                ->where('current_quantity', '>', 0)
                ->orderBy('created_at', 'asc')
                ->first();

            $transferPrice = $firstStock && $firstStock->valuation_price ? $firstStock->valuation_price : ($product->production_unit_price ?? $product->default_unit_price);

            // 3. Debit production stock and credit sales stock
            if ($supportsBatch && $batchRef) {
                // Move specific batch
                $productionStock->update(['updated_by' => $user->id, 'last_updated' => now()]);
                $productionStock->updateStock('take', $qty);

                // Create transfer record
                $transfer = StoreTransfer::create([
                    'transfer_date' => $validated['transfer_date'],
                    'production_store_id' => $fromStoreId,
                    'sales_store_id' => $toStoreId,
                    'product_id' => $productId,
                    'quantity' => $qty,
                    'unit_price' => $transferPrice,
                    'batch_reference' => $batchRef,
                    'transferred_by' => $user->id,
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'notes' => $validated['notes'],
                ]);

                // Credit sales stock
                $salesStock = SalesStoreStock::firstOrCreate(
                    [
                        'sales_store_id' => $toStoreId,
                        'product_id' => $productId,
                        'batch_reference' => $batchRef
                    ],
                    ['current_quantity' => 0, 'updated_by' => $user->id]
                );
                $salesStock->update(['updated_by' => $user->id, 'last_updated' => now()]);
                $salesStock->updateStock('transfer_in', $qty, $transferPrice);

                // Log movement in sales store
                SalesStoreMovement::create([
                    'movement_date' => $validated['transfer_date'],
                    'sales_store_id' => $toStoreId,
                    'product_id' => $productId,
                    'batch_reference' => $batchRef,
                    'movement_type' => 'transfer_in',
                    'quantity' => $qty,
                    'reference_id' => $transfer->id,
                    'created_by' => $user->id,
                ]);

                return $this->success($transfer, 'Stock transferred successfully', 201);
            } else {
                // FIFO Debit across batches (or unbatched transfer)
                $remainingToDebit = $qty;
                $stocks = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                    ->where('current_quantity', '>', 0)
                    ->orderBy('created_at', 'asc')
                    ->get();

                $transfers = [];

                foreach ($stocks as $stock) {
                    if ($remainingToDebit <= 0) break;

                    $debitAmount = min($stock->current_quantity, $remainingToDebit);
                    $stock->update(['updated_by' => $user->id, 'last_updated' => now()]);
                    $stock->updateStock('take', $debitAmount);
                    
                    $currentBatch = $stock->batch_reference; // null for unbatched

                    // Create transfer record segment
                    $transfer = StoreTransfer::create([
                        'transfer_date' => $validated['transfer_date'],
                        'production_store_id' => $fromStoreId,
                        'sales_store_id' => $toStoreId,
                        'product_id' => $productId,
                        'quantity' => $debitAmount,
                        'unit_price' => $stock->valuation_price ?: $transferPrice,
                        'batch_reference' => $currentBatch,
                        'transferred_by' => $user->id,
                        'status' => 'approved',
                        'approved_by' => $user->id,
                        'approved_at' => now(),
                        'notes' => ($validated['notes'] ?? '') . ($currentBatch ? " (FIFO Split from batch: {$currentBatch})" : ""),
                    ]);

                    // Credit sales stock
                    $salesStock = SalesStoreStock::firstOrCreate(
                        [
                            'sales_store_id' => $toStoreId,
                            'product_id' => $productId,
                            'batch_reference' => $currentBatch
                        ],
                        ['current_quantity' => 0, 'updated_by' => $user->id]
                    );
                    $salesStock->update(['updated_by' => $user->id, 'last_updated' => now()]);
                    $salesStock->updateStock('transfer_in', $debitAmount, $stock->valuation_price ?: $transferPrice);

                    // Log movement in sales store
                    SalesStoreMovement::create([
                        'movement_date' => $validated['transfer_date'],
                        'sales_store_id' => $toStoreId,
                        'product_id' => $productId,
                        'batch_reference' => $currentBatch,
                        'movement_type' => 'transfer_in',
                        'quantity' => $debitAmount,
                        'reference_id' => $transfer->id,
                        'created_by' => $user->id,
                    ]);

                    $transfers[] = $transfer;
                    $remainingToDebit -= $debitAmount;
                }

                return $this->success($transfers, 'Stock transferred successfully via FIFO', 201);
            }
        });
    }

    public function approve($id)
    {
        $transfer = StoreTransfer::findOrFail($id);

        if ($transfer->status !== 'pending') {
            return $this->error('This transfer request has already been processed.', 422);
        }

        $product = \App\Models\Product::findOrFail($transfer->product_id);
        $supportsBatch = $this->productSupportsBatch($product);
        $batchRef = $transfer->batch_reference;

        $user = auth()->user() ?? \App\Models\User::first();

        return DB::transaction(function () use ($transfer, $product, $supportsBatch, $batchRef, $user) {
            $fromStoreId = $transfer->production_store_id;
            $toStoreId = $transfer->sales_store_id;
            $productId = $transfer->product_id;
            $qty = $transfer->quantity;

            // 1. Check production stock for this specific store
            if ($supportsBatch && $batchRef) {
                // Check specific batch stock
                $productionStock = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->where('batch_reference', $batchRef)
                    ->first();

                $availableQty = $productionStock ? (float) $productionStock->current_quantity : 0.0;
                if ($availableQty < $qty) {
                    return $this->error('Insufficient stock in the specified batch at the production store', 422, [
                        'available' => $availableQty
                    ]);
                }

                // Debit production stock
                $productionStock->update(['updated_by' => $user->id, 'last_updated' => now()]);
                $productionStock->updateStock('take', $qty);

                // Update the pending transfer request to approved
                $transfer->update([
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                ]);

                // Credit sales stock
                $salesStock = SalesStoreStock::firstOrCreate(
                    [
                        'sales_store_id' => $toStoreId,
                        'product_id' => $productId,
                        'batch_reference' => $batchRef
                    ],
                    ['current_quantity' => 0, 'updated_by' => $user->id]
                );
                $salesStock->update(['updated_by' => $user->id, 'last_updated' => now()]);
                $salesStock->updateStock('transfer_in', $qty, $transfer->unit_price);

                // Log movement in sales store
                SalesStoreMovement::create([
                    'movement_date' => $transfer->transfer_date,
                    'sales_store_id' => $toStoreId,
                    'product_id' => $productId,
                    'batch_reference' => $batchRef,
                    'movement_type' => 'transfer_in',
                    'quantity' => $qty,
                    'reference_id' => $transfer->id,
                    'created_by' => $user->id,
                ]);

                return $this->success($transfer->load(['product', 'user', 'productionStore', 'salesStore']), 'Stock transfer request approved successfully', 200);
            } else {
                // Check total stock (FIFO or unbatched)
                $totalQuantity = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                    ->sum('current_quantity');
                
                if ($totalQuantity < $qty) {
                    return $this->error('Insufficient production store stock at the specified store', 422, [
                        'available' => $totalQuantity
                    ]);
                }

                // FIFO Debit across batches (or unbatched transfer)
                $remainingToDebit = $qty;
                $stocks = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                    ->where('current_quantity', '>', 0)
                    ->orderBy('created_at', 'asc')
                    ->get();

                $transfersList = [];
                $isFirstSegment = true;

                foreach ($stocks as $stock) {
                    if ($remainingToDebit <= 0) break;

                    $debitAmount = min($stock->current_quantity, $remainingToDebit);
                    $stock->update(['updated_by' => $user->id, 'last_updated' => now()]);
                    $stock->updateStock('take', $debitAmount);
                    
                    $currentBatch = $stock->batch_reference; // null for unbatched

                    $segmentPrice = $stock->valuation_price ?: $transfer->unit_price;

                    if ($isFirstSegment) {
                        // Reuse the original pending transfer record for the first batch segment
                        $transfer->update([
                            'quantity' => $debitAmount,
                            'unit_price' => $segmentPrice,
                            'batch_reference' => $currentBatch,
                            'status' => 'approved',
                            'approved_by' => $user->id,
                            'approved_at' => now(),
                            'notes' => ($transfer->notes ?? '') . ($currentBatch ? " (FIFO Split from batch: {$currentBatch})" : ""),
                        ]);
                        $currentTransferRecord = $transfer;
                        $isFirstSegment = false;
                    } else {
                        // Create a new approved transfer record for subsequent batch segments
                        $currentTransferRecord = StoreTransfer::create([
                            'transfer_date' => $transfer->transfer_date,
                            'production_store_id' => $fromStoreId,
                            'sales_store_id' => $toStoreId,
                            'product_id' => $productId,
                            'quantity' => $debitAmount,
                            'unit_price' => $segmentPrice,
                            'batch_reference' => $currentBatch,
                            'transferred_by' => $transfer->transferred_by,
                            'status' => 'approved',
                            'approved_by' => $user->id,
                            'approved_at' => now(),
                            'notes' => ($transfer->notes ?? '') . ($currentBatch ? " (FIFO Split from batch: {$currentBatch})" : ""),
                        ]);
                    }

                    // Credit sales stock
                    $salesStock = SalesStoreStock::firstOrCreate(
                        [
                            'sales_store_id' => $toStoreId,
                            'product_id' => $productId,
                            'batch_reference' => $currentBatch
                        ],
                        ['current_quantity' => 0, 'updated_by' => $user->id]
                    );
                    $salesStock->update(['updated_by' => $user->id, 'last_updated' => now()]);
                    $salesStock->updateStock('transfer_in', $debitAmount, $segmentPrice);

                    // Log movement in sales store
                    SalesStoreMovement::create([
                        'movement_date' => $transfer->transfer_date,
                        'sales_store_id' => $toStoreId,
                        'product_id' => $productId,
                        'batch_reference' => $currentBatch,
                        'movement_type' => 'transfer_in',
                        'quantity' => $debitAmount,
                        'reference_id' => $currentTransferRecord->id,
                        'created_by' => $user->id,
                    ]);

                    $transfersList[] = $currentTransferRecord;
                    $remainingToDebit -= $debitAmount;
                }

                return $this->success($transfersList, 'Stock transfer request approved successfully and processed via FIFO', 200);
            }
        });
    }

    public function reject(Request $request, $id)
    {
        $transfer = StoreTransfer::findOrFail($id);

        if ($transfer->status !== 'pending') {
            return $this->error('This transfer request has already been processed.', 422);
        }

        $user = auth()->user() ?? \App\Models\User::first();

        $transfer->update([
            'status' => 'rejected',
            'rejected_by' => $user->id,
            'rejected_at' => now(),
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return $this->success($transfer->load(['product', 'user', 'productionStore', 'salesStore']), 'Stock transfer request rejected successfully.');
    }

    private function productSupportsBatch($product)
    {
        // Eggs: category = 'eggs'
        // Poultry: category = 'poultry' (except POU-LVE)
        if ($product->category === 'eggs') {
            return true;
        }
        if ($product->category === 'poultry' && $product->code !== 'POU-LVE') {
            return true;
        }
        return false;
    }
}
