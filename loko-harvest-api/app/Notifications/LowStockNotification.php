<?php

namespace App\Notifications;

class LowStockNotification extends BaseNotification
{
    public string $priority = 'high';
    public string $category = 'channel_stock_alerts';

    public function __construct(
        public array $lowStockItems // e.g. [['product_name' => 'White Eggs', 'current_stock' => 12]]
    ) {
        parent::__construct();
    }

    protected function getTitle($notifiable): string
    {
        $count = count($this->lowStockItems);
        return $count > 1 ? "Low Stock Warning ({$count} Products)" : "Low Stock Warning";
    }

    protected function getBody($notifiable): string
    {
        $count = count($this->lowStockItems);
        if ($count === 1) {
            $item = $this->lowStockItems[0];
            return "{$item['product_name']} stock has fallen to {$item['current_stock']} Trays.";
        }

        $names = implode(', ', array_slice(array_column($this->lowStockItems, 'product_name'), 0, 3));
        return "{$count} products ({$names}...) are below safety minimum stock levels.";
    }

    public function getRouteData(): array
    {
        return [
            'type' => 'inventory_alert',
            'id' => 'low-stock-summary',
            'path' => '/production-store?tab=inventory',
        ];
    }
}
