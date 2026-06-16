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
}
