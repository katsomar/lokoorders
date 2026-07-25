<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\InventoryService;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class ProductionStoreDashboardController extends Controller
{
    use ApiResponses;

    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function __invoke(Request $request)
    {
        $date = $request->date ?? date('Y-m-d');
        $productionStoreId = $request->production_store_id;

        $data = $this->inventoryService->getProductionStoreDashboardData($date, $productionStoreId);

        return $this->success($data);
    }
}
