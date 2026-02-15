<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * アプリケーションのイベントとリスナーのマッピング
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
    ];

    /**
     * アプリケーションのイベントを登録する
     */
    public function boot(): void
    {
        //
    }

    /**
     * イベントとリスナーを自動検出するかどうかを決定する
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}