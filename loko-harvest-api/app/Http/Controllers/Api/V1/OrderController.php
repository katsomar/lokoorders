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
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'admin_override_reason' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            // 1. Validate stock for all items
            foreach ($validated['items'] as $item) {
                $stock = \App\Models\SalesStoreStock::where('sales_store_id', $validated['sales_store_id'])
                    ->where('product_id', $item['product_id'])
                    ->first();
                
                $available = $stock ? (float) $stock->current_quantity : 0.0;
                
                if ($available < (float) $item['quantity'] && empty($validated['admin_override_reason'])) {
                    $productName = \App\Models\Product::find($item['product_id'])?->name ?? 'Product';
                    return $this->error("Insufficient stock for {$productName} in the selected sales store. (Available: {$available})", 422);
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
                'order_notes' => $validated['order_notes'],
                'total_amount' => 0, // Will update after items
                'admin_override_reason' => $validated['admin_override_reason'],
                'created_by' => auth()->id(),
                'status' => 'pending'
            ]);

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $lineTotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $lineTotal,
                ]);

                // Debit sales store stock
                $stock = \App\Models\SalesStoreStock::firstOrCreate(
                    [
                        'sales_store_id' => $validated['sales_store_id'],
                        'product_id' => $item['product_id'],
                    ],
                    [
                        'current_quantity' => 0,
                        'updated_by' => auth()->id(),
                    ]
                );

                $stock->decrement('current_quantity', $item['quantity']);
                $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

                // Log movement
                \App\Models\SalesStoreMovement::create([
                    'movement_date' => $validated['order_date'],
                    'sales_store_id' => $validated['sales_store_id'],
                    'product_id' => $item['product_id'],
                    'movement_type' => 'dispatch_out',
                    'quantity' => $item['quantity'],
                    'reference_id' => $order->id,
                    'created_by' => auth()->id(),
                    'notes' => "Sold for Order: " . $order->order_number,
                ]);
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
}
