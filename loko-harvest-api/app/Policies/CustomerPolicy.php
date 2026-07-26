<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Customer;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'order_manager', 'store_manager', 'driver', 'finance']);
    }

    public function view(User $user, Customer $customer): bool
    {
        return in_array($user->role, ['admin', 'order_manager', 'store_manager', 'driver', 'finance']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'order_manager']);
    }

    public function update(User $user, Customer $customer): bool
    {
        return in_array($user->role, ['admin', 'order_manager']);
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $user->role === 'admin';
    }
}
