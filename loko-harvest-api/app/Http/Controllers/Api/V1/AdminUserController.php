<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    /**
     * Check if the authenticated user is an admin.
     */
    protected function authorizeAdmin(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Unauthorized. Admin access required.');
        }
    }

    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $query = User::query();

        // Optional filtering by status
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        // Optional filtering by role
        if ($request->has('role') && !empty($request->role)) {
            $query->where('role', $request->role);
        }

        // Order pending first, then newest
        $users = $query->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
            'message' => 'Users retrieved successfully'
        ]);
    }

    /**
     * Approve a signup request (status -> active).
     */
    public function approve(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $user = User::findOrFail($id);
        $user->status = 'active';
        $user->save();

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => "User {$user->name} has been approved successfully."
        ]);
    }

    /**
     * Reject a signup request (status -> rejected).
     */
    public function reject(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $user = User::findOrFail($id);
        $user->status = 'rejected';
        $user->save();

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => "User {$user->name}'s registration has been rejected."
        ]);
    }

    /**
     * Suspend a user (status -> suspended).
     */
    public function suspend(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $user = User::findOrFail($id);
        
        // Prevent admin self-suspension
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot suspend your own admin account.'
            ], 400);
        }

        $user->status = 'suspended';
        $user->save();

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => "User {$user->name} has been suspended."
        ]);
    }

    /**
     * Delete a user from the system.
     */
    public function destroy(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $user = User::findOrFail($id);

        // Prevent admin self-deletion
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own admin account.'
            ], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => "User record deleted successfully."
        ]);
    }
}
