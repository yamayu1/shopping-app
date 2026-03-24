<?php
/**
 * 既存DBの不足カラムを追加するスキーマ修正スクリプト
 * マイグレーション実行前にdocker-compose起動時に実行される
 */

$host = getenv('DB_HOST') ?: 'mysql';
$port = getenv('DB_PORT') ?: '3306';
$db   = getenv('DB_DATABASE') ?: 'shopping_development';
$user = getenv('DB_USERNAME') ?: 'shopping_user';
$pass = getenv('DB_PASSWORD') ?: 'shopping_password';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo "DB connection failed: " . $e->getMessage() . "\n";
    exit(0); // 失敗しても起動は続行
}

/**
 * カラムが存在しなければ追加する
 */
function addColumnIfMissing(PDO $pdo, string $table, string $column, string $definition): void
{
    try {
        $stmt = $pdo->query("SELECT $column FROM $table LIMIT 0");
    } catch (Exception $e) {
        try {
            $pdo->exec("ALTER TABLE $table ADD COLUMN $column $definition");
            echo "Added $column to $table\n";
        } catch (Exception $e2) {
            echo "Failed to add $column to $table: " . $e2->getMessage() . "\n";
        }
    }
}

// admins テーブル
addColumnIfMissing($pdo, 'admins', 'deleted_at', 'TIMESTAMP NULL');
addColumnIfMissing($pdo, 'admins', 'remember_token', 'VARCHAR(100) NULL');
addColumnIfMissing($pdo, 'admins', 'email_verified_at', 'TIMESTAMP NULL');

// categories テーブル
addColumnIfMissing($pdo, 'categories', 'parent_id', 'BIGINT UNSIGNED NULL');
addColumnIfMissing($pdo, 'categories', 'image', 'VARCHAR(255) NULL');
addColumnIfMissing($pdo, 'categories', 'icon', 'VARCHAR(255) NULL');
addColumnIfMissing($pdo, 'categories', 'sort_order', 'INT DEFAULT 0');
addColumnIfMissing($pdo, 'categories', 'is_active', 'BOOLEAN DEFAULT TRUE');
addColumnIfMissing($pdo, 'categories', 'is_featured', 'BOOLEAN DEFAULT FALSE');
addColumnIfMissing($pdo, 'categories', 'meta_title', 'VARCHAR(255) NULL');
addColumnIfMissing($pdo, 'categories', 'meta_description', 'TEXT NULL');
addColumnIfMissing($pdo, 'categories', 'attributes', 'JSON NULL');
addColumnIfMissing($pdo, 'categories', 'deleted_at', 'TIMESTAMP NULL');

// products テーブル
addColumnIfMissing($pdo, 'products', 'short_description', 'TEXT NULL');
addColumnIfMissing($pdo, 'products', 'sale_price', 'DECIMAL(10,2) NULL');
addColumnIfMissing($pdo, 'products', 'cost_price', 'DECIMAL(10,2) NULL');
addColumnIfMissing($pdo, 'products', 'low_stock_threshold', 'INT DEFAULT 10');
addColumnIfMissing($pdo, 'products', 'brand', 'VARCHAR(255) NULL');
addColumnIfMissing($pdo, 'products', 'weight', 'DECIMAL(8,2) NULL');
addColumnIfMissing($pdo, 'products', 'dimensions', 'JSON NULL');
addColumnIfMissing($pdo, 'products', 'color', 'VARCHAR(100) NULL');
addColumnIfMissing($pdo, 'products', 'size', 'VARCHAR(100) NULL');
addColumnIfMissing($pdo, 'products', 'material', 'VARCHAR(255) NULL');
addColumnIfMissing($pdo, 'products', 'is_active', 'BOOLEAN DEFAULT TRUE');
addColumnIfMissing($pdo, 'products', 'is_featured', 'BOOLEAN DEFAULT FALSE');
addColumnIfMissing($pdo, 'products', 'meta_title', 'VARCHAR(255) NULL');
addColumnIfMissing($pdo, 'products', 'meta_description', 'TEXT NULL');
addColumnIfMissing($pdo, 'products', 'tags', 'JSON NULL');
addColumnIfMissing($pdo, 'products', 'images', 'JSON NULL');
addColumnIfMissing($pdo, 'products', 'attributes', 'JSON NULL');
addColumnIfMissing($pdo, 'products', 'deleted_at', 'TIMESTAMP NULL');

// users テーブル
addColumnIfMissing($pdo, 'users', 'name', 'VARCHAR(255) NULL');
addColumnIfMissing($pdo, 'users', 'email_verified_at', 'TIMESTAMP NULL');
addColumnIfMissing($pdo, 'users', 'deleted_at', 'TIMESTAMP NULL');

// orders テーブル
addColumnIfMissing($pdo, 'orders', 'deleted_at', 'TIMESTAMP NULL');

echo "Schema fix completed.\n";
