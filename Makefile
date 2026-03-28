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
	@echo "MySQLの起動を待機中..."
	@sleep 15
	docker-compose run --rm rails_api bundle exec rails db:create 2>/dev/null || true
	docker-compose run --rm rails_api bundle exec rails db:migrate
	docker-compose run --rm rails_api bundle exec rails db:seed
	docker-compose run --rm laravel_admin sh -c "cp -n .env.example .env 2>/dev/null || true && composer install --no-scripts && php artisan package:discover --ansi && php artisan key:generate --force"
	docker-compose run --rm laravel_admin php artisan migrate --force
	docker-compose run --rm laravel_admin php artisan db:seed --force
	@echo "セットアップ完了！ 'make up' で起動してください"

# データベースマイグレーションを実行（Rails → Laravel の順序）
migrate:
	docker-compose run --rm rails_api bundle exec rails db:migrate
	docker-compose run --rm laravel_admin php artisan migrate --force

# サンプルデータでデータベースをシード
seed:
	docker-compose run --rm rails_api bundle exec rails db:seed
	docker-compose run --rm laravel_admin php artisan db:seed --force

# テストを実行
test:
	docker-compose run --rm -e RAILS_ENV=test rails_api bundle exec rails db:create 2>/dev/null || true
	docker-compose run --rm -e RAILS_ENV=test rails_api bundle exec rails db:migrate 2>/dev/null || true
	docker-compose run --rm rails_api bundle exec rails test
	docker-compose run --rm laravel_admin php artisan migrate --force 2>/dev/null || true
	docker-compose run --rm laravel_admin php artisan test
	docker-compose run --rm frontend sh -c "NODE_OPTIONS='--max-old-space-size=2048' npm test -- --coverage --watchAll=false"

# 特定のテストスイートを実行
test-rails:
	docker-compose run --rm -e RAILS_ENV=test rails_api bundle exec rails db:create 2>/dev/null || true
	docker-compose run --rm -e RAILS_ENV=test rails_api bundle exec rails db:migrate 2>/dev/null || true
	docker-compose run --rm rails_api bundle exec rails test

test-laravel:
	docker-compose run --rm laravel_admin php artisan migrate --database=mysql --force 2>/dev/null || true
	docker-compose run --rm laravel_admin php artisan test

test-frontend:
	docker-compose run --rm frontend sh -c "NODE_OPTIONS='--max-old-space-size=2048' npm test -- --coverage --watchAll=false"

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
	docker-compose run --rm rails_api bundle exec rails routes
	docker-compose run --rm laravel_admin php artisan route:list

# データベースをリセット（全データ削除して再作成）
db-reset:
	docker-compose run --rm rails_api bundle exec rails db:drop db:create db:migrate db:seed
	docker-compose run --rm laravel_admin php artisan migrate:fresh --seed --force
