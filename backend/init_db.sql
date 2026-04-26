CREATE TYPE role_enum AS ENUM ('MOTORISTA', 'TERMINAL', 'TRANSPORTADORA');
CREATE TYPE queue_status_enum AS ENUM ('WAITING', 'CALLED', 'EXPIRED', 'COMPLETED');

CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type role_enum NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role role_enum NOT NULL
);

CREATE TABLE terminals (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    current_occupancy INT NOT NULL DEFAULT 0
);

CREATE TABLE queue_entries (
    id SERIAL PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL,
    terminal_id INT NOT NULL REFERENCES terminals(id),
    status queue_status_enum NOT NULL DEFAULT 'WAITING',
    called_at TIMESTAMP,
    expires_at TIMESTAMP
);
