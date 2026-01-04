# カテゴリを作成
categories = [
  { name: '家電・電子機器', slug: 'electronics', description: '電子機器やアクセサリー' },
  { name: 'ファッション', slug: 'fashion', description: '衣料品・アパレル' },
  { name: '書籍', slug: 'books', description: '本・文学作品' },
  { name: 'ホーム・ガーデン', slug: 'home-garden', description: '生活用品・園芸用品' },
  { name: 'スポーツ', slug: 'sports', description: 'スポーツ用品・器具' }
]

categories.each do |cat_data|
  Category.find_or_create_by(name: cat_data[:name]) do |category|
    category.slug = cat_data[:slug]
    category.description = cat_data[:description]
    category.active = true
  end
end

puts "Created #{Category.count} categories"

# 商品を作成
electronics = Category.find_by(name: '家電・電子機器')
clothing = Category.find_by(name: 'ファッション')
books = Category.find_by(name: '書籍')
home = Category.find_by(name: 'ホーム・ガーデン')
sports = Category.find_by(name: 'スポーツ')

products = [
  # 家電
  { name: 'iPhone 15 Pro', description: '最新の先進機能を搭載したiPhone', sku: 'IP15P-001', price: 149800, stock_quantity: 50, category: electronics },
  { name: 'MacBook Air M2', description: 'プロフェッショナル向けの高性能ノートPC', sku: 'MBA-M2-001', price: 164800, stock_quantity: 30, category: electronics },
  { name: 'AirPods Pro', description: 'ノイズキャンセリング搭載ワイヤレスイヤホン', sku: 'APP-001', price: 39800, stock_quantity: 100, category: electronics },
  { name: 'iPad Air', description: '仕事にも遊びにも使える万能タブレット', sku: 'IPA-001', price: 92800, stock_quantity: 75, category: electronics },

  # 衣類
  { name: 'コットンTシャツ', description: '豊富なカラーバリエーションの快適なコットンTシャツ', sku: 'CT-001', price: 2980, stock_quantity: 200, category: clothing },
  { name: 'デニムジーンズ', description: 'フィット感抜群のクラシックデニムジーンズ', sku: 'DJ-001', price: 8980, stock_quantity: 150, category: clothing },
  { name: 'ウールセーター', description: '冬にぴったりの暖かいウールセーター', sku: 'WS-001', price: 12800, stock_quantity: 80, category: clothing },
  { name: 'ランニングシューズ', description: 'アスリート向けの軽量ランニングシューズ', sku: 'RS-001', price: 15800, stock_quantity: 120, category: clothing },

  # 書籍
  { name: 'プログラミングの技法', description: 'ソフトウェア開発の総合ガイド', sku: 'TAP-001', price: 4800, stock_quantity: 60, category: books },
  { name: '日本の歴史', description: '日本の歴史を網羅した一冊', sku: 'JH-001', price: 3200, stock_quantity: 40, category: books },
  { name: '料理マスタークラス', description: 'プロの調理テクニックを学ぶ', sku: 'CM-001', price: 5500, stock_quantity: 35, category: books },

  # ホーム＆ガーデン
  { name: 'コーヒーメーカー', description: 'タイマー付き全自動コーヒーメーカー', sku: 'CFM-001', price: 18800, stock_quantity: 25, category: home },
  { name: 'ガーデニングツールセット', description: 'ガーデニングに必要な道具一式', sku: 'GTS-001', price: 12000, stock_quantity: 40, category: home },
  { name: 'LEDデスクライト', description: 'デスクワークに最適な角度調整可能LEDライト', sku: 'LDL-001', price: 8500, stock_quantity: 60, category: home },

  # スポーツ
  { name: 'テニスラケット', description: 'プロ仕様のテニスラケット', sku: 'TR-001', price: 25000, stock_quantity: 30, category: sports },
  { name: 'ヨガマット', description: 'グリップ力抜群の高品質ヨガマット', sku: 'YM-001', price: 6800, stock_quantity: 80, category: sports },
  { name: 'バスケットボール', description: '公式サイズのバスケットボール', sku: 'BB-001', price: 3500, stock_quantity: 50, category: sports }
]

products.each do |product_data|
  Product.find_or_create_by(sku: product_data[:sku]) do |product|
    product.name = product_data[:name]
    product.description = product_data[:description]
    product.price = product_data[:price]
    product.stock_quantity = product_data[:stock_quantity]
    product.category = product_data[:category]
    product.status = :active
  end
end

puts "Created #{Product.count} products"

# サンプルユーザーを作成
sample_user = User.find_or_create_by(email: 'user@example.com') do |user|
  user.password = 'password123'
  user.first_name = 'Taro'
  user.last_name = 'Yamada'
  user.phone = '090-1234-5678'
  user.birth_date = '1990-01-01'
end

# ユーザーのサンプル住所を作成
Address.find_or_create_by(user: sample_user, is_default: true) do |address|
  address.first_name = 'Taro'
  address.last_name = 'Yamada'
  address.postal_code = '100-0001'
  address.prefecture = '東京都'
  address.city = '千代田区'
  address.address_line1 = '千代田1-1-1'
  address.phone = '090-1234-5678'
end

puts "Created sample user and address"
puts "Sample user credentials: user@example.com / password123"