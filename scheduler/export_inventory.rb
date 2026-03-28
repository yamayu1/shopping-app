#!/usr/bin/env ruby

require 'mysql2'
require 'csv'
require 'time'

puts "在庫エクスポート開始: #{Time.now}"

# データベース設定
DB_CONFIG = {
  host: ENV.fetch('DB_HOST', 'mysql'),
  port: ENV.fetch('DB_PORT', 3306).to_i,
  username: ENV.fetch('DB_USERNAME', 'shopping_user'),
  password: ENV.fetch('DB_PASSWORD', 'shopping_password'),
  database: ENV.fetch('DB_DATABASE', 'shopping_development')
}

begin
  # データベースに接続
  client = Mysql2::Client.new(DB_CONFIG)
  puts "データベース接続OK"

  # カテゴリ情報付きの在庫データ取得クエリ
  query = <<~SQL
    SELECT
      p.id,
      p.name as product_name,
      p.sku,
      p.price,
      p.stock_quantity,
      p.status,
      c.name as category_name,
      p.created_at,
      p.updated_at,
      CASE
        WHEN p.stock_quantity = 0 THEN '在庫切れ'
        WHEN p.stock_quantity < 10 THEN '在庫少'
        WHEN p.stock_quantity < 50 THEN '在庫中'
        ELSE '在庫十分'
      END as stock_status,
      (p.price * p.stock_quantity) as inventory_value
    FROM products p
    INNER JOIN categories c ON p.category_id = c.id
    WHERE p.status = 0
    ORDER BY c.name, p.name
  SQL

  results = client.query(query)
  puts "#{results.count}件の商品を取得"

  # タイムスタンプ付きCSVファイル名を生成
  timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
  csv_filename = "/app/exports/inventory_report_#{timestamp}.csv"

  # CSVファイルに書き込み
  CSV.open(csv_filename, 'w') do |csv|
    # ヘッダー
    csv << [
      '商品ID',
      '商品名',
      'SKU',
      'カテゴリ',
      '価格（¥）',
      '在庫数',
      '在庫ステータス',
      '在庫金額（¥）',
      'ステータス',
      '作成日時',
      '最終更新日時'
    ]

    # データ行
    total_inventory_value = 0
    low_stock_count = 0
    out_of_stock_count = 0

    results.each do |row|
      stock_status = row['stock_status']
      inventory_value = row['inventory_value'].to_f
      total_inventory_value += inventory_value

      case stock_status
      when '在庫少'
        low_stock_count += 1
      when '在庫切れ'
        out_of_stock_count += 1
      end

      status_text = case row['status']
                   when 0 then '販売中'
                   when 1 then '非公開'
                   when 2 then '販売終了'
                   else '不明'
                   end

      csv << [
        row['id'],
        row['product_name'],
        row['sku'],
        row['category_name'],
        row['price'].to_f.to_i,
        row['stock_quantity'],
        stock_status,
        inventory_value.to_i,
        status_text,
        row['created_at'],
        row['updated_at']
      ]
    end

    # サマリー行を追加
    csv << []
    csv << ['在庫サマリー']
    csv << ['商品総数', results.count]
    csv << ['在庫切れ商品数', out_of_stock_count]
    csv << ['在庫少商品数', low_stock_count]
    csv << ['在庫総額', total_inventory_value.to_i]
    csv << ['レポート生成日時', Time.now.strftime('%Y-%m-%d %H:%M:%S')]
  end

  puts "CSVファイルを出力しました: #{csv_filename}"
  puts "在庫切れ: #{out_of_stock_count}件 / 在庫少: #{low_stock_count}件"

rescue Mysql2::Error => e
  puts "データベースエラー: #{e.message}"
  exit 1
rescue => e
  puts "エラーが発生しました: #{e.message}"
  exit 1
ensure
  client&.close
  puts "在庫エクスポート完了: #{Time.now}"
end
