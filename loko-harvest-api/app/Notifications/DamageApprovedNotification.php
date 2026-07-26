<?php

namespace App\Notifications;

class DamageApprovedNotification extends BaseNotification
{
    public string $priority = 'medium';
    public string $category = 'channel_damages';

    public function __construct(
        public string $adjustmentId,
        public string $productName
    ) {
        parent::__construct();
    }

    protected function getTitle($notifiable): string
    {
        return "Damage Report Approved";
    }

    protected function getBody($notifiable): string
    {
        return "Egg breakage report for {$this->productName} has been audited and approved.";
    }

    public function getRouteData(): array
    {
        return [
            'type' => 'production_store',
            'id' => $this->adjustmentId,
            'path' => '/production-store',
        ];
    }
}
