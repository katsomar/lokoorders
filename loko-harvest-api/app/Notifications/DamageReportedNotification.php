<?php

namespace App\Notifications;

class DamageReportedNotification extends BaseNotification
{
    public string $priority = 'high';
    public string $category = 'channel_damages';

    public function __construct(
        public string $adjustmentId,
        public string $reportedBy,
        public string $productName,
        public float $quantity
    ) {
        parent::__construct();
    }

    protected function getTitle($notifiable): string
    {
        return "Egg Damage Reported";
    }

    protected function getBody($notifiable): string
    {
        return "{$this->reportedBy} reported {$this->quantity} Trays/Eggs damaged for {$this->productName}.";
    }

    public function getRouteData(): array
    {
        return [
            'type' => 'pending_damage',
            'id' => $this->adjustmentId,
            'path' => '/pending-requests?tab=adjustments',
        ];
    }
}
