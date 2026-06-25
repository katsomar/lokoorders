<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ReturnVoucher;
use App\Models\CustomerAccount;
use App\Models\AccountTransaction;
use App\Models\User;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReturnVoucherController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $vouchers = ReturnVoucher::with(['customer', 'product', 'order', 'delivery', 'creator'])
            ->when($request->search, function ($q) use ($request) {
                $term = '%' . $request->search . '%';
                $q->where(function ($query) use ($term) {
                    $query->where('voucher_number', 'like', $term)
                        ->orWhereHas('customer', function ($customerQ) use ($term) {
                            $customerQ->where('name', 'like', $term);
                        })
                        ->orWhereHas('product', function ($productQ) use ($term) {
                            $productQ->where('name', 'like', $term);
                        });
                });
            })
            ->when($request->reason_code, fn($q) => $q->where('reason_code', $request->reason_code))
            ->when($request->return_type, fn($q) => $q->where('return_type', $request->return_type))
            ->when($request->has('posted'), fn($q) => $q->where('account_credit_posted', filter_var($request->posted, FILTER_VALIDATE_BOOLEAN)))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($vouchers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|uuid|exists:customers,id',
            'product_id' => 'required|uuid|exists:products,id',
            'order_id' => 'required|uuid|exists:orders,id',
            'delivery_id' => 'required|uuid|exists:deliveries,id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'return_type' => 'required|in:credit,physical_replacement',
            'reason_code' => 'required|in:broken_cracked,rotten_spoiled,wrong_product,near_expiry,packaging_damage,other',
            'notes' => 'nullable|string',
            'return_date' => 'nullable|date',
        ]);

        $validated['return_date'] = $validated['return_date'] ?? now()->toDateString();
        $validated['monetary_value'] = $validated['quantity'] * $validated['unit_price'];
        $validated['created_by'] = auth()->id() ?? User::first()?->id;

        // Generate voucher sequence LHRV-YYYY-XXXX
        $count = ReturnVoucher::whereYear('created_at', date('Y'))->count();
        $validated['voucher_number'] = 'LHRV-' . date('Y') . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
        $validated['account_credit_posted'] = false;

        $voucher = ReturnVoucher::create($validated);

        return $this->success($voucher->load(['customer', 'product', 'order', 'delivery']), 'Return voucher recorded successfully', 201);
    }

    public function postCredit($id)
    {
        $voucher = ReturnVoucher::findOrFail($id);

        if ($voucher->account_credit_posted) {
            return $this->error('This return credit has already been posted to the customer\'s ledger.', 422);
        }

        if ($voucher->return_type !== 'credit') {
            return $this->error('Only return vouchers of type "credit" can be posted to the customer\'s ledger.', 422);
        }

        return DB::transaction(function () use ($voucher) {
            // Update customer account balance
            $account = CustomerAccount::firstOrCreate(
                ['customer_id' => $voucher->customer_id],
                ['current_balance' => 0, 'total_invoiced' => 0, 'total_paid' => 0]
            );

            // Return credit reduces the customer's outstanding balance (current_balance)
            $account->decrement('current_balance', $voucher->monetary_value);

            // Log Account Transaction
            AccountTransaction::create([
                'customer_id' => $voucher->customer_id,
                'type' => 'return_credit',
                'reference_number' => $voucher->voucher_number,
                'description' => "Credit note for Return Voucher: " . $voucher->voucher_number,
                'debit_amount' => 0.00,
                'credit_amount' => $voucher->monetary_value,
                'running_balance' => $account->current_balance,
                'transaction_date' => now()->toDateString(),
                'created_by' => auth()->id() ?? User::first()?->id,
            ]);

            // Mark voucher as posted
            $voucher->update(['account_credit_posted' => true]);

            return $this->success($voucher->load(['customer', 'product']), 'Credit note posted successfully to customer ledger.');
        });
    }
}
