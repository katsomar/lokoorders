<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ReturnVoucher;
use App\Models\CustomerAccount;
use App\Models\AccountTransaction;
use App\Models\User;
use App\Models\Order;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReturnVoucherController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $vouchers = ReturnVoucher::with(['customer', 'product', 'order.salesStore', 'delivery', 'creator'])
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
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->pending_replacements, function ($q) {
                $q->where('return_type', 'physical_replacement')
                  ->whereColumn('quantity', '>', 'replacement_quantity');
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

        $seq = $this->getNextVoucherSequence();
        $validated['voucher_number'] = 'LHRV-' . date('Y') . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
        $validated['account_credit_posted'] = false;

        $voucher = ReturnVoucher::create($validated);

        return $this->success($voucher->load(['customer', 'product', 'order', 'delivery']), 'Return voucher recorded successfully', 201);
    }

    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'delivery_id' => 'required|uuid|exists:deliveries,id',
            'order_id' => 'required|uuid|exists:orders,id',
            'customer_id' => 'required|uuid|exists:customers,id',
            'reason_code' => 'required|in:broken_cracked,rotten_spoiled,wrong_product,near_expiry,packaging_damage,other',
            'notes' => 'nullable|string',
            'acknowledged_by' => 'required|string',
            'signature_data' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.batch_reference' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.replacement_quantity' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Decode base64 signature
            $signaturePath = null;
            if ($request->filled('signature_data')) {
                $base64Image = $request->input('signature_data');
                if (str_contains($base64Image, ';base64,')) {
                    $imageParts = explode(";base64,", $base64Image);
                    $imageTypeAux = explode("image/", $imageParts[0]);
                    $imageType = $imageTypeAux[1] ?? 'png';
                    $imageBase64 = base64_decode($imageParts[1]);
                } else {
                    $imageType = 'png';
                    $imageBase64 = base64_decode($base64Image);
                }
                $fileName = uniqid() . '.' . $imageType;
                $signaturePath = 'delivery_proofs/signatures/' . $fileName;
                Storage::disk('public')->put($signaturePath, $imageBase64);
            }

            $createdVouchers = [];
            $createdBy = auth()->id() ?? User::first()?->id;
            $nextSeq = $this->getNextVoucherSequence();

            foreach ($validated['items'] as $item) {
                $voucherNumber = 'LHRV-' . date('Y') . '-' . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);
                $nextSeq++;
                
                $monetaryValue = $item['quantity'] * $item['unit_price'];

                $voucher = ReturnVoucher::create([
                    'voucher_number' => $voucherNumber,
                    'customer_id' => $validated['customer_id'],
                    'product_id' => $item['product_id'],
                    'order_id' => $validated['order_id'],
                    'delivery_id' => $validated['delivery_id'],
                    'batch_reference' => $item['batch_reference'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'monetary_value' => $monetaryValue,
                    'replacement_quantity' => $item['replacement_quantity'],
                    'return_type' => 'physical_replacement',
                    'reason_code' => $validated['reason_code'],
                    'notes' => $validated['notes'] ?? null,
                    'return_date' => now()->toDateString(),
                    'date_replaced' => $item['replacement_quantity'] > 0 ? now()->toDateString() : null,
                    'acknowledged_by' => $validated['acknowledged_by'],
                    'signature_path' => $signaturePath,
                    'account_credit_posted' => false,
                    'created_by' => $createdBy,
                ]);

                $createdVouchers[] = $voucher;
            }

            return $this->success($createdVouchers, 'Return vouchers recorded successfully in bulk', 201);
        });
    }

    public function deliverReplacements(Request $request)
    {
        $validated = $request->validate([
            'acknowledged_by' => 'required|string',
            'signature_data' => 'required|string',
            'replacements' => 'required|array|min:1',
            'replacements.*.return_voucher_id' => 'required|uuid|exists:return_vouchers,id',
            'replacements.*.replacement_quantity' => 'required|numeric|min:0.01',
            'replacements.*.sales_store_id' => 'required|uuid|exists:sales_stores,id',
            'replacements.*.batch_reference' => 'required|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Decode base64 signature
            $signaturePath = null;
            if ($request->filled('signature_data')) {
                $base64Image = $request->input('signature_data');
                if (str_contains($base64Image, ';base64,')) {
                    $imageParts = explode(";base64,", $base64Image);
                    $imageTypeAux = explode("image/", $imageParts[0]);
                    $imageType = $imageTypeAux[1] ?? 'png';
                    $imageBase64 = base64_decode($imageParts[1]);
                } else {
                    $imageType = 'png';
                    $imageBase64 = base64_decode($base64Image);
                }
                $fileName = uniqid() . '.' . $imageType;
                $signaturePath = 'delivery_proofs/signatures/' . $fileName;
                Storage::disk('public')->put($signaturePath, $imageBase64);
            }

            $updatedVouchers = [];

            foreach ($validated['replacements'] as $item) {
                $voucher = ReturnVoucher::findOrFail($item['return_voucher_id']);
                
                // Ensure we don't replace more than the remaining quantity
                $remaining = $voucher->quantity - $voucher->replacement_quantity;
                $replacing = min($item['replacement_quantity'], $remaining);

                if ($replacing > 0) {
                    // Deduct from Sales Store Stock
                    $stock = \App\Models\SalesStoreStock::where('sales_store_id', $item['sales_store_id'])
                        ->where('product_id', $voucher->product_id)
                        ->where('batch_reference', $item['batch_reference'])
                        ->first();

                    if (!$stock || $stock->current_quantity < $replacing) {
                        throw new \Exception("Insufficient stock in the selected sales store for product: " . ($voucher->product->name ?? 'Product') . " (Batch: " . $item['batch_reference'] . ")");
                    }

                    $stock->decrement('current_quantity', $replacing);

                    // Create movement log for the deduction
                    \App\Models\SalesStoreMovement::create([
                        'sales_store_id' => $item['sales_store_id'],
                        'product_id' => $voucher->product_id,
                        'batch_reference' => $item['batch_reference'],
                        'quantity' => $replacing,
                        'movement_type' => 'dispatch_out',
                        'movement_date' => now()->toDateString(),
                        'reference_id' => $voucher->id,
                        'notes' => 'Replacement for return voucher ' . $voucher->voucher_number,
                        'created_by' => auth()->id() ?? User::first()?->id ?? $voucher->created_by,
                    ]);

                    $voucher->increment('replacement_quantity', $replacing);
                    $voucher->update([
                        'date_replaced' => now()->toDateString(),
                        'acknowledged_by' => $validated['acknowledged_by'],
                        'signature_path' => $signaturePath,
                        'replacement_sales_store_id' => $item['sales_store_id'],
                        'replacement_batch_reference' => $item['batch_reference'],
                    ]);
                }
                
                $updatedVouchers[] = $voucher->fresh();
            }

            return $this->success($updatedVouchers, 'Replacement deliveries recorded successfully');
        });
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

    private function getNextVoucherSequence()
    {
        $year = date('Y');
        $latestVoucher = ReturnVoucher::where('voucher_number', 'like', "LHRV-{$year}-%")
            ->orderBy('voucher_number', 'desc')
            ->first();

        if ($latestVoucher) {
            $parts = explode('-', $latestVoucher->voucher_number);
            return (int) end($parts) + 1;
        }

        return 1;
    }
}
