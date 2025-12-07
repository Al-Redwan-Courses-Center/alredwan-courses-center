#!/usr/bin/env bash

# Update package list and install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service if it's not running
sudo systemctl start postgresql

# Switch to the PostgreSQL user (default 'postgres')
sudo -i -u postgres psql <<EOF
-- Create user with password
CREATE USER Redwan_courses_center_dev WITH PASSWORD 'Redwan_courses_center_dev_pwd123';

-- Create database
CREATE DATABASE Redwan_courses_center_dev_db;

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE Redwan_courses_center_dev_db TO Redwan_courses_center_dev;

-- Alter user to have CREATEDB option
ALTER USER Redwan_courses_center_dev CREATEDB;

EOF

# Restart PostgreSQL service to apply changes
sudo systemctl restart postgresql

echo "PostgreSQL setup complete. User 'Redwan_courses_center_dev' with privileges on 'Redwan_courses_center_dev_db' created."
echo "to access the psql shell for the created DB use: sudo -i -u postgres psql -U Redwan_courses_center_dev -d Redwan_courses_center_dev_db"
