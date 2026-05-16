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
        $transactions = AccountTransaction::where('customer_id', $customerId)
            ->latest('transaction_date')
            ->latest('id')
            ->paginate($request->per_page ?? 20);

        return $this->success($transactions);
    }

    public function summary()
    {
        $summary = [
            'total_receivables' => CustomerAccount::sum('current_balance'),
            'total_invoiced_mtd' => AccountTransaction::where('transaction_type', 'invoice')
                ->whereMonth('transaction_date', now()->month)
                ->sum('amount'),
            'total_collected_mtd' => AccountTransaction::where('transaction_type', 'payment')
                ->whereMonth('transaction_date', now()->month)
                ->sum('amount'),
            'top_debtors' => Customer::with('account')
                ->get()
                ->sortByDesc('account.current_balance')
                ->take(5)
                ->values()
        ];

        return $this->success($summary);
    }
}
