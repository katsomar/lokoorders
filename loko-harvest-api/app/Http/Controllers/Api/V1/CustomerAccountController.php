<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\AccountTransaction;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class CustomerAccountController extends Controller
{
    use ApiResponses;

    public function show($customerId)
    {
        $account = CustomerAccount::where('customer_id', $customerId)->firstOrFail();
        return $this->success($account);
    }

    public function ledger($customerId, Request $request)
    {
        $customerIds = [$customerId];
        $customer = Customer::find($customerId);
        if ($customer) {
            $branchIds = Customer::where('parent_id', $customerId)->pluck('id')->toArray();
            $customerIds = array_merge($customerIds, $branchIds);
        }

        $transactions = AccountTransaction::with([
            'user', 
            'invoice.order.items.product', 
            'invoice.order.deliveries.proofs', 
            'invoice.order.deliveries.driver',
            'customer'
        ])
        ->whereIn('customer_id', $customerIds)
        ->when($request->search, function ($q) use ($request) {
            $term = $request->search;
            $q->where(function ($query) use ($term) {
                $query->where('reference_number', 'like', "%{$term}%")
                      ->orWhere('description', 'like', "%{$term}%")
                      ->orWhereHas('invoice.order', function ($orderQ) use ($term) {
                          $orderQ->where('fiscal_document_number', 'like', "%{$term}%")
                                 ->orWhere('order_number', 'like', "%{$term}%");
                      });
            });
        })
        ->latest('transaction_date')
        ->latest('id')
        ->paginate($request->per_page ?? 20);

        return $this->success($transactions);
    }

    public function summary()
    {
        $summary = [
            'total_receivables' => CustomerAccount::sum('current_balance'),
            'total_invoiced_mtd' => AccountTransaction::where('type', 'invoice_raised')
                ->whereMonth('transaction_date', now()->month)
                ->sum('debit_amount'),
            'total_collected_mtd' => AccountTransaction::where('type', 'payment_received')
                ->whereMonth('transaction_date', now()->month)
                ->sum('credit_amount'),
            'top_debtors' => Customer::with('account')
                ->get()
                ->sortByDesc('account.current_balance')
                ->take(5)
                ->values()
        ];

        return $this->success($summary);
    }
}
