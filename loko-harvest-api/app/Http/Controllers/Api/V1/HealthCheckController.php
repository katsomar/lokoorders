<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthCheckController extends Controller
{
    use ApiResponses;

    public function check(): JsonResponse
    {
        $dbStatus = 'ok';
        $dbLatencyMs = 0;

        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $dbLatencyMs = round((microtime(true) - $start) * 1000, 2);
        } catch (\Exception $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        $freeDiskGb = function_exists('disk_free_space') ? round(disk_free_space(base_path()) / (1024 * 1024 * 1024), 2) : 'N/A';

        $isHealthy = $dbStatus === 'ok';

        return response()->json([
            'success' => $isHealthy,
            'message' => $isHealthy ? 'Loko Harvest Platform API is operational' : 'Database connectivity error',
            'data' => [
                'status' => $isHealthy ? 'healthy' : 'unhealthy',
                'environment' => config('app.env'),
                'timestamp' => now()->toIso8601String(),
                'service' => 'Loko Harvest API',
                'version' => '1.0.0',
                'checks' => [
                    'database' => [
                        'status' => $dbStatus,
                        'latency_ms' => $dbLatencyMs,
                    ],
                    'disk' => [
                        'free_gb' => $freeDiskGb,
                    ],
                ],
            ],
        ], $isHealthy ? 200 : 503);
    }
}
