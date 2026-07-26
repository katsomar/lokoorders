<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderFulfillmentService;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Exception;

class OrderController extends Controller
{
    use ApiResponses;

    public function __construct(
        protected OrderFulfillmentService $fulfillmentService
    ) {}

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
        $this->authorize('create', Order::class);

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

        $order = $this->fulfillmentService->createOrder($validated);

        return $this->success($order, 'Order created successfully', 201);
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

        try {
            $updatedOrder = $this->fulfillmentService->updateOrderStatus(
                $order,
                $request->status,
                $request->notes,
                $request->admin_override_reason
            );

            return $this->success($updatedOrder, "Order status updated to {$request->status}");
        } catch (Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function update(Request $request, $id)
    {
        $order = Order::with(['items', 'invoice'])->findOrFail($id);
        $this->authorize('update', $order);

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

        try {
            $updatedOrder = $this->fulfillmentService->updateOrder($order, $validated);
            return $this->success($updatedOrder, 'Order updated successfully');
        } catch (Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function destroy($id)
    {
        $order = Order::with(['items', 'invoice'])->findOrFail($id);
        $this->authorize('delete', $order);

        try {
            $this->fulfillmentService->deleteOrder($order);
            return $this->success(null, 'Order deleted successfully');
        } catch (Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
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
}
