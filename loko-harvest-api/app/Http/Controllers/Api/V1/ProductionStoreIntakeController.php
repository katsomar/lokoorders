<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductionStoreIntake;
use App\Models\ProductionStoreStock;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionStoreIntakeController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $intakes = ProductionStoreIntake::with(['product', 'user'])
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($intakes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'production_store_id' => 'required|exists:production_stores,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'nullable|numeric|min:0.01',
            'intake_date' => 'required|date',
            'valuation_price' => 'required|numeric|min:0',
            'batch_number' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $product = \App\Models\Product::findOrFail($validated['product_id']);
            $productCode = $product->code;

            $allowedCodes = [
                'EGG-WHT', 'EGG-BRN', 'EGG-CRM',
                'EGG-WHT-D1', 'EGG-WHT-D2', 'EGG-WHT-D3', 'EGG-WHT-SHL',
                'EGG-CRM-D1', 'EGG-CRM-D2', 'EGG-CRM-D3', 'EGG-CRM-SHL',
                'EGG-BRN-D1', 'EGG-BRN-D2', 'EGG-BRN-D3', 'EGG-BRN-SHL',
                'POU-DRS', 'POU-LVE', 'BY-MNR'
            ];

            if (!in_array($productCode, $allowedCodes)) {
                return $this->error('Only white plain trays, brown plain trays, cream plain trays, live chicken, dressed chicken, and manure can be recorded as production store intakes.', 422);
            }

            // Check if it is a raw egg intake (White, Cream, Brown)
            if (in_array($productCode, ['EGG-WHT', 'EGG-BRN', 'EGG-CRM'])) {
                // Parse the detailed quantities
                $goodQty = ($request->good_stacks ?? 0) * 30 + ($request->good_extra_trays ?? 0) + ($request->good_extra_eggs ?? 0) / 30;

                // Fallback to legacy single quantity field if no detailed fields were provided
                if ($goodQty <= 0 && $request->has('quantity')) {
                    $goodQty = (float) $request->quantity;
                }
                $d1Qty = ($request->d1_trays ?? 0) + ($request->d1_extra_eggs ?? 0) / 30;
                $d2Qty = ($request->d2_trays ?? 0) + ($request->d2_extra_eggs ?? 0) / 30;
                $d3Qty = ($request->d3_trays ?? 0) + ($request->d3_extra_eggs ?? 0) / 30;
                $shellQty = ($request->shell_trays ?? 0) + ($request->shell_extra_eggs ?? 0) / 30;

                $categories = [
                    $productCode => [
                        'qty' => $goodQty,
                        'price' => $request->good_valuation_price ?? $validated['valuation_price']
                    ],
                    $productCode . '-D1' => [
                        'qty' => $d1Qty,
                        'price' => $request->d1_valuation_price ?? $validated['valuation_price']
                    ],
                    $productCode . '-D2' => [
                        'qty' => $d2Qty,
                        'price' => $request->d2_valuation_price ?? $validated['valuation_price']
                    ],
                    $productCode . '-D3' => [
                        'qty' => $d3Qty,
                        'price' => $request->d3_valuation_price ?? 0
                    ],
                    $productCode . '-SHL' => [
                        'qty' => $shellQty,
                        'price' => $request->shell_valuation_price ?? $validated['valuation_price']
                    ]
                ];

                $createdIntake = null;

                foreach ($categories as $code => $data) {
                    $qty = $data['qty'];
                    $price = $data['price'];
                    if ($qty <= 0) {
                        continue;
                    }

                    $subProduct = \App\Models\Product::where('code', $code)->first();
                    if (!$subProduct) {
                        continue;
                    }

                    $intake = ProductionStoreIntake::create([
                        'intake_date' => $validated['intake_date'],
                        'production_store_id' => $validated['production_store_id'],
                        'product_id' => $subProduct->id,
                        'quantity' => $qty,
                        'valuation_price' => $price,
                        'unit_of_measure' => $subProduct->unit_of_measure,
                        'batch_reference' => $validated['batch_number'] ?? null,
                        'notes' => $validated['notes'] ?? null,
                        'received_by' => auth()->id(),
                    ]);

                    if ($code === $productCode) {
                        $createdIntake = $intake;
                    }

                    // Update Production Store Stock
                    $stock = ProductionStoreStock::firstOrCreate(
                        [
                            'production_store_id' => $validated['production_store_id'],
                            'product_id' => $subProduct->id,
                            'batch_reference' => $validated['batch_number'] ?? null
                        ],
                        ['current_quantity' => 0, 'updated_by' => auth()->id(), 'valuation_price' => $price]
                    );

                    $stock->update([
                        'updated_by' => auth()->id(),
                        'last_updated' => now()
                    ]);
                    $stock->updateStock('add', $qty, $price);
                }

                $responseIntake = $createdIntake ?? ProductionStoreIntake::where('production_store_id', $validated['production_store_id'])
                    ->where('batch_reference', $validated['batch_number'] ?? null)
                    ->latest()
                    ->first();

                return $this->success($responseIntake ? $responseIntake->load('product') : null, 'Intake recorded successfully', 201);
            }

            // For non-egg products, fallback to standard single quantity logic
            $quantity = $validated['quantity'] ?? 0;
            if ($quantity <= 0) {
                return $this->error('Quantity must be greater than 0 for non-egg products.', 422);
            }

            $intake = ProductionStoreIntake::create([
                'intake_date' => $validated['intake_date'],
                'production_store_id' => $validated['production_store_id'],
                'product_id' => $validated['product_id'],
                'quantity' => $quantity,
                'valuation_price' => $validated['valuation_price'],
                'unit_of_measure' => $product->unit_of_measure,
                'batch_reference' => $validated['batch_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'received_by' => auth()->id(),
            ]);

            // Update Production Store Stock
            $stock = ProductionStoreStock::firstOrCreate(
                [
                    'production_store_id' => $validated['production_store_id'],
                    'product_id' => $validated['product_id'],
                    'batch_reference' => $validated['batch_number'] ?? null
                ],
                ['current_quantity' => 0, 'updated_by' => auth()->id(), 'valuation_price' => $validated['valuation_price']]
            );

            $stock->update([
                'updated_by' => auth()->id(),
                'last_updated' => now()
            ]);
            $stock->updateStock('add', $quantity, $validated['valuation_price']);

            return $this->success($intake->load('product'), 'Intake recorded successfully', 201);
        });
    }
}
