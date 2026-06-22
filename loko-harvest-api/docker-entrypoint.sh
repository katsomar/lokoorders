#!/bin/sh
set -e

echo "Starting Laravel Production Initialization..."

# Clear any legacy config caches
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true
php artisan cache:clear || true

# Rebuild production caches for speed
echo "Caching configurations, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force

echo "Initialization complete. Starting Apache..."

# Hand off execution to the CMD (apache2-foreground)
exec "$@"
