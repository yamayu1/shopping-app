.PHONY: build up down restart logs clean test setup migrate seed

# 全コンテナをビルド
build:
	docker-compose build

# 全サービスを起動
up:
	docker-compose up -d

# 全サービスを停止
down:
	docker-compose down

# 全サービスを再起動
restart: down up

# 全サービスのログを表示
logs:
	docker-compose logs -f

# 指定サービスのログを表示
logs-rails:
	docker-compose logs -f rails_api

logs-laravel:
	docker-compose logs -f laravel_admin

logs-frontend:
	docker-compose logs -f frontend

# コンテナとボリュームをクリーンアップ
clean:
	docker-compose down -v
	docker system prune -f

# プロジェクトのセットアップ（初回セットアップ）
setup: build
	docker-compose up -d mysql redis
	sleep 10
	docker-compose run --rm rails_api bundle install
	docker-compose run --rm rails_api rails db:create db:migrate
	docker-compose run --rm laravel_admin composer install
	docker-compose run --rm laravel_admin php artisan migrate
	docker-compose run --rm frontend npm install
	$(MAKE) seed

# データベースマイグレーションを実行
migrate:
	docker-compose run --rm rails_api rails db:migrate
	docker-compose run --rm laravel_admin php artisan migrate

# サンプルデータでデータベースをシード
seed:
	docker-compose run --rm rails_api rails db:seed
	docker-compose run --rm laravel_admin php artisan db:seed

# テストを実行
test:
	docker-compose run --rm rails_api rails test
	docker-compose run --rm laravel_admin php artisan test
	docker-compose run --rm frontend npm test -- --coverage --watchAll=false

# 特定のテストスイートを実行
test-rails:
	docker-compose run --rm rails_api rails test

test-laravel:
	docker-compose run --rm laravel_admin php artisan test

test-frontend:
	docker-compose run --rm frontend npm test -- --coverage --watchAll=false

# 開発用コマンド
dev: up
	@echo "Development environment is running!"
	@echo "Frontend: http://localhost:3000"
	@echo "Rails API: http://localhost:3001"
	@echo "Laravel Admin: http://localhost:8000"

# 依存パッケージをインストール
install-deps:
	docker-compose run --rm rails_api bundle install
	docker-compose run --rm laravel_admin composer install
	docker-compose run --rm frontend npm install

# APIドキュメントを生成
docs:
	docker-compose run --rm rails_api rails routes
	docker-compose run --rm laravel_admin php artisan route:list