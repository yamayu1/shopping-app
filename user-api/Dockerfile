FROM ruby:3.1

WORKDIR /app

RUN apt-get update -qq && apt-get install -y \
    build-essential \
    nodejs \
    default-mysql-client \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

COPY Gemfile ./
RUN bundle install

COPY . .

EXPOSE 3000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3000"]
