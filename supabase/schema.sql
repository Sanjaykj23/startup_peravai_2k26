-- Chennai Smart Bus Crowd Tracking System - Database Schema & Seed Data


CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY,
    route_number VARCHAR(20) NOT NULL,
    route_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY,
    stop_name TEXT NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL
);

CREATE TABLE IF NOT EXISTS conductors (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    route_id UUID REFERENCES routes(id),
    capacity INTEGER NOT NULL DEFAULT 50,
    conductor_id UUID REFERENCES conductors(id),
    status VARCHAR(20) DEFAULT 'idle'
);

CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY,
    route_id UUID REFERENCES routes(id),
    stop_id UUID REFERENCES stops(id),
    stop_sequence INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY,
    bus_id UUID REFERENCES buses(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(id),
    passenger_id UUID,
    source_stop_id UUID REFERENCES stops(id),
    destination_stop_id UUID REFERENCES stops(id),
    gender VARCHAR(10) NOT NULL,
    fare NUMERIC(10, 2) NOT NULL,
    booked_by VARCHAR(20) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL,
    occupancy_snapshot INTEGER NOT NULL,
    crowd_status INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bus_locations (
    id UUID PRIMARY KEY,
    bus_id UUID REFERENCES buses(id),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS occupancy_history (
    id UUID PRIMARY KEY,
    bus_id UUID REFERENCES buses(id),
    occupancy INTEGER NOT NULL,
    crowd_status INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
