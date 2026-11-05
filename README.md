# Chennai Smart Bus Crowd Tracking System - Phase 1

A full-stack web application simulating the **Metropolitan Transport Corporation (MTC) Chennai** bus ecosystem with live crowd tracking, conductor ticketing terminal, passenger discovery portal, and central administrative operations.

---

## 🚌 System Architecture & Highlights

- **GTFS Dataset Analysis & Normalization**:
  - Analyzed and normalized **2,717 real Chennai MTC bus stop records** from Greater Chennai Corporation (GCC), Avadi, and Tambaram regions with exact latitudes and longitudes.
  - Normalized routes including **21G** (Broadway/Island Ground <-> KCBT Kilambakkam), **570** (CMBT Koyambedu <-> Kelambakkam via OMR), **5E** (Vadapalani <-> Besant Nagar), **102** (Broadway <-> Kelambakkam Express), and **A70** (Avadi <-> Tambaram West).
  - Electronic Ticket Machine (ETM) log transaction normalization.

- **Conductor Terminal (`/conductor`)**:
  - Dedicated accounts for each bus (`cnd_570`, `cnd_21g`, `cnd_5e`, `cnd_102`, `cnd_a70`).
  - **Mandatory 3-Step Flow**:
    - **Step 1**: Select Route & Bus Number.
    - **Step 2**: Select Current Starting Stop (e.g. Koyambedu).
    - **Step 3**: Click **START TRIP**. Only after starting a trip can tickets be issued.
  - **Ticket Generation**: Mandatory Source Stop, Destination Stop, Gender.
  - **Tamil Nadu Vidiyal Payanam Scheme**: Female passengers receive **Free Travel (Fare = ₹0.00)** while male passengers pay distance-based fare. Still generates authentic ETM ticket records!
  - **Live Occupancy Updates**: Every ticket increases occupancy; manual passenger boarding (+1) and alighting (-1) buttons update counts immediately.
  - **Periodic 30-Second GPS Beacon**: Conductor terminal periodically transmits latitude, longitude, and speed.

- **Passenger Portal (`/passenger`)**:
  - **Mobile Number OTP Login** (Universal test OTP: `1234`).
  - **Nearby Bus Discovery**: Fetches GPS location, discovers active buses within configurable radius (default: **5 KM** via Haversine formula).
  - Displays: Bus Number, Route Name, Crowd Status, Occupancy %, Estimated Distance.
  - **Ticket Booking**: Self-book tickets via 4-digit bus code, source/destination stop, with **Razorpay (UPI/Card)** or **Cash** options.

- **Crowd Classification Engine**:
  - `occupancy_percentage = current_occupancy / bus_capacity * 100`
  - **Status 0 = Empty (0 - 30%)** &rarr; **Green**
  - **Status 1 = Normal Crowd (31 - 70%)** &rarr; **Yellow**
  - **Status 2 = Overcrowded (71 - 100%)** &rarr; **Red**

- **Chennai Live Map (`/map`)**:
  - Interactive **Leaflet & OpenStreetMap** showing all active buses.
  - Dynamically colored markers: **Green**, **Yellow**, and **Red**.
  - Clicking any bus displays: Bus Number, Route Number, Capacity, Current Occupancy, Crowd Status, and Last Updated Timestamp.

- **Central Admin & ML Operations (`/admin`)**:
  - Fleet metrics: Total Active Buses, Total Tickets, Fare Revenue, Free Women Passes.
  - Active crowd distribution charts & Vidiyal Payanam subsidy audit.
  - **CRITICAL DATA ASSET (`occupancy_history`)**: Every occupancy change is recorded in `occupancy_history`. One-click **Export ML Dataset (CSV)** button allows training future machine learning crowd prediction models.

---

## 🗄️ Database Schema

The system implements the required PostgreSQL / Supabase normalized schema:

```sql
CREATE TABLE buses (
  id UUID PRIMARY KEY,
  bus_number VARCHAR(20) UNIQUE,
  route_id UUID,
  capacity INTEGER,
  conductor_id UUID,
  status VARCHAR(20)
);

CREATE TABLE conductors (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  employee_code VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  password_hash TEXT
);

CREATE TABLE routes (
  id UUID PRIMARY KEY,
  route_number VARCHAR(20),
  route_name TEXT
);

CREATE TABLE stops (
  id UUID PRIMARY KEY,
  stop_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC
);

CREATE TABLE route_stops (
  id UUID PRIMARY KEY,
  route_id UUID,
  stop_id UUID,
  stop_sequence INTEGER
);

CREATE TABLE trips (
  id UUID PRIMARY KEY,
  bus_id UUID,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(20)
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  trip_id UUID,
  passenger_id UUID,
  source_stop_id UUID,
  destination_stop_id UUID,
  gender VARCHAR(10),
  fare NUMERIC,
  booked_by VARCHAR(20),
  payment_mode VARCHAR(20),
  occupancy_snapshot INTEGER,
  crowd_status INTEGER,
  created_at TIMESTAMP
);

CREATE TABLE bus_locations (
  id UUID PRIMARY KEY,
  bus_id UUID,
  latitude NUMERIC,
  longitude NUMERIC,
  recorded_at TIMESTAMP
);

CREATE TABLE occupancy_history (
  id UUID PRIMARY KEY,
  bus_id UUID,
  occupancy INTEGER,
  crowd_status INTEGER,
  recorded_at TIMESTAMP
);
```

---

## ⚡ Realtime & Redis Cache Layer

Standardized Redis key patterns:
- `bus:BUS001:occupancy`
- `bus:BUS001:crowd_status`
- `bus:BUS001:location`

The system includes a zero-config fallback cache so it runs immediately out-of-the-box without requiring an external Redis server, and automatically connects to Redis Cloud when `REDIS_URL` is set in `.env.local`.

---

## 🚀 Running the Project

### Development Server
```bash
pnpm run dev
```

### Production Build & Start
```bash
pnpm run build
pnpm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Conductor Credentials

| Bus Route | Bus Number | Username | Password |
| :--- | :--- | :--- | :--- |
| **570** (Koyambedu <-> Kelambakkam via OMR) | 5701 | `cnd_570` | `password123` |
| **21G** (Broadway <-> Kilambakkam via Tambaram) | 2101 | `cnd_21g` | `password123` |
| **5E** (Vadapalani <-> Besant Nagar) | 0051 | `cnd_5e` | `password123` |
| **102** (Broadway <-> Kelambakkam Express) | 1021 | `cnd_102` | `password123` |
| **A70** (Avadi <-> Tambaram West) | 7001 | `cnd_a70` | `password123` |

Passenger Mobile OTP: Any 10-digit mobile number, OTP: `1234`.
