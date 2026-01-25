<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Pagination\Paginator;

class AppServiceProvider extends ServiceProvider
{
    /**
     * アプリケーションサービスの登録
     */
    public function register(): void
    {
        //
    }

    /**
     * アプリケーションサービスの初期化
     */
    public function boot(): void
    {
        // MySQL互換性のためデフォルト文字列長を設定
        Schema::defaultStringLength(191);

        // ページネーション表示にBootstrap 4を使用（必要な場合）
        Paginator::useBootstrapFour();

        // 本番環境でHTTPSを強制
        if (config('app.env') === 'production') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}