<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * CSRF検証から除外するURI
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',
    ];
}