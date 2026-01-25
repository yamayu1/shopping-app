<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return response()->json([
        'message' => 'Shopping App Admin API',
        'version' => '1.0.0',
        'api_documentation' => '/api',
        'status' => 'healthy'
    ]);
});

// ヘルスチェック用ルート
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'service' => 'Admin API',
        'version' => '1.0.0'
    ]);
});