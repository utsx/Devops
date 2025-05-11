--liquibase formatted sql

--changeset utsx:init_users_table
CREATE SEQUENCE IF NOT EXISTS users_seq START WITH 10000 INCREMENT BY 1000;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
