<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $admin = auth('admin')->user();

        // ログインしていない、またはスーパー管理者でなければ追い返す
        if (!$admin || !$admin->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Super admin access required.'
            ], 403);
        }

        return $next($request);
    }
}