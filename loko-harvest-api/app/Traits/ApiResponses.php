<?php

namespace App\Traits;

trait ApiResponses
{
    protected function success($data, $message = null, $code = 200, $meta = [])
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'meta' => $meta
        ], $code);
    }

    protected function error($message, $code, $data = null)
    {
        return response()->json([
            'success' => false,
            'data' => $data,
            'message' => $message
        ], $code);
    }
}
