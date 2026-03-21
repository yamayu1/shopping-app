#!/bin/bash

# ショッピングアプリ - 統合テストランナー
# このスクリプトはアプリケーション全体のテストを実行する

set -e

# 出力用カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 色リセット

# ヘルパー関数
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 引数を解析
TEST_TYPE=${1:-all}  # all, small, medium, big, coverage
TARGET=${2:-all}     # all, user-api, admin-api, frontend, e2e

# Sinatra（user-api）テスト実行関数
run_user_api_tests() {
    print_header "Running User API (Sinatra) Tests"

    cd user-api

    # 依存パッケージをインストール if needed
    if [ ! -d "vendor/bundle" ]; then
        print_warning "Installing dependencies..."
        bundle install
    fi

    case $TEST_TYPE in
        small)
            print_warning "Running Small (Unit) tests..."
            bundle exec rake test:small
            ;;
        medium)
            print_warning "Running Medium (Integration) tests..."
            bundle exec rake test:medium
            ;;
        big)
            print_warning "Running Big (System) tests..."
            bundle exec rake test:big
            ;;
        coverage|all)
            print_warning "Running all tests with coverage..."
            COVERAGE=true bundle exec rake test:all
            print_success "Coverage report: user-api/coverage/index.html"
            ;;
    esac

    cd ..
    print_success "User API tests completed"
}

# Laravel（admin-api）テスト実行関数
run_admin_api_tests() {
    print_header "Running Admin API (Laravel) Tests"

    cd admin-api

    # 依存パッケージをインストール if needed
    if [ ! -d "vendor" ]; then
        print_warning "Installing dependencies..."
        composer install
    fi

    case $TEST_TYPE in
        small)
            print_warning "Running Small (Unit) tests..."
            composer test:small
            ;;
        medium)
            print_warning "Running Medium (Feature) tests..."
            composer test:medium
            ;;
        big)
            print_warning "Running Big (System) tests..."
            composer test:big
            ;;
        coverage|all)
            print_warning "Running all tests with coverage..."
            composer test:coverage
            print_success "Coverage report: admin-api/coverage/index.html"
            ;;
    esac

    cd ..
    print_success "Admin API tests completed"
}

# React（frontend）テスト実行関数
run_frontend_tests() {
    print_header "Running Frontend (React) Tests"

    cd frontend

    # 依存パッケージをインストール if needed
    if [ ! -d "node_modules" ]; then
        print_warning "Installing dependencies..."
        npm install
    fi

    case $TEST_TYPE in
        coverage|all)
            print_warning "Running tests with coverage..."
            npm run test:coverage
            print_success "Coverage report: frontend/coverage/lcov-report/index.html"
            ;;
        *)
            print_warning "Running tests..."
            npm run test:ci
            ;;
    esac

    cd ..
    print_success "Frontend tests completed"
}

# E2Eテスト実行関数
run_e2e_tests() {
    print_header "Running E2E (Playwright) Tests"

    cd e2e

    # 依存パッケージをインストール if needed
    if [ ! -d "node_modules" ]; then
        print_warning "Installing dependencies..."
        npm install
        npx playwright install
    fi

    print_warning "Running E2E tests..."
    npm test

    print_success "Test report: e2e/playwright-report/index.html"

    cd ..
    print_success "E2E tests completed"
}

# メイン処理
print_header "Shopping App Test Suite"
echo "Test Type: $TEST_TYPE"
echo "Target: $TARGET"

case $TARGET in
    user-api)
        run_user_api_tests
        ;;
    admin-api)
        run_admin_api_tests
        ;;
    frontend)
        run_frontend_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    all)
        run_user_api_tests
        run_admin_api_tests
        run_frontend_tests

        if [ "$TEST_TYPE" == "all" ] || [ "$TEST_TYPE" == "coverage" ]; then
            run_e2e_tests
        fi
        ;;
    *)
        print_error "Unknown target: $TARGET"
        echo "Usage: $0 [test-type] [target]"
        echo "  test-type: all (default), small, medium, big, coverage"
        echo "  target: all (default), user-api, admin-api, frontend, e2e"
        exit 1
        ;;
esac

print_header "Test Summary"
print_success "All requested tests completed successfully!"

if [ "$TEST_TYPE" == "coverage" ] || [ "$TEST_TYPE" == "all" ]; then
    echo -e "\n${GREEN}Coverage Reports:${NC}"
    [ "$TARGET" == "all" ] || [ "$TARGET" == "user-api" ] && echo "  - User API: user-api/coverage/index.html"
    [ "$TARGET" == "all" ] || [ "$TARGET" == "admin-api" ] && echo "  - Admin API: admin-api/coverage/index.html"
    [ "$TARGET" == "all" ] || [ "$TARGET" == "frontend" ] && echo "  - Frontend: frontend/coverage/lcov-report/index.html"
    [ "$TARGET" == "all" ] || [ "$TARGET" == "e2e" ] && echo "  - E2E: e2e/playwright-report/index.html"
fi
