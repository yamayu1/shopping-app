<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 注文アイテムテーブル（Railsマイグレーションで作成済みの場合はスキップ）
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('order_items')) return;

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products');
            $table->integer('quantity');
            $table->decimal('price', 10, 2);
            $table->decimal('total', 10, 2)->nullable();
            $table->json('product_snapshot')->nullable();
            $table->timestamps();

            $table->index(['order_id']);
            $table->index(['product_id']);
            $table->index(['order_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
