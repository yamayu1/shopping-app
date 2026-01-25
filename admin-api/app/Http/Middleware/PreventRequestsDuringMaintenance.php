<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance as Middleware;

class PreventRequestsDuringMaintenance extends Middleware
{
    /**
     * メンテナンスモード中もアクセス可能なURI
     *
     * @var array<int, string>
     */
    protected $except = [
        //
    ];
}