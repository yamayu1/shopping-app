FROM ruby:3.1-alpine

RUN apk add --no-cache \
    build-base \
    mysql-dev \
    tzdata \
    bash \
    curl

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test

COPY . .

# エクスポート用ディレクトリを作成
RUN mkdir -p exports

# cronデーモンをインストール
RUN apk add --no-cache dcron

# crontabファイルをコピー
COPY crontab /etc/crontabs/root

# cronジョブスクリプトに実行権限を付与
RUN chmod +x /app/export_inventory.rb

# cronデーモンをフォアグラウンドで起動してコンテナを維持
CMD ["crond", "-f"]