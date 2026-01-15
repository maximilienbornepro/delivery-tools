-- Create databases for all applications
CREATE DATABASE pointing_poker;
CREATE DATABASE delivery;

-- Grant all privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE pointing_poker TO postgres;
GRANT ALL PRIVILEGES ON DATABASE delivery TO postgres;
