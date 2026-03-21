<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedCategories();
        $this->seedProducts();
        $this->seedUsers();
        $this->command->info('Sample data seeded successfully');
    }

    private function seedCategories(): void
    {
        $categories = [
            ['name' => '家電・電子機器', 'slug' => 'electronics', 'description' => '電子機器やアクセサリー'],
            ['name' => 'ファッション', 'slug' => 'fashion', 'description' => '衣料品・アパレル'],
            ['name' => '書籍', 'slug' => 'books', 'description' => '本・文学作品'],
            ['name' => 'ホーム・ガーデン', 'slug' => 'home-garden', 'description' => '生活用品・園芸用品'],
            ['name' => 'スポーツ', 'slug' => 'sports', 'description' => 'スポーツ用品・器具'],
        ];

        foreach ($categories as $cat) {
            DB::table('categories')->updateOrInsert(
                ['slug' => $cat['slug']],
                array_merge($cat, [
                    'is_active' => 1,
                    'active' => 1,
                    'sort_order' => 0,
                    'is_featured' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        $this->command->info('Categories seeded: ' . DB::table('categories')->count());
    }

    private function seedProducts(): void
    {
        $electronics = DB::table('categories')->where('slug', 'electronics')->value('id');
        $fashion = DB::table('categories')->where('slug', 'fashion')->value('id');
        $books = DB::table('categories')->where('slug', 'books')->value('id');
        $home = DB::table('categories')->where('slug', 'home-garden')->value('id');
        $sports = DB::table('categories')->where('slug', 'sports')->value('id');

        $products = [
            ['name' => 'iPhone 15 Pro', 'description' => '最新の先進機能を搭載したiPhone', 'sku' => 'IP15P-001', 'price' => 149800, 'stock_quantity' => 50, 'category_id' => $electronics],
            ['name' => 'MacBook Air M2', 'description' => 'プロフェッショナル向けの高性能ノートPC', 'sku' => 'MBA-M2-001', 'price' => 164800, 'stock_quantity' => 30, 'category_id' => $electronics],
            ['name' => 'AirPods Pro', 'description' => 'ノイズキャンセリング搭載ワイヤレスイヤホン', 'sku' => 'APP-001', 'price' => 39800, 'stock_quantity' => 100, 'category_id' => $electronics],
            ['name' => 'iPad Air', 'description' => '仕事にも遊びにも使える万能タブレット', 'sku' => 'IPA-001', 'price' => 92800, 'stock_quantity' => 75, 'category_id' => $electronics],
            ['name' => 'コットンTシャツ', 'description' => '豊富なカラーバリエーションの快適なコットンTシャツ', 'sku' => 'CT-001', 'price' => 2980, 'stock_quantity' => 200, 'category_id' => $fashion],
            ['name' => 'デニムジーンズ', 'description' => 'フィット感抜群のクラシックデニムジーンズ', 'sku' => 'DJ-001', 'price' => 8980, 'stock_quantity' => 150, 'category_id' => $fashion],
            ['name' => 'ウールセーター', 'description' => '冬にぴったりの暖かいウールセーター', 'sku' => 'WS-001', 'price' => 12800, 'stock_quantity' => 80, 'category_id' => $fashion],
            ['name' => 'ランニングシューズ', 'description' => 'アスリート向けの軽量ランニングシューズ', 'sku' => 'RS-001', 'price' => 15800, 'stock_quantity' => 120, 'category_id' => $fashion],
            ['name' => 'プログラミングの技法', 'description' => 'ソフトウェア開発の総合ガイド', 'sku' => 'TAP-001', 'price' => 4800, 'stock_quantity' => 60, 'category_id' => $books],
            ['name' => '日本の歴史', 'description' => '日本の歴史を網羅した一冊', 'sku' => 'JH-001', 'price' => 3200, 'stock_quantity' => 40, 'category_id' => $books],
            ['name' => '料理マスタークラス', 'description' => 'プロの調理テクニックを学ぶ', 'sku' => 'CM-001', 'price' => 5500, 'stock_quantity' => 35, 'category_id' => $books],
            ['name' => 'コーヒーメーカー', 'description' => 'タイマー付き全自動コーヒーメーカー', 'sku' => 'CFM-001', 'price' => 18800, 'stock_quantity' => 25, 'category_id' => $home],
            ['name' => 'ガーデニングツールセット', 'description' => 'ガーデニングに必要な道具一式', 'sku' => 'GTS-001', 'price' => 12000, 'stock_quantity' => 40, 'category_id' => $home],
            ['name' => 'LEDデスクライト', 'description' => 'デスクワークに最適な角度調整可能LEDライト', 'sku' => 'LDL-001', 'price' => 8500, 'stock_quantity' => 60, 'category_id' => $home],
            ['name' => 'テニスラケット', 'description' => 'プロ仕様のテニスラケット', 'sku' => 'TR-001', 'price' => 25000, 'stock_quantity' => 30, 'category_id' => $sports],
            ['name' => 'ヨガマット', 'description' => 'グリップ力抜群の高品質ヨガマット', 'sku' => 'YM-001', 'price' => 6800, 'stock_quantity' => 80, 'category_id' => $sports],
            ['name' => 'バスケットボール', 'description' => '公式サイズのバスケットボール', 'sku' => 'BB-001', 'price' => 3500, 'stock_quantity' => 50, 'category_id' => $sports],
        ];

        foreach ($products as $product) {
            DB::table('products')->updateOrInsert(
                ['sku' => $product['sku']],
                array_merge($product, [
                    'status' => 0,
                    'is_active' => 1,
                    'is_featured' => 0,
                    'low_stock_threshold' => 10,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        $this->command->info('Products seeded: ' . DB::table('products')->count());
    }

    private function seedUsers(): void
    {
        DB::table('users')->updateOrInsert(
            ['email' => 'user@example.com'],
            [
                'first_name' => 'Taro',
                'last_name' => 'Yamada',
                'name' => 'Taro Yamada',
                'phone' => '090-1234-5678',
                'birth_date' => '1990-01-01',
                'password_digest' => Hash::make('password123'),
                'password' => Hash::make('password123'),
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $this->command->info('Users seeded: ' . DB::table('users')->count());
    }
}
