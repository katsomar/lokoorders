<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Models\Invoice;
use App\Models\CustomerAccount;
use App\Models\AccountTransaction;
use App\Services\RealtimePublisher;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class OrderFulfillmentService
{
    /**
     * Create a new sales order with line items.
     *
     * @param array $data
     * @param int|null $userId
     * @return Order
     */
    public function createOrder(array $data, string|int|null $userId = null): Order
    {
        $creatorId = $userId ?? auth()->id();

        return DB::transaction(function () use ($data, $creatorId) {
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
                'fiscal_document_number' => $data['fiscal_document_number'] ?? null,
                'customer_id' => $data['customer_id'],
                'sales_store_id' => $data['sales_store_id'],
                'order_date' => $data['order_date'],
                'required_delivery_date' => $data['required_delivery_date'],
                'urgency' => $data['urgency'],
                'order_notes' => $data['order_notes'] ?? null,
                'total_amount' => 0,
                'admin_override_reason' => $data['admin_override_reason'] ?? null,
                'created_by' => $creatorId,
                'status' => 'pending'
            ]);

            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $lineTotal;

                $prod = Product::findOrFail($item['product_id']);
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

            RealtimePublisher::publish('order.updated');

            return $order->load('items.product', 'customer');
        });
    }

    /**
     * Update order details, line items, and stock/invoice allocations if committed.
     *
     * @param Order $order
     * @param array $data
     * @param int|null $userId
     * @return Order
     */
    public function updateOrder(Order $order, array $data, string|int|null $userId = null): Order
    {
        if (in_array($order->status, ['dispatched', 'delivered'])) {
            throw new InvalidArgumentException("Cannot edit an order that has already been dispatched or delivered.");
        }

        $updaterId = $userId ?? auth()->id();

        return DB::transaction(function () use ($order, $data, $updaterId) {
            $isCommitted = ($order->status !== 'pending');

            if ($isCommitted) {
                // 1. Revert old stock allocations
                foreach ($order->items as $item) {
                    $stock = SalesStoreStock::where('sales_store_id', $order->sales_store_id)
                        ->where('product_id', $item->product_id)
                        ->where('batch_reference', $item->batch_reference)
                        ->first();
                    if ($stock) {
                        $stock->update(['updated_by' => $updaterId, 'last_updated' => now()]);
                        $stock->updateStock('take', -$item->quantity, $item->product->sales_unit_price ?? $item->product->default_unit_price);
                    }
                }
                SalesStoreMovement::where('reference_id', $order->id)->delete();

                // 2. Revert old customer account balance & transaction
                if ($order->invoice) {
                    $oldAccount = CustomerAccount::where('customer_id', $order->customer_id)->first();
                    if ($oldAccount) {
                        $oldAccount->decrement('current_balance', $order->total_amount);
                        $oldAccount->decrement('total_invoiced', $order->total_amount);
                    }
                    AccountTransaction::where('reference_number', $order->invoice->invoice_number)->delete();
                    $order->invoice->delete();
                }
            }

            // 3. Delete old items
            $order->items()->delete();

            if ($isCommitted) {
                // 4. Validate stock for all new items
                foreach ($data['items'] as $item) {
                    $prod = Product::findOrFail($item['product_id']);
                    $supportsBatch = $this->productSupportsBatch($prod);
                    $batchRef = $supportsBatch ? ($item['batch_reference'] ?? null) : null;

                    if ($supportsBatch && $batchRef) {
                        $stock = SalesStoreStock::where('sales_store_id', $data['sales_store_id'])
                            ->where('product_id', $item['product_id'])
                            ->where('batch_reference', $batchRef)
                            ->first();
                        $ledger = SalesStoreStock::getLedgerStock($data['sales_store_id'], $item['product_id'], $batchRef);
                        $raw = $stock ? (float)$stock->current_quantity : 0.0;
                        $available = max($ledger, $raw);
                    } else {
                        $stocksQuery = SalesStoreStock::where('sales_store_id', $data['sales_store_id'])
                            ->where('product_id', $item['product_id'])
                            ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'));

                        $raw = (float)$stocksQuery->sum('current_quantity');
                        $batches = (clone $stocksQuery)->pluck('batch_reference')->unique();

                        $ledger = 0.0;
                        foreach ($batches as $bRef) {
                            $ledger += SalesStoreStock::getLedgerStock($data['sales_store_id'], $item['product_id'], $bRef);
                        }
                        if ($batches->isEmpty()) {
                            $ledger = SalesStoreStock::getLedgerStock($data['sales_store_id'], $item['product_id'], null);
                        }

                        $available = max($ledger, $raw);
                    }

                    if ($available < (float) $item['quantity'] && empty($data['admin_override_reason'])) {
                        $productName = $prod->name;
                        $batchStr = $batchRef ? " (Batch: {$batchRef})" : "";
                        throw new RuntimeException("Insufficient stock for {$productName}{$batchStr} in the selected sales store (Available: {$available}).");
                    }
                }
            }

            // 5. Update order details
            $order->update([
                'fiscal_document_number' => $data['fiscal_document_number'] ?? null,
                'customer_id' => $data['customer_id'],
                'sales_store_id' => $data['sales_store_id'],
                'order_date' => $data['order_date'],
                'required_delivery_date' => $data['required_delivery_date'],
                'urgency' => $data['urgency'],
                'order_notes' => $data['order_notes'] ?? null,
                'admin_override_reason' => $data['admin_override_reason'] ?? null,
            ]);

            // 6. Create new items and debit stock (if committed)
            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $lineTotal;

                $prod = Product::findOrFail($item['product_id']);
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

                        $stock = SalesStoreStock::firstOrCreate(
                            [
                                'sales_store_id' => $data['sales_store_id'],
                                'product_id' => $item['product_id'],
                                'batch_reference' => $batchRef,
                            ],
                            ['current_quantity' => 0, 'updated_by' => $updaterId]
                        );
                        $stock->update(['updated_by' => $updaterId, 'last_updated' => now()]);
                        $stock->updateStock('take', $item['quantity'], $prod->sales_unit_price ?? $prod->default_unit_price);

                        SalesStoreMovement::create([
                            'movement_date' => $data['order_date'],
                            'sales_store_id' => $data['sales_store_id'],
                            'product_id' => $item['product_id'],
                            'batch_reference' => $batchRef,
                            'movement_type' => 'dispatch_out',
                            'quantity' => $item['quantity'],
                            'reference_id' => $order->id,
                            'created_by' => $updaterId,
                            'notes' => "Sold for Order: " . $order->order_number . " (Updated)",
                        ]);
                    } else {
                        $remainingToDebit = $item['quantity'];
                        $stocks = SalesStoreStock::where('sales_store_id', $data['sales_store_id'])
                            ->where('product_id', $item['product_id'])
                            ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                            ->where('current_quantity', '>', 0)
                            ->orderBy('created_at', 'asc')
                            ->get();

                        if ($stocks->isEmpty()) {
                            $stock = SalesStoreStock::firstOrCreate(
                                [
                                    'sales_store_id' => $data['sales_store_id'],
                                    'product_id' => $item['product_id'],
                                    'batch_reference' => null,
                                ],
                                ['current_quantity' => 0, 'updated_by' => $updaterId]
                            );
                            $stock->update(['updated_by' => $updaterId, 'last_updated' => now()]);
                            $stock->updateStock('take', $remainingToDebit, $prod->sales_unit_price ?? $prod->default_unit_price);

                            OrderItem::create([
                                'order_id' => $order->id,
                                'product_id' => $item['product_id'],
                                'batch_reference' => null,
                                'quantity' => $remainingToDebit,
                                'unit_price' => $item['unit_price'],
                                'line_total' => $lineTotal,
                            ]);

                            SalesStoreMovement::create([
                                'movement_date' => $data['order_date'],
                                'sales_store_id' => $data['sales_store_id'],
                                'product_id' => $item['product_id'],
                                'batch_reference' => null,
                                'movement_type' => 'dispatch_out',
                                'quantity' => $remainingToDebit,
                                'reference_id' => $order->id,
                                'created_by' => $updaterId,
                                'notes' => "Sold for Order: " . $order->order_number . " (Stock Override - Updated)",
                            ]);
                        } else {
                            foreach ($stocks as $stock) {
                                if ($remainingToDebit <= 0) break;

                                $debitAmount = min($stock->current_quantity, $remainingToDebit);
                                $stock->update(['updated_by' => $updaterId, 'last_updated' => now()]);
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

                                SalesStoreMovement::create([
                                    'movement_date' => $data['order_date'],
                                    'sales_store_id' => $data['sales_store_id'],
                                    'product_id' => $item['product_id'],
                                    'batch_reference' => $segmentBatch,
                                    'movement_type' => 'dispatch_out',
                                    'quantity' => $debitAmount,
                                    'reference_id' => $order->id,
                                    'created_by' => $updaterId,
                                    'notes' => "Sold for Order: " . $order->order_number . ($segmentBatch ? " (FIFO Batch: {$segmentBatch} - Updated)" : " (Updated)"),
                                ]);

                                $remainingToDebit -= $debitAmount;
                            }

                            if ($remainingToDebit > 0) {
                                $lastStock = $stocks->last();
                                $lastStock->update(['updated_by' => $updaterId, 'last_updated' => now()]);
                                $lastStock->updateStock('take', $remainingToDebit, $prod->sales_unit_price ?? $prod->default_unit_price);

                                OrderItem::create([
                                    'order_id' => $order->id,
                                    'product_id' => $item['product_id'],
                                    'batch_reference' => $lastStock->batch_reference,
                                    'quantity' => $remainingToDebit,
                                    'unit_price' => $item['unit_price'],
                                    'line_total' => $remainingToDebit * $item['unit_price'],
                                ]);

                                SalesStoreMovement::create([
                                    'movement_date' => $data['order_date'],
                                    'sales_store_id' => $data['sales_store_id'],
                                    'product_id' => $item['product_id'],
                                    'batch_reference' => $lastStock->batch_reference,
                                    'movement_type' => 'dispatch_out',
                                    'quantity' => $remainingToDebit,
                                    'reference_id' => $order->id,
                                    'created_by' => $updaterId,
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
                    'created_by' => $updaterId,
                ]);

                // Update Customer Account Balance
                $account = CustomerAccount::firstOrCreate(
                    ['customer_id' => $order->customer_id],
                    ['current_balance' => 0, 'total_invoiced' => 0, 'total_paid' => 0]
                );
                $account->increment('current_balance', $totalAmount);
                $account->increment('total_invoiced', $totalAmount);

                // Log Account Transaction
                AccountTransaction::create([
                    'customer_id' => $order->customer_id,
                    'type' => 'invoice_raised',
                    'reference_number' => $invoiceNumber,
                    'description' => "Invoice raised for Updated Order: " . $order->order_number,
                    'debit_amount' => $totalAmount,
                    'running_balance' => $account->current_balance,
                    'transaction_date' => now()->toDateString(),
                    'created_by' => $updaterId,
                ]);
            }

            RealtimePublisher::publish('order.updated');

            return $order->fresh(['items.product', 'customer']);
        });
    }

    /**
     * Update order workflow status and commit inventory if moving out of pending.
     *
     * @param Order $order
     * @param string $newStatus
     * @param string|null $notes
     * @param string|null $adminOverrideReason
     * @param string|int|null $userId
     * @return Order
     */
    public function updateOrderStatus(
        Order $order,
        string $newStatus,
        ?string $notes = null,
        ?string $adminOverrideReason = null,
        string|int|null $userId = null
    ): Order {
        $oldStatus = $order->status;
        $updaterId = $userId ?? auth()->id();

        if ($oldStatus === $newStatus) {
            return $order;
        }

        // Trigger stock deduction and invoice raising when moving out of pending
        if ($oldStatus === 'pending' && in_array($newStatus, ['processing', 'ready_for_dispatch', 'dispatched'])) {
            return DB::transaction(function () use ($order, $newStatus, $notes, $adminOverrideReason, $updaterId) {
                $order->commitOrder($adminOverrideReason);

                $order->update(['status' => $newStatus]);
                $order->statusHistory()->create([
                    'status' => $newStatus,
                    'changed_by' => $updaterId,
                    'notes' => $notes,
                ]);

                RealtimePublisher::publish('order.updated');

                return $order->fresh();
            });
        }

        $order->update(['status' => $newStatus]);
        $order->statusHistory()->create([
            'status' => $newStatus,
            'changed_by' => $updaterId,
            'notes' => $notes,
        ]);

        RealtimePublisher::publish('order.updated');

        return $order->fresh();
    }

    /**
     * Delete an un-dispatched order and reverse stock/invoices if committed.
     *
     * @param Order $order
     * @param string|int|null $userId
     * @return bool
     */
    public function deleteOrder(Order $order, string|int|null $userId = null): bool
    {
        if (in_array($order->status, ['dispatched', 'delivered'])) {
            throw new InvalidArgumentException("Cannot delete an order that has already been dispatched or delivered.");
        }

        $updaterId = $userId ?? auth()->id();

        return DB::transaction(function () use ($order, $updaterId) {
            $isCommitted = ($order->status !== 'pending');

            if ($isCommitted) {
                // 1. Refund stock for all items and delete movements
                foreach ($order->items as $item) {
                    $stock = SalesStoreStock::where('sales_store_id', $order->sales_store_id)
                        ->where('product_id', $item->product_id)
                        ->where('batch_reference', $item->batch_reference)
                        ->first();
                    if ($stock) {
                        $stock->update(['updated_by' => $updaterId, 'last_updated' => now()]);
                        $stock->updateStock('take', -$item->quantity, $item->product->sales_unit_price ?? $item->product->default_unit_price);
                    }
                }
                SalesStoreMovement::where('reference_id', $order->id)->delete();

                // 2. Adjust Customer Account & Invoice
                if ($order->invoice) {
                    $account = CustomerAccount::where('customer_id', $order->customer_id)->first();
                    if ($account) {
                        $account->decrement('current_balance', $order->total_amount);
                        $account->decrement('total_invoiced', $order->total_amount);
                    }
                    AccountTransaction::where('reference_number', $order->invoice->invoice_number)->delete();
                    $order->invoice->delete();
                }
            }

            // 3. Delete status history, items, and order
            $order->statusHistory()->delete();
            $order->items()->delete();
            $order->delete();

            RealtimePublisher::publish('order.updated');

            return true;
        });
    }


    /**
     * Check if product supports batch tracking (Eggs or live poultry).
     *
     * @param Product $product
     * @return bool
     */
    public function productSupportsBatch(Product $product): bool
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
