-- データベースの作成
CREATE DATABASE IF NOT EXISTS shopping_development;
CREATE DATABASE IF NOT EXISTS shopping_test;
CREATE DATABASE IF NOT EXISTS shopping_production;

-- 権限の付与
GRANT ALL PRIVILEGES ON shopping_development.* TO 'shopping_user'@'%';
GRANT ALL PRIVILEGES ON shopping_test.* TO 'shopping_user'@'%';
GRANT ALL PRIVILEGES ON shopping_production.* TO 'shopping_user'@'%';
FLUSH PRIVILEGES;
