<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserNotificationPreference;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    use ApiResponses;

    public function show()
    {
        $pref = UserNotificationPreference::firstOrCreate(
            ['user_id' => auth()->id()],
            [
                'channel_transfers' => true,
                'channel_damages' => true,
                'channel_stock_alerts' => true,
                'channel_deliveries' => true,
                'channel_payments' => true,
            ]
        );

        return $this->success($pref);
    }

    public function update(Request $request)
    {
        $request->validate([
            'channel_transfers' => 'boolean',
            'channel_damages' => 'boolean',
            'channel_stock_alerts' => 'boolean',
            'channel_deliveries' => 'boolean',
            'channel_payments' => 'boolean',
        ]);

        $pref = UserNotificationPreference::updateOrCreate(
            ['user_id' => auth()->id()],
            $request->only([
                'channel_transfers',
                'channel_damages',
                'channel_stock_alerts',
                'channel_deliveries',
                'channel_payments',
            ])
        );

        return $this->success($pref, 'Notification preferences updated successfully');
    }
}
