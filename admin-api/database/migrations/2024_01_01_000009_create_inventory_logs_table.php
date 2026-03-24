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
        if (Schema::hasTable('inventory_logs')) return;

        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('admin_id')->nullable()->constrained('admins')->onDelete('set null');
            $table->integer('quantity_change');
            $table->integer('quantity_after');
            $table->string('reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'created_at']);
            $table->index('admin_id');
            $table->index('reason');
            $table->index('created_at');
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
