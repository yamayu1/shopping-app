<?php

return [

    /*
    |--------------------------------------------------------------------------
    | クロスオリジンリソース共有（CORS）設定
    |--------------------------------------------------------------------------
    |
    | CORSの設定を行います。Webブラウザで実行できる
    | クロスオリジン操作を制御します。
    | 必要に応じて自由に設定を調整してください。
    |
    | 詳細: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', '*')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];