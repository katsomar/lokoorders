<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    use ApiResponses;

    public function getVapidPublicKey()
    {
        return $this->success([
            'publicKey' => config('services.vapid.public_key', env('VAPID_PUBLIC_KEY', 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-Njv89lq83k48k5-901k'))
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
            'device_name' => 'nullable|string',
        ]);

        $subscription = PushSubscription::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'endpoint' => $request->endpoint,
            ],
            [
                'p256dh_key' => $request->input('keys.p256dh'),
                'auth_token' => $request->input('keys.auth'),
                'user_agent' => $request->userAgent(),
                'device_name' => $request->input('device_name', $request->userAgent()),
                'is_active' => true,
                'last_used_at' => now(),
            ]
        );

        return $this->success($subscription, 'Push subscription saved successfully');
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        PushSubscription::where('user_id', auth()->id())
            ->where('endpoint', $request->endpoint)
            ->update(['is_active' => false]);

        return $this->success(null, 'Unsubscribed from push notifications');
    }
}
