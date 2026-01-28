<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 既存テーブルに不足カラムを追加するマイグレーション
 * init SQLで最小構成のテーブルが作成された場合に対応
 */
return new class extends Migration
{
    public function up(): void
    {
        // admins テーブルの不足カラムを追加
        if (Schema::hasTable('admins')) {
            Schema::table('admins', function (Blueprint $table) {
                if (!Schema::hasColumn('admins', 'deleted_at')) {
                    $table->softDeletes();
                }
                if (!Schema::hasColumn('admins', 'remember_token')) {
                    $table->rememberToken();
                }
                if (!Schema::hasColumn('admins', 'email_verified_at')) {
                    $table->timestamp('email_verified_at')->nullable()->after('email');
                }
            });
        }

        // categories テーブルの不足カラムを追加
        if (Schema::hasTable('categories')) {
            Schema::table('categories', function (Blueprint $table) {
                if (!Schema::hasColumn('categories', 'image')) {
                    $table->string('image')->nullable()->after('active');
                }
                if (!Schema::hasColumn('categories', 'icon')) {
                    $table->string('icon')->nullable()->after('image');
                }
                if (!Schema::hasColumn('categories', 'sort_order')) {
                    $table->integer('sort_order')->default(0)->after('icon');
                }
                if (!Schema::hasColumn('categories', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('sort_order');
                }
                if (!Schema::hasColumn('categories', 'is_featured')) {
                    $table->boolean('is_featured')->default(false)->after('is_active');
                }
                if (!Schema::hasColumn('categories', 'meta_title')) {
                    $table->string('meta_title')->nullable()->after('is_featured');
                }
                if (!Schema::hasColumn('categories', 'meta_description')) {
                    $table->text('meta_description')->nullable()->after('meta_title');
                }
                if (!Schema::hasColumn('categories', 'custom_attributes')) {
                    $table->json('custom_attributes')->nullable()->after('meta_description');
                }
                if (!Schema::hasColumn('categories', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        // products テーブルの不足カラムを追加
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'short_description')) {
                    $table->text('short_description')->nullable()->after('description');
                }
                if (!Schema::hasColumn('products', 'sale_price')) {
                    $table->decimal('sale_price', 10, 2)->nullable()->after('price');
                }
                if (!Schema::hasColumn('products', 'cost_price')) {
                    $table->decimal('cost_price', 10, 2)->nullable()->after('sale_price');
                }
                if (!Schema::hasColumn('products', 'low_stock_threshold')) {
                    $table->integer('low_stock_threshold')->default(10)->after('stock_quantity');
                }
                if (!Schema::hasColumn('products', 'brand')) {
                    $table->string('brand')->nullable()->after('category_id');
                }
                if (!Schema::hasColumn('products', 'color')) {
                    $table->string('color')->nullable()->after('brand');
                }
                if (!Schema::hasColumn('products', 'size')) {
                    $table->string('size')->nullable()->after('color');
                }
                if (!Schema::hasColumn('products', 'material')) {
                    $table->string('material')->nullable()->after('size');
                }
                if (!Schema::hasColumn('products', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('material');
                }
                if (!Schema::hasColumn('products', 'is_featured')) {
                    $table->boolean('is_featured')->default(false)->after('is_active');
                }
                if (!Schema::hasColumn('products', 'meta_title')) {
                    $table->string('meta_title')->nullable()->after('is_featured');
                }
                if (!Schema::hasColumn('products', 'meta_description')) {
                    $table->text('meta_description')->nullable()->after('meta_title');
                }
                if (!Schema::hasColumn('products', 'tags')) {
                    $table->json('tags')->nullable()->after('meta_description');
                }
                if (!Schema::hasColumn('products', 'images')) {
                    $table->json('images')->nullable()->after('tags');
                }
                if (!Schema::hasColumn('products', 'custom_attributes')) {
                    $table->json('custom_attributes')->nullable()->after('images');
                }
                if (!Schema::hasColumn('products', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        // users テーブルの不足カラムを追加
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'name')) {
                    $table->string('name')->nullable()->after('id');
                }
                if (!Schema::hasColumn('users', 'email_verified_at')) {
                    $table->timestamp('email_verified_at')->nullable()->after('email');
                }
                if (!Schema::hasColumn('users', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        // orders テーブルの不足カラムを追加
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }
    }

    public function down(): void
    {
        // ロールバック不要（カラム追加のみ）
    }
};
