<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use App\Models\ProductionStore;
use App\Models\SalesStore;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\StoreTransfer;
use App\Models\StoreAdjustment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            $message = 'Your account is inactive.';
            if ($user->status === 'pending') {
                $message = 'Your account is pending administrator approval.';
            } elseif ($user->status === 'suspended') {
                $message = 'Your account has been suspended.';
            } elseif ($user->status === 'rejected') {
                $message = 'Your account registration has been rejected.';
            }

            throw ValidationException::withMessages([
                'email' => [$message],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $user->createToken($request->device_name)->plainTextToken,
                'user' => $user
            ],
            'message' => 'Login successful'
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string',
            'role' => 'required|string|in:admin,order_manager',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => $request->role,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration request submitted successfully. It is pending administrator approval.',
            'data' => $user
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
            'message' => 'User profile retrieved'
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'current_password' => ['The provided current password is incorrect.'],
            ]);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.'
        ]);
    }

    public function bootstrap(Request $request)
    {
        $user = $request->user();

        // 1. Static lookups (optimizing columns to reduce payload size)
        $products = Product::where('is_active', true)
            ->select('id', 'name', 'code', 'category', 'unit_of_measure', 'default_unit_price', 'production_unit_price', 'sales_unit_price', 'production_egg_unit_price', 'sales_egg_unit_price')
            ->get();

        $productionStores = ProductionStore::select('id', 'name', 'code', 'location')->get();
        $salesStores = SalesStore::select('id', 'name', 'code', 'location')->get();
        $customers = Customer::select('id', 'name', 'code', 'parent_id', 'phone', 'email')->get();

        // 2. System notifications and approvals
        $unreadNotifications = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        $pendingTransfers = StoreTransfer::where('status', 'pending')->count();
        $pendingAdjustments = StoreAdjustment::where('status', 'pending')->count();
        $pendingApprovals = $pendingTransfers + $pendingAdjustments;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'lookups' => [
                    'products' => $products,
                    'production_stores' => $productionStores,
                    'sales_stores' => $salesStores,
                    'customers' => $customers,
                ],
                'system' => [
                    'unread_notifications' => $unreadNotifications,
                    'pending_approvals' => $pendingApprovals,
                ]
            ],
            'message' => 'Application bootstrap configuration loaded'
        ]);
    }
}
