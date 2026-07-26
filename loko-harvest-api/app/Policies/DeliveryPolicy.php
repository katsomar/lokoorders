<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Delivery;

class DeliveryPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'order_manager', 'driver', 'store_manager']);
    }

    public function view(User $user, Delivery $delivery): bool
    {
        if ($user->role === 'driver') {
            return $delivery->driver_id === $user->id;
        }

        return in_array($user->role, ['admin', 'order_manager', 'store_manager']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'order_manager']);
    }

    public function update(User $user, Delivery $delivery): bool
    {
        if ($user->role === 'driver') {
            return $delivery->driver_id === $user->id;
        }

        return in_array($user->role, ['admin', 'order_manager']);
    }

    public function delete(User $user, Delivery $delivery): bool
    {
        return $user->role === 'admin';
    }
}
