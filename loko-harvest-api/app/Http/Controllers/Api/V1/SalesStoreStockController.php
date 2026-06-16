<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class SalesStoreStockController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $stock = SalesStoreStock::with(['product', 'salesStore'])
            ->when($request->sales_store_id, fn($q) => $q->where('sales_store_id', $request->sales_store_id))
            ->get();
        return $this->success($stock);
    }

    public function movements(Request $request)
    {
        $movements = SalesStoreMovement::with(['product', 'user', 'salesStore'])
            ->when($request->sales_store_id, fn($q) => $q->where('sales_store_id', $request->sales_store_id))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($movements);
    }
}
