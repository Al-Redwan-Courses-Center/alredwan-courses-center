#!/usr/bin/env bash
sudo psql -U postgres -c "CREATE DATABASE Redwan_courses_center_test_db;"
sudo psql -U postgres -c "CREATE USER Redwan_courses_center_test WITH PASSWORD 'Redwan_courses_center_test_pwd123';"
sudo psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE Redwan_courses_center_test_db TO Redwan_courses_center_test;"
sudo psql -U postgres -c "ALTER USER Redwan_courses_center_test CREATEDB;"

sudo psql -U postgres -c "CREATE DATABASE Redwan_courses_center_dev_db;"
sudo psql -U postgres -c "CREATE USER Redwan_courses_center_dev WITH PASSWORD 'Redwan_courses_center_dev_pwd123';"
sudo psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE Redwan_courses_center_dev_db TO Redwan_courses_center_dev;"
sudo psql -U postgres -c "ALTER USER Redwan_courses_center_dev CREATEDB;"
