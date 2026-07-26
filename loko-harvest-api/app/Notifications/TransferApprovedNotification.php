<?php

namespace App\Notifications;

class TransferApprovedNotification extends BaseNotification
{
    public string $priority = 'high';
    public string $category = 'channel_transfers';

    public function __construct(
        public string $transferId,
        public string $productName,
        public float $quantity
    ) {
        parent::__construct();
    }

    protected function getTitle($notifiable): string
    {
        return "Store Transfer Approved";
    }

    protected function getBody($notifiable): string
    {
        return "Your transfer request for {$this->quantity} Trays/Units of {$this->productName} has been approved.";
    }

    public function getRouteData(): array
    {
        return [
            'type' => 'sales_store',
            'id' => $this->transferId,
            'path' => '/sales-store',
        ];
    }
}
