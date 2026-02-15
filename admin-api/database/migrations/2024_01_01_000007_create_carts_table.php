<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * マイグレーションを実行する
     */
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('session_id')->nullable();
            $table->timestamps();

            // パフォーマンス向上のためのインデックス
            $table->index(['user_id']);
            $table->index(['session_id']);
        });
    }

    /**
     * マイグレーションをロールバックする
     */
    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};