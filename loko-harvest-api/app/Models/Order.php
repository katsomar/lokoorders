<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesStore()
    {
        return $this->belongsTo(SalesStore::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }

    public function returnVouchers()
    {
        return $this->hasMany(ReturnVoucher::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function productSupportsBatch($product)
    {
        if ($product->category === 'eggs') {
            return true;
        }
        if ($product->category === 'poultry' && $product->code !== 'POU-LVE') {
            return true;
        }
        return false;
    }

    public function commitOrder($adminOverrideReason = null)
    {
        if ($this->invoice()->exists()) {
            return;
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($adminOverrideReason) {
            // 1. Validate stock availability
            foreach ($this->items as $item) {
                $prod = \App\Models\Product::findOrFail($item->product_id);
                $supportsBatch = $this->productSupportsBatch($prod);
                $batchRef = $supportsBatch ? ($item->batch_reference ?? null) : null;

                if ($supportsBatch && $batchRef) {
                    $stock = \App\Models\SalesStoreStock::where('sales_store_id', $this->sales_store_id)
                        ->where('product_id', $item->product_id)
                        ->where('batch_reference', $batchRef)
                        ->first();
                    $ledger = \App\Models\SalesStoreStock::getLedgerStock($this->sales_store_id, $item->product_id, $batchRef);
                    $raw = $stock ? (float)$stock->current_quantity : 0.0;
                    $available = max($ledger, $raw);
                } else {
                    $stocksQuery = \App\Models\SalesStoreStock::where('sales_store_id', $this->sales_store_id)
                        ->where('product_id', $item->product_id)
                        ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'));
                    
                    $raw = (float)$stocksQuery->sum('current_quantity');
                    
                    $batches = (clone $stocksQuery)->pluck('batch_reference')->unique();
                    
                    $ledger = 0.0;
                    foreach ($batches as $bRef) {
                        $ledger += \App\Models\SalesStoreStock::getLedgerStock($this->sales_store_id, $item->product_id, $bRef);
                    }
                    if ($batches->isEmpty()) {
                        $ledger = \App\Models\SalesStoreStock::getLedgerStock($this->sales_store_id, $item->product_id, null);
                    }
                    
                    $available = max($ledger, $raw);
                }
                
                $overrideReason = $adminOverrideReason ?? $this->admin_override_reason;
                if ($available < (float) $item->quantity && empty($overrideReason)) {
                    $productName = $prod->name;
                    $batchStr = $batchRef ? " (Batch: {$batchRef})" : "";
                    throw new \Exception("Insufficient stock for {$productName}{$batchStr} in the selected sales store (Available: {$available}). Admin override reason required.");
                }
            }

            if ($adminOverrideReason) {
                $this->update(['admin_override_reason' => $adminOverrideReason]);
            }

            // 2. Debit stock and log movements
            foreach ($this->items as $item) {
                $prod = \App\Models\Product::findOrFail($item->product_id);
                $supportsBatch = $this->productSupportsBatch($prod);
                $batchRef = $supportsBatch ? ($item->batch_reference ?? null) : null;

                $userId = auth()->id() ?? (\App\Models\User::where('role', 'admin')->first()?->id ?? 1);

                if ($supportsBatch && $batchRef) {
                    $stock = \App\Models\SalesStoreStock::firstOrCreate(
                        [
                            'sales_store_id' => $this->sales_store_id,
                            'product_id' => $item->product_id,
                            'batch_reference' => $batchRef,
                        ],
                        ['current_quantity' => 0, 'updated_by' => $userId]
                    );
                    $stock->update(['updated_by' => $userId, 'last_updated' => now()]);
                    $stock->updateStock('take', $item->quantity, $prod->sales_unit_price ?? $prod->default_unit_price);

                    \App\Models\SalesStoreMovement::create([
                        'movement_date' => $this->order_date,
                        'sales_store_id' => $this->sales_store_id,
                        'product_id' => $item->product_id,
                        'batch_reference' => $batchRef,
                        'movement_type' => 'dispatch_out',
                        'quantity' => $item->quantity,
                        'reference_id' => $this->id,
                        'created_by' => $userId,
                        'notes' => "Sold for Order: " . $this->order_number,
                    ]);
                } else {
                    $remainingToDebit = $item->quantity;
                    $stocks = \App\Models\SalesStoreStock::where('sales_store_id', $this->sales_store_id)
                        ->where('product_id', $item->product_id)
                        ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                        ->where('current_quantity', '>', 0)
                        ->orderBy('created_at', 'asc')
                        ->get();

                    if ($stocks->isEmpty()) {
                        $stock = \App\Models\SalesStoreStock::firstOrCreate(
                            [
                                'sales_store_id' => $this->sales_store_id,
                                'product_id' => $item->product_id,
                                'batch_reference' => null,
                            ],
                            ['current_quantity' => 0, 'updated_by' => $userId]
                        );
                        $stock->update(['updated_by' => $userId, 'last_updated' => now()]);
                        $stock->updateStock('take', $remainingToDebit, $prod->sales_unit_price ?? $prod->default_unit_price);

                        $item->update(['batch_reference' => null]);

                        \App\Models\SalesStoreMovement::create([
                            'movement_date' => $this->order_date,
                            'sales_store_id' => $this->sales_store_id,
                            'product_id' => $item->product_id,
                            'batch_reference' => null,
                            'movement_type' => 'dispatch_out',
                            'quantity' => $remainingToDebit,
                            'reference_id' => $this->id,
                            'created_by' => $userId,
                            'notes' => "Sold for Order: " . $this->order_number . " (Stock Override)",
                        ]);
                    } else {
                        $first = true;
                        $itemUnitPrice = $item->unit_price;

                        foreach ($stocks as $stock) {
                            if ($remainingToDebit <= 0) break;

                            $debitAmount = min($stock->current_quantity, $remainingToDebit);
                            $stock->update(['updated_by' => $userId, 'last_updated' => now()]);
                            $stock->updateStock('take', $debitAmount, $prod->sales_unit_price ?? $prod->default_unit_price);

                            $segmentBatch = $stock->batch_reference;

                            if ($first) {
                                $item->update([
                                    'batch_reference' => $segmentBatch,
                                    'quantity' => $debitAmount,
                                    'line_total' => $debitAmount * $itemUnitPrice
                                ]);
                                $first = false;
                            } else {
                                \App\Models\OrderItem::create([
                                    'order_id' => $this->id,
                                    'product_id' => $item->product_id,
                                    'batch_reference' => $segmentBatch,
                                    'quantity' => $debitAmount,
                                    'unit_price' => $itemUnitPrice,
                                    'line_total' => $debitAmount * $itemUnitPrice,
                                ]);
                            }

                            \App\Models\SalesStoreMovement::create([
                                'movement_date' => $this->order_date,
                                'sales_store_id' => $this->sales_store_id,
                                'product_id' => $item->product_id,
                                'batch_reference' => $segmentBatch,
                                'movement_type' => 'dispatch_out',
                                'quantity' => $debitAmount,
                                'reference_id' => $this->id,
                                'created_by' => $userId,
                                'notes' => "Sold for Order: " . $this->order_number . ($segmentBatch ? " (FIFO Batch: {$segmentBatch})" : ""),
                            ]);

                            $remainingToDebit -= $debitAmount;
                        }

                        if ($remainingToDebit > 0) {
                            $lastStock = $stocks->last();
                            $lastStock->update(['updated_by' => $userId, 'last_updated' => now()]);
                            $lastStock->updateStock('take', $remainingToDebit, $prod->sales_unit_price ?? $prod->default_unit_price);

                            if ($first) {
                                $item->update([
                                    'batch_reference' => $lastStock->batch_reference,
                                    'quantity' => $remainingToDebit,
                                    'line_total' => $remainingToDebit * $itemUnitPrice
                                ]);
                            } else {
                                \App\Models\OrderItem::create([
                                    'order_id' => $this->id,
                                    'product_id' => $item->product_id,
                                    'batch_reference' => $lastStock->batch_reference,
                                    'quantity' => $remainingToDebit,
                                    'unit_price' => $itemUnitPrice,
                                    'line_total' => $remainingToDebit * $itemUnitPrice,
                                ]);
                            }

                            \App\Models\SalesStoreMovement::create([
                                'movement_date' => $this->order_date,
                                'sales_store_id' => $this->sales_store_id,
                                'product_id' => $item->product_id,
                                'batch_reference' => $lastStock->batch_reference,
                                'movement_type' => 'dispatch_out',
                                'quantity' => $remainingToDebit,
                                'reference_id' => $this->id,
                                'created_by' => $userId,
                                'notes' => "Sold for Order: " . $this->order_number . " (FIFO Override Spill)",
                            ]);
                        }
                    }
                }
            }

            // 3. Generate invoice
            $invoiceNumber = 'LHI-' . date('Y') . '-' . str_pad(\App\Models\Invoice::whereYear('created_at', date('Y'))->count() + 1, 4, '0', STR_PAD_LEFT);
            \App\Models\Invoice::create([
                'invoice_number' => $invoiceNumber,
                'order_id' => $this->id,
                'customer_id' => $this->customer_id,
                'issue_date' => now(),
                'due_date' => now()->addDays(7),
                'subtotal' => $this->total_amount,
                'tax_amount' => 0,
                'total_amount' => $this->total_amount,
                'payment_method' => 'cash',
                'status' => 'unpaid',
                'created_by' => $userId,
            ]);

            // 4. Update Customer Account Balance
            $account = \App\Models\CustomerAccount::firstOrCreate(
                ['customer_id' => $this->customer_id],
                ['current_balance' => 0, 'total_invoiced' => 0, 'total_paid' => 0]
            );
            $account->increment('current_balance', $this->total_amount);
            $account->increment('total_invoiced', $this->total_amount);

            // 5. Log Account Transaction
            \App\Models\AccountTransaction::create([
                'customer_id' => $this->customer_id,
                'type' => 'invoice_raised',
                'reference_number' => $invoiceNumber,
                'description' => "Invoice raised for Order: " . $this->order_number,
                'debit_amount' => $this->total_amount,
                'running_balance' => $account->current_balance,
                'transaction_date' => now()->toDateString(),
                'created_by' => $userId,
            ]);
        });
    }

    public function deductStockForRedispatch()
    {
        \Illuminate\Support\Facades\DB::transaction(function () {
            $userId = auth()->id() ?? 1;

            foreach ($this->items as $item) {
                $stock = \App\Models\SalesStoreStock::firstOrCreate(
                    [
                        'sales_store_id' => $this->sales_store_id,
                        'product_id' => $item->product_id,
                        'batch_reference' => $item->batch_reference,
                    ],
                    ['current_quantity' => 0, 'updated_by' => $userId]
                );

                $stock->update(['updated_by' => $userId, 'last_updated' => now()]);
                $stock->updateStock('take', $item->quantity, $item->product->sales_unit_price ?? $item->product->default_unit_price);

                \App\Models\SalesStoreMovement::create([
                    'movement_date' => now()->toDateString(),
                    'sales_store_id' => $this->sales_store_id,
                    'product_id' => $item->product_id,
                    'batch_reference' => $item->batch_reference,
                    'movement_type' => 'dispatch_out',
                    'quantity' => $item->quantity,
                    'reference_id' => $this->id,
                    'created_by' => $userId,
                    'notes' => "Re-dispatch for Order: " . $this->order_number,
                ]);
            }
        });
    }
}
