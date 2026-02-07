<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ExportInventory extends Command
{
    /**
     * コンソールコマンドの名前とシグネチャ
     *
     * @var string
     */
    protected $signature = 'inventory:export 
                           {--format=csv : Export format (csv, json)}
                           {--category= : Filter by category ID}
                           {--status= : Filter by stock status (in_stock, low_stock, out_of_stock)}
                           {--path= : Custom export path}
                           {--email= : Email address to send the export to}';

    /**
     * コンソールコマンドの説明
     *
     * @var string
     */
    protected $description = '在庫データをCSVまたはJSONにエクスポート（定期レポート用）';

    /**
     * コンソールコマンドを実行する
     */
    public function handle()
    {
        $this->info('在庫エクスポートを開始します...');

        try {
            $format = $this->option('format');
            $categoryId = $this->option('category');
            $status = $this->option('status');
            $customPath = $this->option('path');
            $email = $this->option('email');

            // クエリを構築
            $query = Product::with('category:id,name');

            // フィルターを適用
            if ($categoryId) {
                $query->byCategory($categoryId);
                $this->info("カテゴリID: {$categoryId} でフィルタリング中");
            }

            if ($status) {
                switch ($status) {
                    case 'in_stock':
                        $query->inStock();
                        break;
                    case 'low_stock':
                        $query->lowStock();
                        break;
                    case 'out_of_stock':
                        $query->where('stock_quantity', '<=', 0);
                        break;
                }
                $this->info("在庫ステータス: {$status} でフィルタリング中");
            }

            $products = $query->orderBy('name')->get();
            $totalProducts = $products->count();

            $this->info("エクスポート対象商品数: {$totalProducts}件");

            if ($totalProducts === 0) {
                $this->warn('条件に一致する商品が見つかりませんでした');
                return Command::SUCCESS;
            }

            // ファイル名を生成
            $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
            $filename = "inventory_export_{$timestamp}.{$format}";
            
            if ($customPath) {
                $filepath = $customPath . '/' . $filename;
            } else {
                $filepath = 'exports/' . $filename;
            }

            // データをエクスポート
            if ($format === 'json') {
                $this->exportJson($products, $filepath);
            } else {
                $this->exportCsv($products, $filepath);
            }

            $this->info("エクスポート完了: {$filepath}");

            // リクエストがあればエクスポートをメール送信
            if ($email) {
                $this->emailExport($email, $filepath, $totalProducts);
            }

            // サマリーを表示
            $this->displaySummary($products);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("エクスポート失敗: " . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * CSV形式でデータをエクスポートする
     *
     * @param \Illuminate\Database\Eloquent\Collection $products
     * @param string $filepath
     * @return void
     */
    private function exportCsv($products, string $filepath): void
    {
        $csvData = [];

        // CSVヘッダー
        $csvData[] = [
            'SKU',
            '商品名',
            'カテゴリ',
            '現在庫数',
            '在庫少閾値',
            '在庫ステータス',
            '価格',
            'セール価格',
            '原価',
            '在庫金額（原価）',
            '在庫金額（販売価格）',
            'ブランド',
            '色',
            'サイズ',
            '素材',
            '有効',
            'おすすめ',
            '最終更新日'
        ];

        foreach ($products as $product) {
            $totalCostValue = $product->cost_price ? $product->stock_quantity * $product->cost_price : 0;
            $totalRetailValue = $product->stock_quantity * $product->effective_price;

            $csvData[] = [
                $product->sku,
                $product->name,
                $product->category->name ?? 'なし',
                $product->stock_quantity,
                $product->low_stock_threshold,
                $product->stock_status,
                number_format($product->price, 2),
                $product->sale_price ? number_format($product->sale_price, 2) : 'なし',
                $product->cost_price ? number_format($product->cost_price, 2) : 'なし',
                number_format($totalCostValue, 2),
                number_format($totalRetailValue, 2),
                $product->brand ?? 'なし',
                $product->color ?? 'なし',
                $product->size ?? 'なし',
                $product->material ?? 'なし',
                $product->is_active ? 'はい' : 'いいえ',
                $product->is_featured ? 'はい' : 'いいえ',
                $product->updated_at->toDateTimeString(),
            ];
        }

        // CSV文字列に変換
        $csvContent = '';
        foreach ($csvData as $row) {
            $csvContent .= '"' . implode('","', $row) . '"' . "\n";
        }

        Storage::put($filepath, $csvContent);
    }

    /**
     * JSON形式でデータをエクスポートする
     *
     * @param \Illuminate\Database\Eloquent\Collection $products
     * @param string $filepath
     * @return void
     */
    private function exportJson($products, string $filepath): void
    {
        $jsonData = [
            'export_info' => [
                'exported_at' => Carbon::now()->toISOString(),
                'total_products' => $products->count(),
                'format' => 'json',
            ],
            'products' => []
        ];

        foreach ($products as $product) {
            $totalCostValue = $product->cost_price ? $product->stock_quantity * $product->cost_price : 0;
            $totalRetailValue = $product->stock_quantity * $product->effective_price;

            $jsonData['products'][] = [
                'id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'category' => [
                    'id' => $product->category->id ?? null,
                    'name' => $product->category->name ?? null,
                ],
                'stock' => [
                    'current_quantity' => $product->stock_quantity,
                    'low_stock_threshold' => $product->low_stock_threshold,
                    'status' => $product->stock_status,
                ],
                'pricing' => [
                    'price' => $product->price,
                    'sale_price' => $product->sale_price,
                    'cost_price' => $product->cost_price,
                    'effective_price' => $product->effective_price,
                ],
                'valuation' => [
                    'total_cost_value' => $totalCostValue,
                    'total_retail_value' => $totalRetailValue,
                ],
                'attributes' => [
                    'brand' => $product->brand,
                    'color' => $product->color,
                    'size' => $product->size,
                    'material' => $product->material,
                ],
                'status' => [
                    'is_active' => $product->is_active,
                    'is_featured' => $product->is_featured,
                ],
                'updated_at' => $product->updated_at->toISOString(),
            ];
        }

        Storage::put($filepath, json_encode($jsonData, JSON_PRETTY_PRINT));
    }

    /**
     * エクスポートファイルをメール送信する
     *
     * @param string $email
     * @param string $filepath
     * @param int $totalProducts
     * @return void
     */
    private function emailExport(string $email, string $filepath, int $totalProducts): void
    {
        try {
            // 通常はLaravelのMailファサードを使用
            // 今回はログに記録するのみ
            $this->info("メール通知送信先: {$email}");
            $this->info("エクスポートファイル: {$filepath}");
            $this->info("商品総数: {$totalProducts}");

            // 本番実装では以下のようにする：
            // Mail::to($email)->send(new InventoryExportMail($filepath, $totalProducts));

        } catch (\Exception $e) {
            $this->warn("メール通知の送信に失敗しました: " . $e->getMessage());
        }
    }

    /**
     * エクスポートのサマリーを表示する
     *
     * @param \Illuminate\Database\Eloquent\Collection $products
     * @return void
     */
    private function displaySummary($products): void
    {
        $this->info('');
        $this->info('=== エクスポートサマリー ===');

        $totalProducts = $products->count();
        $inStock = $products->where('stock_quantity', '>', 0)->count();
        $lowStock = $products->filter(function ($product) {
            return $product->stock_quantity <= $product->low_stock_threshold && $product->stock_quantity > 0;
        })->count();
        $outOfStock = $products->where('stock_quantity', '<=', 0)->count();

        $totalStockValue = $products->sum(function ($product) {
            return $product->stock_quantity * $product->effective_price;
        });

        $totalCostValue = $products->sum(function ($product) {
            return $product->cost_price ? $product->stock_quantity * $product->cost_price : 0;
        });

        $this->table([
            '項目', '値'
        ], [
            ['商品総数', $totalProducts],
            ['在庫あり', $inStock],
            ['在庫少', $lowStock],
            ['在庫切れ', $outOfStock],
            ['在庫総額（販売価格）', '¥' . number_format($totalStockValue, 2)],
            ['在庫総額（原価）', '¥' . number_format($totalCostValue, 2)],
            ['見込利益', '¥' . number_format($totalStockValue - $totalCostValue, 2)],
        ]);

        // カテゴリ別内訳
        $categoryBreakdown = $products->groupBy('category.name')->map(function ($categoryProducts) {
            return $categoryProducts->count();
        })->sortDesc()->take(5);

        if ($categoryBreakdown->isNotEmpty()) {
            $this->info('');
            $this->info('カテゴリ別 上位5件:');
            foreach ($categoryBreakdown as $categoryName => $count) {
                $this->line("  • {$categoryName}: {$count}件");
            }
        }
    }
}