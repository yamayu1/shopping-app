<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * バリデーション例外時にセッションにフラッシュしない入力項目
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * アプリケーションの例外処理コールバックを登録する
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }
}