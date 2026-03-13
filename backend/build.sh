#!/usr/bin/env bash
# Exit on error
set -o errexit

export DJANGO_SETTINGS_MODULE=Redwan_courses_center.settings
# Install dependencies
pip3 install -r requirements.txt

# Collect static files
python3 manage.py collectstatic --no-input

# Run migrations
python3 manage.py migrate --no-input

# Create superuser from env vars if it doesn't exist
python3 manage.py create_superuser_if_not_exists
