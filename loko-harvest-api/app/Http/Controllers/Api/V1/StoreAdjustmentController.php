<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StoreAdjustment;
use App\Models\ProductionStoreStock;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class StoreAdjustmentController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $perPage = $request->per_page;
        $query = StoreAdjustment::with(['product', 'productionStore', 'salesStore', 'creator', 'approver'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->store_type, fn($q) => $q->where('store_type', $request->store_type))
            ->when($request->production_store_id, fn($q) => $q->where('production_store_id', $request->production_store_id))
            ->when($request->sales_store_id, fn($q) => $q->where('sales_store_id', $request->sales_store_id))
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->when($request->batch_reference, fn($q) => $q->where('batch_reference', $request->batch_reference))
            ->when($request->adjustment_date, fn($q) => $q->whereDate('adjustment_date', $request->adjustment_date))
            ->latest();

        if ($perPage == -1) {
            $adjustments = $query->get();
        } else {
            $adjustments = $query->paginate($perPage ?? 15);
        }

        return $this->success($adjustments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_type' => 'required|in:production,sales',
            'production_store_id' => 'required_if:store_type,production|nullable|exists:production_stores,id',
            'sales_store_id' => 'required_if:store_type,sales|nullable|exists:sales_stores,id',
            'product_id' => 'required|exists:products,id',
            'batch_reference' => 'required|string',
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:500',
            'image_file' => 'nullable|image|max:5120', // Max 5MB
            'signature_data' => 'required|string', // Base64 signature
        ]);

        // Upload photo
        $imagePath = null;
        if ($request->hasFile('image_file')) {
            $imagePath = $request->file('image_file')->store('store_adjustments/images', 'public');
        }

        // Decode base64 signature and save
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
            $signaturePath = 'store_adjustments/signatures/' . $fileName;
            Storage::disk('public')->put($signaturePath, $imageBase64);
        }

        $user = auth()->user() ?? \App\Models\User::first();
        $isAdmin = ($user && $user->role === 'admin');

        // Store adjustment record (quantity_change is stored as negative representing reduction/exit)
        $adjustment = StoreAdjustment::create([
            'store_type' => $validated['store_type'],
            'production_store_id' => $validated['production_store_id'] ?? null,
            'sales_store_id' => $validated['sales_store_id'] ?? null,
            'product_id' => $validated['product_id'],
            'batch_reference' => $validated['batch_reference'],
            'quantity_change' => -abs($validated['quantity']),
            'reason' => $validated['reason'],
            'image_path' => $imagePath,
            'signature_path' => $signaturePath,
            'status' => $isAdmin ? 'approved' : 'pending',
            'created_by' => $user->id,
            'approved_by' => $isAdmin ? $user->id : null,
            'approved_at' => $isAdmin ? now() : null,
            'adjustment_date' => now()->toDateString(),
        ]);

        if ($isAdmin) {
            DB::transaction(function () use ($adjustment, $user) {
                $qty = abs($adjustment->quantity_change);

                if ($adjustment->store_type === 'production') {
                    $stock = ProductionStoreStock::firstOrCreate(
                        [
                            'production_store_id' => $adjustment->production_store_id,
                            'product_id' => $adjustment->product_id,
                            'batch_reference' => $adjustment->batch_reference,
                        ]
                    );
                    $stock->updateStock('damage', $qty);
                } else {
                    $stock = SalesStoreStock::firstOrCreate(
                        [
                            'sales_store_id' => $adjustment->sales_store_id,
                            'product_id' => $adjustment->product_id,
                            'batch_reference' => $adjustment->batch_reference,
                        ],
                        [
                            'current_quantity' => 0,
                            'unit_price' => 0,
                            'updated_by' => $user->id,
                        ]
                    );
                    $stock->updateStock('damage', $qty);

                    SalesStoreMovement::create([
                        'sales_store_id' => $adjustment->sales_store_id,
                        'product_id' => $adjustment->product_id,
                        'batch_reference' => $adjustment->batch_reference,
                        'movement_date' => now()->toDateString(),
                        'movement_type' => 'wastage',
                        'quantity' => $qty,
                        'reference_id' => $adjustment->id,
                        'notes' => 'Stock adjustment auto-approved for Admin: ' . $adjustment->reason,
                        'created_by' => $user->id,
                    ]);
                }
            });

            return $this->success($adjustment, 'Stock adjustment request auto-approved and stock updated successfully.');
        }

        return $this->success($adjustment, 'Stock adjustment request submitted successfully and is pending approval.');
    }

    public function approve($id)
    {
        $adjustment = StoreAdjustment::findOrFail($id);

        if ($adjustment->status !== 'pending') {
            return $this->error('This request has already been processed.', 422);
        }

        DB::transaction(function () use ($adjustment) {
            $qty = abs($adjustment->quantity_change);

            if ($adjustment->store_type === 'production') {
                $stock = ProductionStoreStock::firstOrCreate(
                    [
                        'production_store_id' => $adjustment->production_store_id,
                        'product_id' => $adjustment->product_id,
                        'batch_reference' => $adjustment->batch_reference,
                    ]
                );
                $stock->updateStock('damage', $qty);
            } else {
                // Find or create sales stock row for the batch reference
                $stock = SalesStoreStock::firstOrCreate(
                    [
                        'sales_store_id' => $adjustment->sales_store_id,
                        'product_id' => $adjustment->product_id,
                        'batch_reference' => $adjustment->batch_reference,
                    ],
                    [
                        'current_quantity' => 0,
                        'unit_price' => 0,
                        'updated_by' => auth()->id() ?? \App\Models\User::first()->id,
                    ]
                );
                $stock->updateStock('damage', $qty);

                // Log sales store movement
                SalesStoreMovement::create([
                    'sales_store_id' => $adjustment->sales_store_id,
                    'product_id' => $adjustment->product_id,
                    'batch_reference' => $adjustment->batch_reference,
                    'movement_date' => now()->toDateString(),
                    'movement_type' => 'wastage',
                    'quantity' => $qty,
                    'reference_id' => $adjustment->id,
                    'notes' => 'Stock adjustment approved: ' . $adjustment->reason,
                    'created_by' => auth()->id() ?? $adjustment->created_by,
                ]);
            }

            $adjustment->update([
                'status' => 'approved',
                'approved_by' => auth()->id() ?? \App\Models\User::first()->id,
                'approved_at' => now(),
            ]);
        });

        return $this->success($adjustment->load(['product', 'productionStore', 'salesStore']), 'Stock adjustment request approved and stock successfully updated.');
    }

    public function reject($id)
    {
        $adjustment = StoreAdjustment::findOrFail($id);

        if ($adjustment->status !== 'pending') {
            return $this->error('This request has already been processed.', 422);
        }

        $adjustment->update([
            'status' => 'rejected',
            'approved_by' => auth()->id() ?? \App\Models\User::first()->id,
            'approved_at' => now(),
        ]);

        return $this->success($adjustment->load(['product', 'productionStore', 'salesStore']), 'Stock adjustment request rejected.');
    }
}
