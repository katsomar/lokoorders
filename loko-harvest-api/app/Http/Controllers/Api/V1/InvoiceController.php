<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $invoices = Invoice::with(['customer', 'order'])
            ->when($request->search, function($q) use ($request) {
                $q->where('invoice_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', function($c) use ($request) {
                      $c->where('name', 'like', "%{$request->search}%");
                  });
            })
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($invoices);
    }

    public function show($id)
    {
        $invoice = Invoice::with([
            'customer.zone',
            'order.items.product'
        ])->findOrFail($id);

        return $this->success($invoice);
    }
}
