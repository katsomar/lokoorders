<?php

namespace App\Notifications;

class TransferRequestedNotification extends BaseNotification
{
    public string $priority = 'medium';
    public string $category = 'channel_transfers';

    public function __construct(
        public string $transferId,
        public string $requestedBy,
        public string $productName,
        public float $quantity
    ) {
        parent::__construct();
    }

    protected function getTitle($notifiable): string
    {
        return "New Store Transfer Requested";
    }

    protected function getBody($notifiable): string
    {
        return "{$this->requestedBy} requested a transfer of {$this->quantity} Trays/Units of {$this->productName}.";
    }

    public function getRouteData(): array
    {
        return [
            'type' => 'pending_transfer',
            'id' => $this->transferId,
            'path' => '/pending-requests?tab=transfers',
        ];
    }
}
