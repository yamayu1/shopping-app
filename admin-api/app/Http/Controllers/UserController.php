<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:admin');
        $this->middleware('check.permission:manage_users');
    }

    // ユーザー一覧取得
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::query();

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->has('role')) {
                $query->where('role', $request->role);
            }

            $users = $query->whereNull('deleted_at')
                          ->orderBy('created_at', 'desc')
                          ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'message' => 'Users retrieved',
                'data' => [
                    'data' => $users->items(),
                    'pagination' => [
                        'current_page' => $users->currentPage(),
                        'total_pages' => $users->lastPage(),
                        'per_page' => $users->perPage(),
                        'total' => $users->total(),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'errors' => $e->getMessage()
            ], 500);
        }
    }

    // ユーザー詳細取得
    public function show(int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            return response()->json([
                'success' => true,
                'message' => 'User retrieved',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
    }

    // ユーザーステータス更新
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->update(['is_active' => $request->boolean('is_active')]);

            return response()->json([
                'success' => true,
                'message' => 'User status updated',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user status'
            ], 500);
        }
    }

    // ユーザー統計
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_users' => User::whereNull('deleted_at')->count(),
                'verified_users' => User::whereNull('deleted_at')->count(),
                'unverified_users' => 0,
                'new_users_this_month' => User::whereNull('deleted_at')
                    ->whereMonth('created_at', now()->month)
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'User statistics retrieved',
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics'
            ], 500);
        }
    }

    // ユーザーの注文履歴
    public function getUserOrders(int $id): JsonResponse
    {
        try {
            $orders = Order::where('user_id', $id)
                          ->orderBy('created_at', 'desc')
                          ->get();

            return response()->json([
                'success' => true,
                'message' => 'User orders retrieved',
                'data' => $orders
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user orders'
            ], 500);
        }
    }

    // ユーザー削除（論理削除）
    public function destroy(int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->update(['deleted_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'User deleted'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user'
            ], 500);
        }
    }
}
