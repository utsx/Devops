--liquibase formatted sql

--changeset utsx:init_orders_table
CREATE SEQUENCE IF NOT EXISTS orders_seq START WITH 10000 INCREMENT BY 1000;

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY DEFAULT nextval('orders_seq'),
    product_name VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    delivery_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
);
