<?php

namespace App\Notifications;

class TransferRejectedNotification extends BaseNotification
{
    public string $priority = 'high';
    public string $category = 'channel_transfers';

    public function __construct(
        public string $transferId,
        public string $productName,
        public string $reason
    ) {
        parent::__construct();
    }

    protected function getTitle($notifiable): string
    {
        return "Store Transfer Rejected";
    }

    protected function getBody($notifiable): string
    {
        return "Transfer request for {$this->productName} was rejected: {$this->reason}";
    }

    public function getRouteData(): array
    {
        return [
            'type' => 'order_manager',
            'id' => $this->transferId,
            'path' => '/order-manager?tab=transfers',
        ];
    }
}
