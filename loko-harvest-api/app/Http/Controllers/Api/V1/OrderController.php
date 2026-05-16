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
        $orders = Order::with(['customer', 'items.product'])
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
            $orderNumber = 'LHO-' . date('Y') . '-' . str_pad(Order::whereYear('created_at', date('Y'))->count() + 1, 4, '0', STR_PAD_LEFT);

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $validated['customer_id'],
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

            return $this->success($order->load('items.product', 'customer'), 'Order created successfully', 201);
        });
    }

    public function show($id)
    {
        $order = Order::with(['customer', 'items.product', 'invoice', 'deliveries'])->findOrFail($id);
        return $this->success($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,ready_for_dispatch,dispatched,delivered',
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
