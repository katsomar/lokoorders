<?php

namespace App\Services;

use App\Models\ProcessedRequest;

class IdempotencyService
{
    /**
     * Check if a request_id has already been processed.
     */
    public static function find(string $requestId): ?ProcessedRequest
    {
        return ProcessedRequest::find($requestId);
    }

    /**
     * Store a completed request payload.
     */
    public static function store(string $requestId, string $actionType, array $responsePayload, int $statusCode = 200): ProcessedRequest
    {
        return ProcessedRequest::create([
            'id' => $requestId,
            'user_id' => auth()->id(),
            'action_type' => $actionType,
            'response_payload' => $responsePayload,
            'status_code' => $statusCode,
        ]);
    }
}
