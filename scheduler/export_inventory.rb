#!/usr/bin/env ruby

require 'mysql2'
require 'csv'
require 'logger'
require 'time'

# ログの設定
logger = Logger.new('/app/exports/scheduler.log')
logger.info "Starting inventory export at #{Time.now}"

# データベース設定
DB_CONFIG = {
  host: ENV.fetch('DB_HOST', 'mysql'),
  port: ENV.fetch('DB_PORT', 3306).to_i,
  username: ENV.fetch('DB_USERNAME', 'shopping_user'),
  password: ENV.fetch('DB_PASSWORD', 'shopping_password'),
  database: ENV.fetch('DB_DATABASE', 'shopping_development')
}.freeze

begin
  # データベースに接続
  client = Mysql2::Client.new(DB_CONFIG)
  logger.info "Connected to database successfully"

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
  logger.info "Retrieved #{results.count} products from database"

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

      # サマリー用に在庫レベルを集計
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
        "¥#{row['price'].to_f.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}",
        row['stock_quantity'],
        stock_status,
        "¥#{inventory_value.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}",
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
    csv << ['在庫総額', "¥#{total_inventory_value.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"]
    csv << ['レポート生成日時', Time.now.strftime('%Y-%m-%d %H:%M:%S')]
  end

  logger.info "Successfully exported inventory to #{csv_filename}"
  logger.info "Total inventory value: ¥#{total_inventory_value.to_i}"
  logger.info "Products out of stock: #{out_of_stock_count}"
  logger.info "Products with low stock: #{low_stock_count}"

  # 簡単にアクセスできるようlatest.csvのシンボリックリンクも作成
  latest_filename = "/app/exports/inventory_latest.csv"
  File.delete(latest_filename) if File.exist?(latest_filename)
  File.symlink(File.basename(csv_filename), latest_filename)

  # 古いファイルを削除（直近30日分のみ保持）
  cleanup_date = Time.now - (30 * 24 * 60 * 60) # 30 days ago
  Dir.glob('/app/exports/inventory_report_*.csv').each do |file|
    file_time = File.mtime(file)
    if file_time < cleanup_date
      File.delete(file)
      logger.info "Deleted old export file: #{file}"
    end
  end

rescue Mysql2::Error => e
  logger.error "Database error: #{e.message}"
  exit 1
rescue StandardError => e
  logger.error "Unexpected error: #{e.message}"
  logger.error e.backtrace.join("\n")
  exit 1
ensure
  client&.close
  logger.info "Inventory export completed at #{Time.now}"
end