#!/bin/sh
set -e

# Write runtime env vars into .env so artisan can read them
cat > .env <<EOF
APP_NAME=DriverPerformanceAPI
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-driver_performance}
DB_USERNAME=${DB_USERNAME:-laravel}
DB_PASSWORD=${DB_PASSWORD:-secret}

CACHE_DRIVER=${CACHE_DRIVER:-redis}
QUEUE_CONNECTION=${QUEUE_CONNECTION:-redis}
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_CLIENT=${REDIS_CLIENT:-predis}

SESSION_DRIVER=file
LOG_CHANNEL=stderr
EOF

# Generate app key if not already set
php artisan key:generate --force --quiet

# Wait for DB to be ready then run migrations
echo "Running migrations..."
php artisan migrate --force --quiet

echo "Starting Laravel server on 0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
