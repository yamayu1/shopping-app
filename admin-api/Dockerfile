FROM php:8.3-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# PHP upload settings
RUN echo "upload_max_filesize = 10M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 12M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "upload_tmp_dir = /tmp" >> /usr/local/etc/php/conf.d/uploads.ini \
    && chmod 1777 /tmp

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for better caching
COPY composer.json composer.lock* /var/www/html/

# Install dependencies (skip scripts to avoid needing .env at build time)
RUN mkdir -p bootstrap/cache && composer install --optimize-autoloader --no-scripts --no-autoloader

# Copy existing application directory contents
COPY . /var/www/html

# Ensure bootstrap/cache exists and is writable, then generate autoloader
RUN mkdir -p bootstrap/cache && chmod -R 775 bootstrap/cache \
    && composer dump-autoload --optimize --no-scripts

# Change current user to www
RUN chown -R www-data:www-data /var/www/html

EXPOSE 8000

CMD ["sh", "-c", "cp -n .env.example .env 2>/dev/null || true && mkdir -p bootstrap/cache && chmod -R 775 bootstrap/cache && composer install --no-scripts && php artisan package:discover --ansi && php artisan key:generate --force && php artisan serve --host=0.0.0.0 --port=8000"]