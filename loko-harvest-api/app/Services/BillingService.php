<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\CustomerAccount;
use App\Models\AccountTransaction;
use App\Models\Invoice;
use App\Models\PaymentInvoiceAllocation;
use Illuminate\Support\Facades\DB;

class BillingService
{
    /**
     * Record customer payment, update credit account ledger, and allocate against unpaid invoices.
     *
     * @param array $data
     * @param bool $autoAllocate
     * @param array|null $manualAllocations
     * @param string|int|null $userId
     * @return Payment
     */
    public function recordPayment(
        array $data,
        bool $autoAllocate = false,
        ?array $manualAllocations = null,
        string|int|null $userId = null
    ): Payment {
        $creatorId = $userId ?? auth()->id();

        return DB::transaction(function () use ($data, $autoAllocate, $manualAllocations, $creatorId) {
            $paymentNumber = 'LHP-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

            $payment = Payment::create([
                'payment_number' => $paymentNumber,
                'customer_id' => $data['customer_id'],
                'payment_date' => $data['payment_date'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'],
                'reference_number' => $data['reference_number'] ?? null,
                'transaction_reference' => $data['reference_number'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => 'completed',
                'created_by' => $creatorId,
                'received_by' => $creatorId,
            ]);

            // Update Customer Account
            $account = CustomerAccount::firstOrCreate(
                ['customer_id' => $data['customer_id']],
                ['current_balance' => 0, 'total_invoiced' => 0, 'total_paid' => 0]
            );

            $account->decrement('current_balance', $data['amount']);
            $account->increment('total_paid', $data['amount']);

            // Log Transaction
            AccountTransaction::create([
                'customer_id' => $data['customer_id'],
                'type' => 'payment_received',
                'reference_number' => $payment->payment_number,
                'description' => "Payment received via " . str_replace('_', ' ', $data['payment_method']) . (!empty($data['reference_number']) ? " (#{$data['reference_number']})" : ""),
                'debit_amount' => 0.00,
                'credit_amount' => $data['amount'],
                'running_balance' => $account->current_balance,
                'transaction_date' => $data['payment_date'],
                'created_by' => $creatorId,
            ]);

            // Auto-allocation to oldest unpaid invoices
            if ($autoAllocate) {
                $remainingAmount = $data['amount'];
                $unpaidInvoices = Invoice::where('customer_id', $data['customer_id'])
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

                        $totalAllocated = $invoice->allocations()->sum('amount_allocated');
                        if ($totalAllocated >= $invoice->total_amount) {
                            $invoice->update(['status' => 'paid']);
                        } else {
                            $invoice->update(['status' => 'partially_paid']);
                        }
                    }
                }
            } else if (!empty($manualAllocations)) {
                foreach ($manualAllocations as $alloc) {
                    PaymentInvoiceAllocation::create([
                        'payment_id' => $payment->id,
                        'invoice_id' => $alloc['invoice_id'],
                        'amount_allocated' => $alloc['amount_allocated'],
                    ]);

                    $invoice = Invoice::findOrFail($alloc['invoice_id']);
                    $totalAllocated = $invoice->allocations()->sum('amount_allocated');
                    if ($totalAllocated >= $invoice->total_amount) {
                        $invoice->update(['status' => 'paid']);
                    } else {
                        $invoice->update(['status' => 'partially_paid']);
                    }
                }
            }

            return $payment;
        });
    }

    /**
     * Compute payment collections and accounts receivable metrics.
     *
     * @return array
     */
    public function getPaymentMetrics(): array
    {
        $startOfMonth = now()->startOfMonth()->toDateString();
        $endOfMonth = now()->endOfMonth()->toDateString();

        $totalMtd = Payment::whereBetween('payment_date', [$startOfMonth, $endOfMonth])->sum('amount');

        $methodStats = Payment::select('payment_method', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->orderByDesc('total')
            ->first();

        $topMethod = $methodStats ? $methodStats->payment_method : 'N/A';
        $topMethodShare = 0;
        $totalAllTime = Payment::sum('amount');
        if ($totalAllTime > 0 && $methodStats) {
            $topMethodShare = (int) round(($methodStats->total / $totalAllTime) * 100);
        }

        $totalOutstanding = CustomerAccount::sum('current_balance');

        return [
            'total_mtd_collections' => (float)$totalMtd,
            'top_method' => $topMethod,
            'top_method_share' => $topMethodShare,
            'total_outstanding' => (float)$totalOutstanding,
        ];
    }
}
