<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\AccountTransaction;
use App\Models\Invoice;
use App\Models\PaymentInvoiceAllocation;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $payments = Payment::with(['customer', 'allocations.invoice', 'user'])
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->payment_method, fn($q) => $q->where('payment_method', $request->payment_method))
            ->when($request->search, function($q) use ($request) {
                $term = '%' . $request->search . '%';
                $q->where(function($query) use ($term) {
                    $query->where('payment_number', 'like', $term)
                          ->orWhere('reference_number', 'like', $term)
                          ->orWhereHas('customer', function($cQ) use ($term) {
                              $cQ->where('name', 'like', $term);
                          });
                });
            })
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($payments);
    }

    public function metrics()
    {
        $startOfMonth = now()->startOfMonth()->toDateString();
        $endOfMonth = now()->endOfMonth()->toDateString();

        $totalMtd = Payment::whereBetween('payment_date', [$startOfMonth, $endOfMonth])->sum('amount');

        // Top payment method by total amount collected
        $methodStats = Payment::select('payment_method', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->orderByDesc('total')
            ->first();
        
        $topMethod = $methodStats ? $methodStats->payment_method : 'N/A';
        $topMethodShare = 0;
        $totalAllTime = Payment::sum('amount');
        if ($totalAllTime > 0 && $methodStats) {
            $topMethodShare = round(($methodStats->total / $totalAllTime) * 100);
        }

        // Total Outstanding Receivables (sum of customer balances)
        $totalOutstanding = CustomerAccount::sum('current_balance');

        return $this->success([
            'total_mtd_collections' => (float)$totalMtd,
            'top_method' => $topMethod,
            'top_method_share' => $topMethodShare,
            'total_outstanding' => (float)$totalOutstanding,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank_transfer,mobile_money,cheque',
            'reference_number' => 'nullable|string',
            'notes' => 'nullable|string',
            'auto_allocate' => 'boolean',
            'allocations' => 'nullable|array',
            'allocations.*.invoice_id' => 'required_with:allocations|exists:invoices,id',
            'allocations.*.amount_allocated' => 'required_with:allocations|numeric|min:0.01',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $payment = Payment::create([
                'payment_number' => 'LHP-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4)),
                'customer_id' => $validated['customer_id'],
                'payment_date' => $validated['payment_date'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'transaction_reference' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'completed',
                'created_by' => auth()->id(),
                'received_by' => auth()->id(),
            ]);

            // Update Customer Account
            $account = CustomerAccount::firstOrCreate(
                ['customer_id' => $validated['customer_id']],
                ['current_balance' => 0, 'total_invoiced' => 0, 'total_paid' => 0]
            );

            $account->decrement('current_balance', $validated['amount']);
            $account->increment('total_paid', $validated['amount']);

            // Log Transaction
            AccountTransaction::create([
                'customer_id' => $validated['customer_id'],
                'type' => 'payment_received',
                'reference_number' => $payment->payment_number,
                'description' => "Payment received via " . str_replace('_', ' ', $validated['payment_method']) . ($validated['reference_number'] ? " (#{$validated['reference_number']})" : ""),
                'debit_amount' => 0.00,
                'credit_amount' => $validated['amount'],
                'running_balance' => $account->current_balance,
                'transaction_date' => $validated['payment_date'],
                'created_by' => auth()->id(),
            ]);

            // Auto-allocation to oldest unpaid invoices
            if ($request->auto_allocate) {
                $remainingAmount = $validated['amount'];
                $unpaidInvoices = Invoice::where('customer_id', $validated['customer_id'])
                    ->whereIn('status', ['unpaid', 'partially_paid'])
                    ->orderBy('issue_date', 'asc')
                    ->get();

                foreach ($unpaidInvoices as $invoice) {
                    if ($remainingAmount <= 0) break;

                    $amountDue = $invoice->total_amount - $invoice->allocations()->sum('amount_allocated');
                    $allocationAmount = min($remainingAmount, $amountDue);

                    if ($allocationAmount > 0) {
                        PaymentInvoiceAllocation::create([
                            'payment_id' => $payment->id,
                            'invoice_id' => $invoice->id,
                            'amount_allocated' => $allocationAmount,
                        ]);

                        $remainingAmount -= $allocationAmount;
                        
                        // Update invoice status
                        $totalAllocated = $invoice->allocations()->sum('amount_allocated');
                        if ($totalAllocated >= $invoice->total_amount) {
                            $invoice->update(['status' => 'paid']);
                        } else {
                            $invoice->update(['status' => 'partially_paid']);
                        }
                    }
                }
            } else if (!empty($validated['allocations'])) {
                foreach ($validated['allocations'] as $alloc) {
                    PaymentInvoiceAllocation::create([
                        'payment_id' => $payment->id,
                        'invoice_id' => $alloc['invoice_id'],
                        'amount_allocated' => $alloc['amount_allocated'],
                    ]);

                    // Update invoice status
                    $invoice = Invoice::findOrFail($alloc['invoice_id']);
                    $totalAllocated = $invoice->allocations()->sum('amount_allocated');
                    if ($totalAllocated >= $invoice->total_amount) {
                        $invoice->update(['status' => 'paid']);
                    } else {
                        $invoice->update(['status' => 'partially_paid']);
                    }
                }
            }

            return $this->success($payment, 'Payment recorded successfully', 201);
        });
    }
}
