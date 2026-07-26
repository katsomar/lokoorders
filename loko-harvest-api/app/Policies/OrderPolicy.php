<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Order;

class OrderPolicy
{
    /**
     * Determine whether the user can view any orders.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'order_manager', 'store_manager', 'driver', 'finance']);
    }

    /**
     * Determine whether the user can view the specific order.
     */
    public function view(User $user, Order $order): bool
    {
        return in_array($user->role, ['admin', 'order_manager', 'store_manager', 'driver', 'finance']);
    }

    /**
     * Determine whether the user can create orders.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'order_manager', 'store_manager']);
    }

    /**
     * Determine whether the user can update the order.
     */
    public function update(User $user, Order $order): bool
    {
        if (in_array($order->status, ['dispatched', 'delivered'])) {
            return false;
        }

        return in_array($user->role, ['admin', 'order_manager']);
    }

    /**
     * Determine whether the user can delete the order.
     */
    public function delete(User $user, Order $order): bool
    {
        if (in_array($order->status, ['dispatched', 'delivered'])) {
            return false;
        }

        return $user->role === 'admin';
    }
}
