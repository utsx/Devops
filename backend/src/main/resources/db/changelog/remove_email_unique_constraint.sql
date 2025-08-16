--liquibase formatted sql

--changeset utsx:remove_email_unique_constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;