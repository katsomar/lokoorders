<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $customers = Customer::with(['zone', 'account'])
            ->when($request->search, function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('contact_person', 'like', "%{$request->search}%");
            })
            ->when($request->zone_id, fn($q) => $q->where('delivery_zone_id', $request->zone_id))
            ->paginate($request->per_page ?? 15);

        return $this->success($customers);
    }

    public function show($id)
    {
        $customer = Customer::with(['zone', 'orders', 'account'])->findOrFail($id);
        return $this->success($customer);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'parent_id' => 'nullable|uuid|exists:customers,id',
            'contact_person' => 'required|string',
            'phone_primary' => 'required|string',
            'phone_secondary' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'required|string',
            'delivery_zone_id' => 'required|exists:delivery_zones,id',
            'customer_type' => 'required|in:supermarket,restaurant,individual,institution,wholesaler',
            'credit_terms' => 'required|in:cash,7_days,14_days,30_days',
            'credit_limit' => 'required|numeric|min:0',
            'date_registered' => 'required|date',
        ]);

        $validated['created_by'] = auth()->id();
        $customer = Customer::create($validated);
        
        // Initialize account
        $customer->account()->create([
            'current_balance' => 0,
            'total_invoiced' => 0,
            'total_paid' => 0,
        ]);

        return $this->success($customer, 'Customer registered successfully', 201);
    }

    public function zones()
    {
        return $this->success(\App\Models\DeliveryZone::all());
    }

    public function consumptionAnalysis($id)
    {
        $customerIds = [$id];
        $isParent = false;
        $customerName = "";

        if ($id === 'parent-shoprite') {
            $customerIds = Customer::where('name', 'like', '%shoprite%')->pluck('id')->toArray();
            $isParent = true;
            $customerName = "Shoprite Supermarkets (HQ)";
        } elseif ($id === 'parent-mega') {
            $customerIds = Customer::where('name', 'like', '%mega%')->pluck('id')->toArray();
            $isParent = true;
            $customerName = "Mega Standard Supermarkets (HQ)";
        } else {
            $customer = Customer::findOrFail($id);
            $customerName = $customer->name;
            $branches = Customer::where('parent_id', $id)->pluck('id')->toArray();
            if (count($branches) > 0) {
                $customerIds = array_merge([$id], $branches);
                $isParent = true;
            }
        }

        $orders = \App\Models\Order::whereIn('customer_id', $customerIds)
            ->with(['items.product', 'customer'])
            ->oldest('order_date')
            ->get();

        $orderCount = $orders->count();
        $totalQty = 0;
        $totalValue = 0;
        
        foreach ($orders as $order) {
            $totalValue += $order->total_amount;
            foreach ($order->items as $item) {
                $totalQty += $item->quantity;
            }
        }

        $avgOrderSizeQty = $orderCount > 0 ? $totalQty / $orderCount : 0;

        // 1. Calculate Intervals
        $intervals = [];
        $prevDate = null;
        foreach ($orders as $order) {
            $currentDate = \Carbon\Carbon::parse($order->order_date);
            if ($prevDate !== null) {
                $diff = abs($currentDate->diffInDays($prevDate));
                $intervals[] = $diff;
            }
            $prevDate = $currentDate;
        }

        $avgFrequency = count($intervals) > 0 ? array_sum($intervals) / count($intervals) : 0;

        // 2. Days Since Last Order & Predicted Next Date
        $daysSinceLastOrder = null;
        $lastOrderDate = null;
        $predictedNextOrderDate = null;
        
        if ($orderCount > 0) {
            $lastOrder = $orders->last();
            $lastOrderDate = $lastOrder->order_date;
            $daysSinceLastOrder = \Carbon\Carbon::parse($lastOrderDate)->diffInDays(now()->startOfDay(), false);
            if ($daysSinceLastOrder < 0) {
                $daysSinceLastOrder = 0;
            }
            
            if ($avgFrequency > 0) {
                $predictedNextOrderDate = \Carbon\Carbon::parse($lastOrderDate)->addDays(round($avgFrequency))->toDateString();
            }
        }

        // 3. Product Breakdown
        $productData = [];
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $pid = $item->product_id;
                if (!isset($productData[$pid])) {
                    $productData[$pid] = [
                        'product_name' => $item->product?->name ?? 'Product',
                        'total_qty' => 0,
                        'total_value' => 0,
                        'unit' => $item->product?->unit_of_measure ?? 'units'
                    ];
                }
                $productData[$pid]['total_qty'] += $item->quantity;
                $productData[$pid]['total_value'] += $item->line_total;
            }
        }

        $productBreakdown = [];
        foreach ($productData as $pid => $data) {
            $data['percentage'] = $totalQty > 0 ? round(($data['total_qty'] / $totalQty) * 100, 1) : 0;
            $productBreakdown[] = $data;
        }
        usort($productBreakdown, fn($a, $b) => $b['total_qty'] <=> $a['total_qty']);

        // 4. Order History
        $orderHistory = [];
        $prevDate = null;
        foreach ($orders as $order) {
            $currentDate = \Carbon\Carbon::parse($order->order_date);
            $daysSincePrevious = null;
            if ($prevDate !== null) {
                $daysSincePrevious = abs($currentDate->diffInDays($prevDate));
            }

            $itemsMapped = $order->items->map(fn($item) => [
                'product_name' => $item->product?->name ?? 'Product',
                'product_code' => $item->product?->code ?? '',
                'quantity' => $item->quantity,
                'unit' => $item->product?->unit_of_measure ?? 'units',
                'unit_price' => (float) $item->unit_price,
                'line_total' => (float) $item->line_total
            ])->toArray();

            $orderHistory[] = [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'order_date' => $order->order_date,
                'days_since_previous' => $daysSincePrevious,
                'total_qty' => $order->items->sum('quantity'),
                'total_value' => (float) $order->total_amount,
                'branch_name' => $isParent ? ($order->customer?->name ?? 'Main') : null,
                'items' => $itemsMapped
            ];

            $prevDate = $currentDate;
        }
        $orderHistory = array_reverse($orderHistory);

        // 5. Monthly Trends
        $monthlyData = [];
        foreach ($orders as $order) {
            $month = \Carbon\Carbon::parse($order->order_date)->format('F Y');
            if (!isset($monthlyData[$month])) {
                $monthlyData[$month] = [
                    'month' => $month,
                    'order_count' => 0,
                    'total_qty' => 0,
                    'total_value' => 0
                ];
            }
            $monthlyData[$month]['order_count']++;
            $monthlyData[$month]['total_qty'] += $order->items->sum('quantity');
            $monthlyData[$month]['total_value'] += $order->total_amount;
        }
        $monthlyTrends = array_values($monthlyData);

        return $this->success([
            'customer_name' => $customerName,
            'metrics' => [
                'avg_frequency_days' => count($intervals) > 0 ? round($avgFrequency, 1) : null,
                'days_since_last_order' => $daysSinceLastOrder,
                'total_qty_ordered' => $totalQty,
                'total_value_ordered' => $totalValue,
                'avg_order_size_qty' => $orderCount > 0 ? round($avgOrderSizeQty, 1) : 0,
                'last_order_date' => $lastOrderDate,
                'predicted_next_order_date' => $predictedNextOrderDate,
                'order_count' => $orderCount
            ],
            'product_breakdown' => $productBreakdown,
            'order_history' => $orderHistory,
            'monthly_trends' => $monthlyTrends
        ]);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'parent_id' => 'nullable|uuid|exists:customers,id',
            'contact_person' => 'sometimes|required|string',
            'phone_primary' => 'sometimes|required|string',
            'phone_secondary' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'sometimes|required|string',
            'delivery_zone_id' => 'sometimes|required|exists:delivery_zones,id',
            'customer_type' => 'sometimes|required|in:supermarket,restaurant,individual,institution,wholesaler',
            'credit_terms' => 'sometimes|required|in:cash,7_days,14_days,30_days',
            'credit_limit' => 'sometimes|required|numeric|min:0',
            'date_registered' => 'sometimes|required|date',
        ]);

        $customer->update($validated);
        return $this->success($customer, 'Customer updated successfully');
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);

        if ($customer->orders()->exists()) {
            return $this->error('Cannot delete customer because they have order history.', 422);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($customer) {
            // Delete associated customer account
            if ($customer->account) {
                $customer->account->delete();
            }

            // Set parent_id of branches to null
            Customer::where('parent_id', $customer->id)->update(['parent_id' => null]);

            $customer->delete();

            return $this->success(null, 'Customer deleted successfully');
        });
    }

    public function uploadLogo(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        $path = $request->file('logo')->store('customers/logos', 'public');

        // Delete old logo file if exists
        if ($customer->logo_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($customer->logo_path);
        }

        $customer->update(['logo_path' => $path]);

        return $this->success([
            'logo_url' => url('storage/' . $path),
            'logo_path' => $path,
        ], 'Logo uploaded successfully');
    }
}

