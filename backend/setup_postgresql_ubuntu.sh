#!/usr/bin/env bash

# Update package list and install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service if it's not running
sudo systemctl start postgresql

# Switch to the PostgreSQL user (default 'postgres')
sudo -i -u postgres psql <<EOF
-- Create user with password
CREATE USER redwan_courses_center_dev WITH PASSWORD 'Redwan_courses_center_dev_pwd123';

-- Create database
CREATE DATABASE redwan_courses_center_dev_db;

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE redwan_courses_center_dev_db TO redwan_courses_center_dev;

-- Alter user to have CREATEDB option
ALTER USER redwan_courses_center_dev CREATEDB;

EOF

# Restart PostgreSQL service to apply changes
sudo systemctl restart postgresql

echo "PostgreSQL setup complete. User 'redwan_courses_center_dev' with privileges on 'redwan_courses_center_dev_db' created."
echo "to access the psql shell for the created DB use: sudo -i -u postgres psql -U redwan_courses_center_dev -d redwan_courses_center_dev_db"
