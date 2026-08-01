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

        $query = AccountTransaction::with([
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
        });

        // 1. Fetch transactions ordered ASCENDING (oldest to newest) to calculate cumulative running balance
        $allTxs = $query->orderBy('transaction_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $running = 0.0;
        foreach ($allTxs as $tx) {
            $running += ((float)$tx->debit_amount - (float)$tx->credit_amount);
            $tx->running_balance = $running;
        }

        // 2. Sort DESCENDING (newest first) for presentation
        $sortedTxs = $allTxs->sort(function ($a, $b) {
            $dateA = $a->transaction_date . ' ' . $a->created_at . ' ' . $a->id;
            $dateB = $b->transaction_date . ' ' . $b->created_at . ' ' . $b->id;
            return strcmp($dateB, $dateA);
        })->values();

        $perPage = (int) ($request->per_page ?? 20);
        $page = (int) ($request->page ?? 1);
        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $sortedTxs->forPage($page, $perPage)->values(),
            $sortedTxs->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return $this->success($paginated);
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
