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
        $payments = Payment::with(['customer', 'allocations.invoice'])
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($payments);
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
        ]);

        return DB::transaction(function () use ($validated) {
            $payment = Payment::create([
                'payment_number' => 'LHP-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4)),
                'customer_id' => $validated['customer_id'],
                'payment_date' => $validated['payment_date'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'completed',
                'created_by' => auth()->id(),
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
                'transaction_date' => $validated['payment_date'],
                'transaction_type' => 'payment',
                'amount' => $validated['amount'],
                'balance_after' => $account->current_balance,
                'reference_id' => $payment->id,
                'description' => "Payment received via {$validated['payment_method']}",
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
            }

            return $this->success($payment, 'Payment recorded successfully', 201);
        });
    }
}
