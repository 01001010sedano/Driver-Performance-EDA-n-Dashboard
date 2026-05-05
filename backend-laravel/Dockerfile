FROM php:8.2-cli-alpine

RUN apk add --no-cache libpq-dev oniguruma-dev \
    && docker-php-ext-install pdo pdo_pgsql mbstring opcache

WORKDIR /var/www/html

# Copy the full pre-built Laravel project (vendor/ included from local composer install)
COPY . .

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
