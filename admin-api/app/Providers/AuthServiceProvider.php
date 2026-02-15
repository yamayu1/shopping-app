<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * アプリケーションのモデルとポリシーのマッピング
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * 認証・認可サービスを登録する
     */
    public function boot(): void
    {
        //
    }
}