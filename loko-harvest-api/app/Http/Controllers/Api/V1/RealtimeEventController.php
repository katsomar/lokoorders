<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\RealtimePublisher;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RealtimeEventController extends Controller
{
    public function stream(Request $request): StreamedResponse
    {
        $token = $request->bearerToken() ?? $request->query('token');
        if ($token && !auth()->check()) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            if ($accessToken) {
                auth()->setUser($accessToken->tokenable);
            }
        }

        $response = new StreamedResponse(function () {
            // Set max execution time to 0 to prevent timeout
            set_time_limit(0);
            
            // Turn off output buffering
            if (ob_get_level() > 0) {
                ob_end_clean();
            }

            $lastTimestamp = 0.0;
            $startTime = time();

            // Stream for up to 5 minutes per connection (browser EventSource will auto-reconnect)
            while ((time() - $startTime) < 300) {
                if (connection_aborted()) {
                    break;
                }

                $latest = RealtimePublisher::getLatest();

                if ($latest && isset($latest['timestamp']) && $latest['timestamp'] > $lastTimestamp) {
                    $lastTimestamp = $latest['timestamp'];
                    
                    $event = $latest['event'];
                    $payload = json_encode($latest);

                    echo "event: {$event}\n";
                    echo "data: {$payload}\n\n";
                    
                    if (ob_get_level() > 0) {
                        ob_flush();
                    }
                    flush();
                } else {
                    // Send heartbeat ping every 10 iterations (approx 10s)
                    echo ": heartbeat\n\n";
                    if (ob_get_level() > 0) {
                        ob_flush();
                    }
                    flush();
                }

                // Sleep for 1 second before checking for new events
                sleep(1);
            }
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache, no-transform');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }
}
