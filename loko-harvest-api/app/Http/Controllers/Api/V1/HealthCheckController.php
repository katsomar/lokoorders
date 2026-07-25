<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponses;
use Illuminate\Http\JsonResponse;

class HealthCheckController extends Controller
{
    use ApiResponses;

    public function check(): JsonResponse
    {
        return $this->success([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'service' => 'Loko Harvest API',
            'version' => '1.0.0',
        ], 'Server is healthy');
    }
}
