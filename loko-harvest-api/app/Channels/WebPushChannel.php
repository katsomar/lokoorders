<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class WebPushChannel
{
    public function send($notifiable, Notification $notification)
    {
        if (!method_exists($notification, 'toWebPush')) {
            return;
        }

        $payload = $notification->toWebPush($notifiable);
        if (!$payload) {
            return;
        }

        $subscriptions = PushSubscription::where('user_id', $notifiable->id)
            ->where('is_active', true)
            ->get();

        foreach ($subscriptions as $subscription) {
            try {
                $this->sendPushPayload($subscription, $payload);
                $subscription->update(['last_used_at' => now()]);
            } catch (\Throwable $e) {
                Log::warning("Failed to dispatch push to endpoint {$subscription->endpoint}: " . $e->getMessage());
            }
        }
    }

    protected function sendPushPayload($subscription, array $payload)
    {
        Http::withHeaders([
            'Content-Type' => 'application/json',
            'TTL' => $payload['ttl_seconds'] ?? 86400,
        ])->timeout(5)->post($subscription->endpoint, $payload);
    }
}
