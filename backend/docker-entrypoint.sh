#!/bin/bash
# Source - https://stackoverflow.com/a
# Posted by Louis Barranqueiro, modified by community. See post 'Timeline' for change history
# Retrieved 2025-12-28, License - CC BY-SA 3.0

# Collect static files
echo "Collect static files"
python manage.py collectstatic --noinput

# Apply database migrations
echo "Apply database migrations"
python manage.py migrate

# Start server
echo "Starting server"
python manage.py runserver 0.0.0.0:8000
