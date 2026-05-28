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

    public function index()
    {
        $stock = SalesStoreStock::with('product')->get();
        return $this->success($stock);
    }

    public function movements(Request $request)
    {
        $movements = SalesStoreMovement::with(['product', 'user'])
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($movements);
    }
}
