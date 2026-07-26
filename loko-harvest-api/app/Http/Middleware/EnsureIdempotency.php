<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\IdempotencyService;
use Symfony\Component\HttpFoundation\Response;

class EnsureIdempotency
{
    /**
     * Handle an incoming request and prevent duplicate mutations if idempotency key exists.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-ID') ?? $request->header('X-Idempotency-Key');

        if ($requestId) {
            $processed = IdempotencyService::find($requestId);
            if ($processed) {
                return response()->json($processed->response_payload, $processed->status_code);
            }
        }

        $response = $next($request);

        if ($requestId && $response->isSuccessful() && method_exists($response, 'getData')) {
            $payload = json_decode($response->getContent(), true) ?? [];
            IdempotencyService::store(
                $requestId,
                $request->method() . ' ' . $request->path(),
                $payload,
                $response->getStatusCode()
            );
        }

        return $response;
    }
}
