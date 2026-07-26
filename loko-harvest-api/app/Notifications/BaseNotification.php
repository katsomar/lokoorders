<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;
use App\Channels\WebPushChannel;

abstract class BaseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public string $notificationUuid;
    public int $schemaVersion = 1;
    public string $priority = 'medium'; // critical, high, medium, low
    public int $ttlSeconds = 86400; // 24 hours default
    public string $category = 'channel_transfers';

    public function __construct()
    {
        $this->notificationUuid = (string) Str::uuid();
    }

    public function via($notifiable): array
    {
        // Check user preferences before broadcasting
        if ($notifiable->relationLoaded('notificationPreference') || $notifiable->notificationPreference) {
            $pref = $notifiable->notificationPreference;
            if ($pref && isset($pref->{$this->category}) && !$pref->{$this->category}) {
                return []; // Suppress if user disabled this channel preference
            }
        }

        return ['database', WebPushChannel::class];
    }

    abstract public function getRouteData(): array;

    public function toArray($notifiable): array
    {
        return [
            'id' => $this->notificationUuid,
            'notification_uuid' => $this->notificationUuid,
            'schema_version' => $this->schemaVersion,
            'priority' => $this->priority,
            'title' => $this->getTitle($notifiable),
            'body' => $this->getBody($notifiable),
            'route_data' => $this->getRouteData(),
            'expires_at' => now()->addSeconds($this->ttlSeconds)->toIso8601String(),
        ];
    }

    public function toWebPush($notifiable): array
    {
        return [
            'notification_uuid' => $this->notificationUuid,
            'schema_version' => $this->schemaVersion,
            'title' => $this->getTitle($notifiable),
            'body' => $this->getBody($notifiable),
            'icon' => '/logo/loko.png',
            'badge' => '/logo/badge.png',
            'priority' => $this->priority,
            'silent' => false,
            'ttl_seconds' => $this->ttlSeconds,
            'expires_at' => now()->addSeconds($this->ttlSeconds)->toIso8601String(),
            'route' => $this->getRouteData(),
        ];
    }

    abstract protected function getTitle($notifiable): string;
    abstract protected function getBody($notifiable): string;
}
