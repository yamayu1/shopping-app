<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    /**
     * リクエストを処理する
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // プリフライトリクエストの処理
        if ($request->getMethod() === 'OPTIONS') {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $this->getAllowedOrigin($request))
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        // レスポンスにCORSヘッダーを追加
        $response->headers->set('Access-Control-Allow-Origin', $this->getAllowedOrigin($request));
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }

    /**
     * リクエストに対して許可されたオリジンを取得する
     *
     * @param Request $request
     * @return string
     */
    private function getAllowedOrigin(Request $request): string
    {
        $origin = $request->headers->get('Origin');
        $allowedOrigins = explode(',', env('CORS_ALLOWED_ORIGINS', '*'));

        // ワイルドカードが許可されている場合、リクエスト元のオリジンを返す
        if (in_array('*', $allowedOrigins)) {
            return $origin ?: '*';
        }

        // オリジンが許可リストに含まれているか確認
        if (in_array($origin, $allowedOrigins)) {
            return $origin;
        }

        // デフォルトは許可リストの最初のオリジンまたは空文字列
        return $allowedOrigins[0] ?? '';
    }
}