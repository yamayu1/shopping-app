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
        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('admin_id')->nullable();
            $table->foreign('admin_id')->references('id')->on('admins');
            $table->integer('quantity_change'); // 正の値（入荷）または負の値（出荷）
            $table->integer('quantity_after');
            $table->string('reason');
            $table->text('notes')->nullable();
            $table->timestamps();

            // パフォーマンス向上のためのインデックス
            $table->index(['product_id', 'created_at']);
            $table->index(['admin_id']);
            $table->index(['reason']);
            $table->index(['created_at']);
        });
    }

    /**
     * マイグレーションをロールバックする
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
    }
};