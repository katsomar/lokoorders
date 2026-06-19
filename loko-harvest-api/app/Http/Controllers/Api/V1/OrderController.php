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

    public function index(Request $request)
    {
        $orders = Order::with(['customer', 'salesStore', 'items.product'])
            ->when($request->search, function($q) use ($request) {
                $q->where('order_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', function($c) use ($request) {
                      $c->where('name', 'like', "%{$request->search}%");
                  });
            })
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->urgency, fn($q) => $q->where('urgency', $request->urgency))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
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

        return DB::transaction(function () use ($validated) {
            // 1. Validate stock for all items
            foreach ($validated['items'] as $item) {
                $prod = \App\Models\Product::findOrFail($item['product_id']);
                $supportsBatch = $this->productSupportsBatch($prod);
                $batchRef = $supportsBatch ? ($item['batch_reference'] ?? null) : null;

                if ($supportsBatch && $batchRef) {
                    $stock = \App\Models\SalesStoreStock::where('sales_store_id', $validated['sales_store_id'])
                        ->where('product_id', $item['product_id'])
                        ->where('batch_reference', $batchRef)
                        ->first();
                    $available = $stock ? (float) $stock->current_quantity : 0.0;
                } else {
                    $available = \App\Models\SalesStoreStock::where('sales_store_id', $validated['sales_store_id'])
                        ->where('product_id', $item['product_id'])
                        ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                        ->sum('current_quantity');
                }
                
                if ($available < (float) $item['quantity'] && empty($validated['admin_override_reason'])) {
                    $productName = $prod->name;
                    $batchStr = $batchRef ? " (Batch: {$batchRef})" : "";
                    return $this->error("Insufficient stock for {$productName}{$batchStr} in the selected sales store. (Available: {$available})", 422);
                }
            }

            $orderNumber = 'LHO-' . date('Y') . '-' . str_pad(Order::whereYear('created_at', date('Y'))->count() + 1, 4, '0', STR_PAD_LEFT);

            $order = Order::create([
                'order_number' => $orderNumber,
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

                if ($supportsBatch && $batchRef) {
                    // Specific batch debit
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
                    $stock->decrement('current_quantity', $item['quantity']);
                    $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

                    \App\Models\SalesStoreMovement::create([
                        'movement_date' => $validated['order_date'],
                        'sales_store_id' => $validated['sales_store_id'],
                        'product_id' => $item['product_id'],
                        'batch_reference' => $batchRef,
                        'movement_type' => 'dispatch_out',
                        'quantity' => $item['quantity'],
                        'reference_id' => $order->id,
                        'created_by' => auth()->id(),
                        'notes' => "Sold for Order: " . $order->order_number,
                    ]);
                } else {
                    // FIFO Debit across sales stock batches
                    $remainingToDebit = $item['quantity'];
                    $stocks = \App\Models\SalesStoreStock::where('sales_store_id', $validated['sales_store_id'])
                        ->where('product_id', $item['product_id'])
                        ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                        ->where('current_quantity', '>', 0)
                        ->orderBy('created_at', 'asc')
                        ->get();

                    // If no stocks found but override reason is set, we debit a default row
                    if ($stocks->isEmpty()) {
                        $stock = \App\Models\SalesStoreStock::firstOrCreate(
                            [
                                'sales_store_id' => $validated['sales_store_id'],
                                'product_id' => $item['product_id'],
                                'batch_reference' => null,
                            ],
                            ['current_quantity' => 0, 'updated_by' => auth()->id()]
                        );
                        $stock->decrement('current_quantity', $remainingToDebit);
                        $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

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
                            'notes' => "Sold for Order: " . $order->order_number . " (Stock Override)",
                        ]);
                    } else {
                        foreach ($stocks as $stock) {
                            if ($remainingToDebit <= 0) break;

                            $debitAmount = min($stock->current_quantity, $remainingToDebit);
                            $stock->decrement('current_quantity', $debitAmount);
                            $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

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
                                'notes' => "Sold for Order: " . $order->order_number . ($segmentBatch ? " (FIFO Batch: {$segmentBatch})" : ""),
                            ]);

                            $remainingToDebit -= $debitAmount;
                        }

                        // If still remaining (in case of override reason exceeding sum of available stocks)
                        if ($remainingToDebit > 0) {
                            $lastStock = $stocks->last();
                            $lastStock->decrement('current_quantity', $remainingToDebit);
                            $lastStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

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
                                'notes' => "Sold for Order: " . $order->order_number . " (FIFO Override Spill)",
                            ]);
                        }
                    }
                }
            }

            $order->update(['total_amount' => $totalAmount]);

            // Automatically generate invoice
            $invoiceNumber = 'LHI-' . date('Y') . '-' . str_pad(Invoice::whereYear('created_at', date('Y'))->count() + 1, 4, '0', STR_PAD_LEFT);
            Invoice::create([
                'invoice_number' => $invoiceNumber,
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'issue_date' => now(),
                'due_date' => now()->addDays(7), // Should be based on customer credit terms
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
                'description' => "Invoice raised for Order: " . $order->order_number,
                'debit_amount' => $totalAmount,
                'credit_amount' => 0.00,
                'running_balance' => $account->current_balance,
                'transaction_date' => now()->toDateString(),
                'created_by' => auth()->id(),
            ]);

            return $this->success($order->load('items.product', 'customer'), 'Order created successfully', 201);
        });
    }

    public function show($id)
    {
        $order = Order::with(['customer.zone', 'salesStore', 'items.product', 'invoice', 'deliveries', 'statusHistory.user'])->findOrFail($id);
        return $this->success($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,ready_for_dispatch,dispatched',
            'notes' => 'nullable|string',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['status' => $request->status]);

        // Log in order_status_history
        $order->statusHistory()->create([
            'status' => $request->status,
            'changed_by' => auth()->id(),
            'notes' => $request->notes,
        ]);

        return $this->success($order, "Order status updated to {$request->status}");
    }

    public function update(Request $request, $id)
    {
        $order = Order::with(['items', 'invoice'])->findOrFail($id);

        if (in_array($order->status, ['dispatched', 'delivered'])) {
            return $this->error("Cannot edit an order that has already been dispatched or delivered.", 422);
        }

        $validated = $request->validate([
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
            // --- REVERT OLD ALLOCATIONS ---
            // 1. Refund stock for all old items
            foreach ($order->items as $item) {
                $stock = \App\Models\SalesStoreStock::where('sales_store_id', $order->sales_store_id)
                    ->where('product_id', $item->product_id)
                    ->where('batch_reference', $item->batch_reference)
                    ->first();
                if ($stock) {
                    $stock->increment('current_quantity', $item->quantity);
                    $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
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

            // 3. Delete old items
            $order->items()->delete();

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
                    $available = $stock ? (float) $stock->current_quantity : 0.0;
                } else {
                    $available = \App\Models\SalesStoreStock::where('sales_store_id', $validated['sales_store_id'])
                        ->where('product_id', $item['product_id'])
                        ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                        ->sum('current_quantity');
                }
                
                if ($available < (float) $item['quantity'] && empty($validated['admin_override_reason'])) {
                    $productName = $prod->name;
                    $batchStr = $batchRef ? " (Batch: {$batchRef})" : "";
                    return $this->error("Insufficient stock for {$productName}{$batchStr} in the selected sales store. (Available: {$available})", 422);
                }
            }

            // 5. Update order details
            $order->update([
                'customer_id' => $validated['customer_id'],
                'sales_store_id' => $validated['sales_store_id'],
                'order_date' => $validated['order_date'],
                'required_delivery_date' => $validated['required_delivery_date'],
                'urgency' => $validated['urgency'],
                'order_notes' => $validated['order_notes'] ?? null,
                'admin_override_reason' => $validated['admin_override_reason'] ?? null,
            ]);

            // 6. Create new items and debit stock
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $lineTotal;

                $prod = \App\Models\Product::findOrFail($item['product_id']);
                $supportsBatch = $this->productSupportsBatch($prod);
                $batchRef = $supportsBatch ? ($item['batch_reference'] ?? null) : null;

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
                    $stock->decrement('current_quantity', $item['quantity']);
                    $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

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
                        $stock->decrement('current_quantity', $remainingToDebit);
                        $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

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
                            $stock->decrement('current_quantity', $debitAmount);
                            $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

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
                            $lastStock->decrement('current_quantity', $remainingToDebit);
                            $lastStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

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
            }

            $order->update(['total_amount' => $totalAmount]);

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
            // 1. Refund stock for all items and delete movements
            foreach ($order->items as $item) {
                $stock = \App\Models\SalesStoreStock::where('sales_store_id', $order->sales_store_id)
                    ->where('product_id', $item->product_id)
                    ->where('batch_reference', $item->batch_reference)
                    ->first();
                if ($stock) {
                    $stock->increment('current_quantity', $item->quantity);
                    $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
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

            // 3. Delete status history, items, and order
            $order->statusHistory()->delete();
            $order->items()->delete();
            $order->delete();

            return $this->success(null, 'Order deleted successfully');
        });
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
