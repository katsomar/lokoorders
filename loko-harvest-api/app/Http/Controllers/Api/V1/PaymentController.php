<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\BillingService;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use ApiResponses;

    public function __construct(
        protected BillingService $billingService
    ) {}

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
        $metrics = $this->billingService->getPaymentMetrics();

        return $this->success($metrics);
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

        $payment = $this->billingService->recordPayment(
            $validated,
            (bool) $request->auto_allocate,
            $validated['allocations'] ?? null
        );

        return $this->success($payment, 'Payment recorded successfully', 201);
    }
}
