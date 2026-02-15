<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    /**
     * リクエストを処理する
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string  $permission
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, string $permission)
    {
        $admin = auth('admin')->user();

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // 管理者の権限に基づいてアクセス権をチェック
        $hasPermission = match ($permission) {
            'manage_products' => $admin->canManageProducts(),
            'manage_orders' => $admin->canManageOrders(),
            'manage_users' => $admin->canManageUsers(),
            default => false,
        };

        if (!$hasPermission) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient permissions'
            ], 403);
        }

        return $next($request);
    }
}