#!/bin/bash
set -e

export DJANGO_SETTINGS_MODULE=Redwan_courses_center.settings
# Wait for database to be ready
echo "Waiting for PostgreSQL..."
while ! python3 -c "
import os, psycopg2
conn = psycopg2.connect(
    dbname=os.getenv('DATABASE_NAME'),
    user=os.getenv('DATABASE_USERNAME'),
    password=os.getenv('DATABASE_PASSWORD'),
    host=os.getenv('DATABASE_HOST'),
    port=os.getenv('DATABASE_PORT', 5432)
)
conn.close()
" 2>/dev/null; do
    echo "PostgreSQL is unavailable - sleeping 1s"
    sleep 1
done
echo "PostgreSQL is up!"

# Collect static files
echo "Collecting static files..."
python3 manage.py collectstatic --noinput

# Apply database migrations (DO NOT run makemigrations here!)
# Migrations should be created locally and committed to git
echo "Applying database migrations..."
python3 manage.py migrate --noinput

# Create supervisor log directory
mkdir -p /var/log/supervisor

# Start supervisor (manages both Gunicorn on :8000 and Uvicorn on :8001)
echo "Starting services with supervisor..."
echo "  - Gunicorn (HTTP) on port 8000"
echo "  - Uvicorn (WebSocket) on port 8001"
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
