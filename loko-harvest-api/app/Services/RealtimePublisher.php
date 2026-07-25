<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class RealtimePublisher
{
    /**
     * Broadcast a real-time event to active SSE listeners.
     */
    public static function publish(string $event, array $payload = []): void
    {
        $timestamp = microtime(true);
        Cache::put('realtime_last_event', [
            'event' => $event,
            'payload' => $payload,
            'timestamp' => $timestamp,
        ], 60); // 60 seconds TTL
    }

    /**
     * Get the latest published real-time event.
     */
    public static function getLatest(): ?array
    {
        return Cache::get('realtime_last_event');
    }
}
