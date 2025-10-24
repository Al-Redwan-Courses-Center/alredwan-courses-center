-- ============================================
-- PostgreSQL Initialization Script for Django
-- ============================================
-- Create database
CREATE DATABASE Redwan_courses_center_dev_db
    WITH 
    OWNER = Redwan_courses_center_dev
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TEMPLATE = template0;

CREATE USER Redwan_courses_center_dev WITH PASSWORD 'Redwan_courses_center_dev_pwd123';

GRANT ALL PRIVILEGES ON DATABASE Redwan_courses_center_dev_db TO Redwan_courses_center_dev;




/* -- Create database user


-- Connect to the new database (only works interactively)
-- \c Redwan_courses_center_dev_db;

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";  -- optional for case-insensitive text fields

-- Verify
-- \dt
