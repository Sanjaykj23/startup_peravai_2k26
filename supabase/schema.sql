-- ==============================================================================
-- CHENNAI SMART BUS CROWD TRACKING SYSTEM - SUPABASE SQL SCHEMA
-- Phase 1: Normalized GTFS Database, Conductor Ticketing, Live Tracking & ML Asset
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop for idempotency if re-running (Optional)
-- DROP TABLE IF EXISTS occupancy_history CASCADE;
-- DROP TABLE IF EXISTS bus_locations CASCADE;
-- DROP TABLE IF EXISTS tickets CASCADE;
-- DROP TABLE IF EXISTS trips CASCADE;
-- DROP TABLE IF EXISTS route_stops CASCADE;
-- DROP TABLE IF EXISTS buses CASCADE;
-- DROP TABLE IF EXISTS conductors CASCADE;
-- DROP TABLE IF EXISTS stops CASCADE;
-- DROP TABLE IF EXISTS routes CASCADE;

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- Table 1: Routes
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_number VARCHAR(20) NOT NULL,
    route_name TEXT NOT NULL,
    corridor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Stops (Extracted from Chennai GCC, Avadi, Tambaram dataset)
CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stop_name TEXT NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Conductors
CREATE TABLE IF NOT EXISTS conductors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Buses
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    fleet_code VARCHAR(20),
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    capacity INTEGER NOT NULL DEFAULT 50,
    conductor_id UUID REFERENCES conductors(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'idle', -- 'idle', 'active', 'maintenance'
    current_occupancy INTEGER DEFAULT 0,
    crowd_status INTEGER DEFAULT 0, -- 0 = Empty (0-30%), 1 = Normal (31-70%), 2 = Overcrowded (71-100%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: Route Stops (Normalized Sequence)
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    stop_sequence INTEGER NOT NULL,
    CONSTRAINT uq_route_stop_seq UNIQUE (route_id, stop_sequence)
);

-- Table 6: Trips
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    start_stop_id UUID REFERENCES stops(id),
    current_stop_id UUID REFERENCES stops(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' -- 'active', 'completed', 'cancelled'
);

-- Table 7: Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    passenger_id UUID,
    passenger_phone VARCHAR(20),
    source_stop_id UUID REFERENCES stops(id),
    destination_stop_id UUID REFERENCES stops(id),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
    fare NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    booked_by VARCHAR(20) NOT NULL CHECK (booked_by IN ('conductor', 'passenger')),
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('Cash', 'Razorpay', 'Free')),
    occupancy_snapshot INTEGER NOT NULL,
    crowd_status INTEGER NOT NULL CHECK (crowd_status IN (0, 1, 2)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: Bus Locations (Live 30-Second Periodic GPS Beacon)
CREATE TABLE IF NOT EXISTS bus_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    speed NUMERIC(5, 2) DEFAULT 0.00,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 9: Occupancy History (CRITICAL ASSET FOR FUTURE ML CROWD PREDICTION)
CREATE TABLE IF NOT EXISTS occupancy_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    occupancy INTEGER NOT NULL,
    crowd_status INTEGER NOT NULL CHECK (crowd_status IN (0, 1, 2)),
    trigger_event VARCHAR(50) NOT NULL, -- 'trip_start', 'ticket_booked', 'passenger_entry', 'passenger_exit', 'stop_reached'
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_buses_route ON buses(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_bus_status ON trips(bus_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_trip ON tickets(trip_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus ON bus_locations(bus_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_occupancy_history_bus ON occupancy_history(bus_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_occupancy_history_timestamp ON occupancy_history(recorded_at);

-- ==============================================================================
-- 4. SUPABASE REALTIME SUBSCRIPTION CONFIGURATION
-- ==============================================================================
-- Enable Realtime events for live map, passenger dashboards, and conductor sync
ALTER PUBLICATION supabase_realtime ADD TABLE buses;
ALTER PUBLICATION supabase_realtime ADD TABLE bus_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE occupancy_history;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductors ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancy_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access to bus, route, and stop information for map & passengers
CREATE POLICY "Public read for routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public read for stops" ON stops FOR SELECT USING (true);
CREATE POLICY "Public read for route_stops" ON route_stops FOR SELECT USING (true);
CREATE POLICY "Public read for buses" ON buses FOR SELECT USING (true);
CREATE POLICY "Public read for trips" ON trips FOR SELECT USING (true);
CREATE POLICY "Public read for bus_locations" ON bus_locations FOR SELECT USING (true);
CREATE POLICY "Public read for occupancy_history" ON occupancy_history FOR SELECT USING (true);

-- Allow authenticated conductors & service role full write permissions
CREATE POLICY "Service and conductor update buses" ON buses FOR ALL USING (true);
CREATE POLICY "Service and conductor insert trips" ON trips FOR ALL USING (true);
CREATE POLICY "Service and conductor insert tickets" ON tickets FOR ALL USING (true);
CREATE POLICY "Service and conductor insert locations" ON bus_locations FOR ALL USING (true);
CREATE POLICY "Service and conductor insert occupancy" ON occupancy_history FOR ALL USING (true);

-- ==============================================================================
-- 6. SEED DATA (Chennai MTC Key Corridors & Conductors)
-- ==============================================================================

-- Insert Routes
INSERT INTO routes (id, route_number, route_name, corridor) VALUES
('b1020000-0000-0000-0000-000000000570', '570', 'CMBT Koyambedu to Kelambakkam (via OMR IT Corridor)', 'Rajiv Gandhi IT Expressway / OMR'),
('b1020000-0000-0000-0000-000000000021', '21G', 'Broadway / Island Ground to KCBT Kilambakkam (via Tambaram)', 'GST Road Corridor'),
('b1020000-0000-0000-0000-000000000005', '5E', 'Vadapalani to Besant Nagar (via T.Nagar & Adyar)', 'Central Metro - Coastal'),
('b1020000-0000-0000-0000-000000000102', '102', 'Broadway / Island Ground to Kelambakkam (Express via OMR)', 'OMR Coastal Express'),
('b1020000-0000-0000-0000-000000000070', 'A70', 'Avadi Bus Terminus to Tambaram West (via Koyambedu & Guindy)', 'Outer Ring Trunk')
ON CONFLICT (id) DO NOTHING;

-- Insert Conductors
INSERT INTO conductors (id, name, employee_code, phone, email, username, password_hash) VALUES
('c1020000-0000-0000-0000-000000000570', 'Karthik Rajan', 'MTC-CND-570', '+91 98401 23456', 'conductor.570@mtc.chennai.gov.in', 'cnd_570', 'password123'),
('c1020000-0000-0000-0000-000000000021', 'Murugan Shanmugam', 'MTC-CND-021G', '+91 98402 34567', 'conductor.21g@mtc.chennai.gov.in', 'cnd_21g', 'password123'),
('c1020000-0000-0000-0000-000000000005', 'Anand Velu', 'MTC-CND-005E', '+91 98403 45678', 'conductor.5e@mtc.chennai.gov.in', 'cnd_5e', 'password123'),
('c1020000-0000-0000-0000-000000000102', 'Saravanan Doss', 'MTC-CND-102', '+91 98404 56789', 'conductor.102@mtc.chennai.gov.in', 'cnd_102', 'password123'),
('c1020000-0000-0000-0000-000000000070', 'Dinesh Kumar', 'MTC-CND-A70', '+91 98405 67890', 'conductor.a70@mtc.chennai.gov.in', 'cnd_a70', 'password123')
ON CONFLICT (employee_code) DO NOTHING;

-- Insert Buses
INSERT INTO buses (id, bus_number, fleet_code, route_id, capacity, conductor_id, status, current_occupancy, crowd_status) VALUES
('a1020000-0000-0000-0000-000000000570', '5701', 'BUS002', 'b1020000-0000-0000-0000-000000000570', 60, 'c1020000-0000-0000-0000-000000000570', 'active', 38, 1),
('a1020000-0000-0000-0000-000000000021', '2101', 'BUS001', 'b1020000-0000-0000-0000-000000000021', 50, 'c1020000-0000-0000-0000-000000000021', 'active', 46, 2),
('a1020000-0000-0000-0000-000000000005', '0051', 'BUS003', 'b1020000-0000-0000-0000-000000000005', 70, 'c1020000-0000-0000-0000-000000000005', 'active', 12, 0),
('a1020000-0000-0000-0000-000000000102', '1021', 'BUS004', 'b1020000-0000-0000-0000-000000000102', 55, 'c1020000-0000-0000-0000-000000000102', 'idle', 0, 0),
('a1020000-0000-0000-0000-000000000070', '7001', 'BUS005', 'b1020000-0000-0000-0000-000000000070', 60, 'c1020000-0000-0000-0000-000000000070', 'idle', 0, 0)
ON CONFLICT (bus_number) DO NOTHING;

-- 4. Insert Key Chennai Stops (Valid Hexadecimal UUIDs: 0-9, a-f)
INSERT INTO stops (id, stop_name, latitude, longitude) VALUES
('d1020000-0000-0000-0000-000000000001', 'M.G.R.KOYAMBEDU', 13.069180, 80.205720),
('d1020000-0000-0000-0000-000000000002', 'KOYAMBEDU MARKET', 13.063410, 80.198300),
('d1020000-0000-0000-0000-000000000003', 'VADAPALANI', 13.050420, 80.212140),
('d1020000-0000-0000-0000-000000000004', 'ASHOK PILLAR', 13.033620, 80.211420),
('d1020000-0000-0000-0000-000000000005', 'GUINDY TVK ESTATE', 13.009820, 80.213150),
('d1020000-0000-0000-0000-000000000006', 'VELACHERY B.T', 12.975420, 80.221230),
('d1020000-0000-0000-0000-000000000007', 'PERUNGUDI', 12.965410, 80.241510),
('d1020000-0000-0000-0000-000000000008', 'THORAIPAKKAM', 12.937220, 80.237810),
('d1020000-0000-0000-0000-000000000009', 'SHOLINGANALLUR', 12.901130, 80.227910),
('d1020000-0000-0000-0000-000000000010', 'NAVALUR', 12.846510, 80.226840),
('d1020000-0000-0000-0000-000000000011', 'SIPCOT SIRUSERI', 12.825610, 80.221840),
('d1020000-0000-0000-0000-000000000012', 'PUDUPAKKAM RD.JN', 12.810500, 80.219500),
('d1020000-0000-0000-0000-000000000013', 'KELAMBAKKAM', 12.787120, 80.218510),
('d1020000-0000-0000-0000-000000000014', 'ISLAND GROUND', 13.076320, 80.283120),
('d1020000-0000-0000-0000-000000000015', 'M.G.R.CENTRAL', 13.082680, 80.275520),
('d1020000-0000-0000-0000-000000000016', 'LIC CHENNAI', 13.064500, 80.267800),
('d1020000-0000-0000-0000-000000000017', 'ANNA SALAI D.M.S', 13.045210, 80.250100),
('d1020000-0000-0000-0000-000000000018', 'TEYNAMPET', 13.040150, 80.244300),
('d1020000-0000-0000-0000-000000000019', 'NANDANAM', 13.029800, 80.239500),
('d1020000-0000-0000-0000-000000000020', 'SAIDAPET', 13.020100, 80.223500),
('d1020000-0000-0000-0000-000000000021', 'AIRPORT METRO', 12.980100, 80.163800),
('d1020000-0000-0000-0000-000000000022', 'PALLAVARAM R.S', 12.968410, 80.148520),
('d1020000-0000-0000-0000-000000000023', 'CHROMPET', 12.951500, 80.141200),
('d1020000-0000-0000-0000-000000000024', 'TAMBARAM WEST', 12.924820, 80.117210),
('d1020000-0000-0000-0000-000000000025', 'KCBT - KILAMBAKKAM', 12.861500, 80.075200),
('d1020000-0000-0000-0000-000000000026', 'T.NAGAR B.T', 13.040500, 80.233500),
('d1020000-0000-0000-0000-000000000027', 'ADYAR B.T', 13.006420, 80.257120),
('d1020000-0000-0000-0000-000000000028', 'BESANT NAGAR', 13.000150, 80.267150),
('d1020000-0000-0000-0000-000000000029', 'AVADI B.T', 13.119770, 80.102270)
ON CONFLICT (id) DO NOTHING;
