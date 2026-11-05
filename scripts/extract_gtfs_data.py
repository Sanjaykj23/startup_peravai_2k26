import os
import json
import uuid
import openpyxl

print("Extracting Chennai MTC Bus Stops and Routes...")

# 1. Read Bus Stops from Excel
excel_path = "Tambaram, Avadi, GCC Bus Stops List  1.xlsx"
wb = openpyxl.load_workbook(excel_path, data_only=True)

all_stops_raw = []
for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    header = [cell for cell in next(ws.iter_rows(values_only=True))]
    # Header format: ['S.No', 'Bus Stop Name', 'Latitude', 'Longitude']
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or len(row) < 4:
            continue
        s_no, stop_name, lat, lon = row[0], row[1], row[2], row[3]
        if not stop_name or lat is None or lon is None:
            continue
        try:
            lat = float(lat)
            lon = float(lon)
            if 12.5 <= lat <= 13.5 and 79.5 <= lon <= 80.5:
                all_stops_raw.append({
                    "name": str(stop_name).strip(),
                    "latitude": round(lat, 6),
                    "longitude": round(lon, 6),
                    "region": sheet_name
                })
        except (ValueError, TypeError):
            continue

print(f"Total valid stop records loaded from Excel: {len(all_stops_raw)}")

# Deduplicate stops by name (keeping unique primary locations)
stops_by_name = {}
for s in all_stops_raw:
    key = s["name"].upper()
    if key not in stops_by_name:
        stops_by_name[key] = s

print(f"Unique bus stop names: {len(stops_by_name)}")

# Predefined key routes with verified Chennai sequential stops
# Routes requested: 21G, 570, 5E, 102, A70 (70A)
key_routes_config = [
    {
        "route_number": "570",
        "route_name": "CMBT Koyambedu to Kelambakkam (via OMR IT Corridor)",
        "corridor": "Rajiv Gandhi IT Expressway / OMR",
        "stops": [
            "M.G.R.KOYAMBEDU",
            "KOYAMBEDU MARKET",
            "VADAPALANI",
            "ASHOK PILLAR",
            "GUINDY TVK ESTATE",
            "VELACHERY B.T",
            "PERUNGUDI",
            "THORAIPAKKAM",
            "SHOLINGANALLUR",
            "NAVALUR",
            "SIPCOT SIRUSERI",
            "PUDUPAKKAM RD.JN",
            "KELAMBAKKAM"
        ],
        "bus": {
            "bus_number": "5701",
            "fleet_code": "BUS002",
            "capacity": 60,
            "conductor": {
                "name": "Karthik Rajan",
                "employee_code": "MTC-CND-570",
                "phone": "+91 98401 23456",
                "email": "conductor.570@mtc.chennai.gov.in",
                "username": "cnd_570",
                "password": "password123"
            }
        }
    },
    {
        "route_number": "21G",
        "route_name": "Broadway / Island Ground to KCBT Kilambakkam (via Tambaram)",
        "corridor": "GST Road Corridor",
        "stops": [
            "ISLAND GROUND",
            "M.G.R.CENTRAL",
            "LIC CHENNAI",
            "ANNA SALAI D.M.S",
            "TEYNAMPET",
            "NANDANAM",
            "SAIDAPET",
            "GUINDY TVK ESTATE",
            "AIRPORT METRO",
            "PALLAVARAM R.S",
            "CHROMPET",
            "TAMBARAM WEST",
            "PERUNGALATHUR",
            "VANDALUR ZOO",
            "KCBT - KILAMBAKKAM"
        ],
        "bus": {
            "bus_number": "2101",
            "fleet_code": "BUS001",
            "capacity": 50,
            "conductor": {
                "name": "Murugan Shanmugam",
                "employee_code": "MTC-CND-021G",
                "phone": "+91 98402 34567",
                "email": "conductor.21g@mtc.chennai.gov.in",
                "username": "cnd_21g",
                "password": "password123"
            }
        }
    },
    {
        "route_number": "5E",
        "route_name": "Vadapalani to Besant Nagar (via T.Nagar & Adyar)",
        "corridor": "Central Metro - Coastal",
        "stops": [
            "VADAPALANI",
            "KODAMBAKKAM",
            "T.NAGAR B.T",
            "PANAGAL PARK",
            "NANDANAM",
            "KOTTURPURAM",
            "ADYAR B.T",
            "INDIRA NAGAR",
            "BESANT NAGAR"
        ],
        "bus": {
            "bus_number": "0051",
            "fleet_code": "BUS003",
            "capacity": 70,
            "conductor": {
                "name": "Anand Velu",
                "employee_code": "MTC-CND-005E",
                "phone": "+91 98403 45678",
                "email": "conductor.5e@mtc.chennai.gov.in",
                "username": "cnd_5e",
                "password": "password123"
            }
        }
    },
    {
        "route_number": "102",
        "route_name": "Broadway / Island Ground to Kelambakkam (Express via OMR)",
        "corridor": "OMR Coastal Express",
        "stops": [
            "ISLAND GROUND",
            "SANTHOME CHURCH",
            "PATTINAPAKKAM",
            "ADYAR B.T",
            "THIRUVANMIYUR",
            "KANDANCHAVADI",
            "THORAIPAKKAM",
            "SHOLINGANALLUR",
            "NAVALUR",
            "SIPCOT SIRUSERI",
            "KELAMBAKKAM"
        ],
        "bus": {
            "bus_number": "1021",
            "fleet_code": "BUS004",
            "capacity": 55,
            "conductor": {
                "name": "Saravanan Doss",
                "employee_code": "MTC-CND-102",
                "phone": "+91 98404 56789",
                "email": "conductor.102@mtc.chennai.gov.in",
                "username": "cnd_102",
                "password": "password123"
            }
        }
    },
    {
        "route_number": "A70",
        "route_name": "Avadi Bus Terminus to Tambaram West (via Koyambedu & Guindy)",
        "corridor": "Outer Ring Trunk",
        "stops": [
            "AVADI B.T",
            "THIRUMULLAIVOYAL",
            "AMBATTUR I.E",
            "THIRUMANGALAM METRO R.S",
            "M.G.R.KOYAMBEDU",
            "VADAPALANI",
            "ASHOK PILLAR",
            "GUINDY TVK ESTATE",
            "PALLAVARAM R.S",
            "CHROMPET",
            "TAMBARAM WEST"
        ],
        "bus": {
            "bus_number": "7001",
            "fleet_code": "BUS005",
            "capacity": 60,
            "conductor": {
                "name": "Dinesh Kumar",
                "employee_code": "MTC-CND-A70",
                "phone": "+91 98405 67890",
                "email": "conductor.a70@mtc.chennai.gov.in",
                "username": "cnd_a70",
                "password": "password123"
            }
        }
    }
]

# Coordinate map for fallback/precise Chennai landmarks if exact string differs in excel
known_coords = {
    "M.G.R.KOYAMBEDU": (13.06918, 80.20572),
    "KOYAMBEDU MARKET": (13.06341, 80.19830),
    "VADAPALANI": (13.05042, 80.21214),
    "ASHOK PILLAR": (13.03362, 80.21142),
    "GUINDY TVK ESTATE": (13.00982, 80.21315),
    "VELACHERY B.T": (12.97542, 80.22123),
    "PERUNGUDI": (12.96541, 80.24151),
    "THORAIPAKKAM": (12.93722, 80.23781),
    "SHOLINGANALLUR": (12.90113, 80.22791),
    "NAVALUR": (12.84651, 80.22684),
    "SIPCOT SIRUSERI": (12.82561, 80.22184),
    "PUDUPAKKAM RD.JN": (12.81050, 80.21950),
    "KELAMBAKKAM": (12.78712, 80.21851),
    "ISLAND GROUND": (13.07632, 80.28312),
    "M.G.R.CENTRAL": (13.08268, 80.27552),
    "LIC CHENNAI": (13.06450, 80.26780),
    "ANNA SALAI D.M.S": (13.04521, 80.25010),
    "TEYNAMPET": (13.04015, 80.24430),
    "NANDANAM": (13.02980, 80.23950),
    "SAIDAPET": (13.02010, 80.22350),
    "AIRPORT METRO": (12.98010, 80.16380),
    "PALLAVARAM R.S": (12.96841, 80.14852),
    "CHROMPET": (12.95150, 80.14120),
    "TAMBARAM WEST": (12.92482, 80.11721),
    "PERUNGALATHUR": (12.90560, 80.09120),
    "VANDALUR ZOO": (12.87950, 80.08110),
    "KCBT - KILAMBAKKAM": (12.86150, 80.07520),
    "KODAMBAKKAM": (13.05190, 80.22410),
    "T.NAGAR B.T": (13.04050, 80.23350),
    "PANAGAL PARK": (13.04180, 80.23560),
    "KOTTURPURAM": (13.02210, 80.24210),
    "ADYAR B.T": (13.00642, 80.25712),
    "INDIRA NAGAR": (12.99210, 80.25820),
    "BESANT NAGAR": (13.00015, 80.26715),
    "SANTHOME CHURCH": (13.03350, 80.27850),
    "PATTINAPAKKAM": (13.02150, 80.27510),
    "THIRUVANMIYUR": (12.98350, 80.25950),
    "KANDANCHAVADI": (12.96910, 80.24750),
    "AVADI B.T": (13.11977, 80.10227),
    "THIRUMULLAIVOYAL": (13.12510, 80.13320),
    "AMBATTUR I.E": (13.10210, 80.16240),
    "THIRUMANGALAM METRO R.S": (13.08510, 80.19250)
}

# Match or construct stops normalized table
stops_table = {}
for s_name, (k_lat, k_lon) in known_coords.items():
    # check if excel has an exact or near match
    found = None
    for ex_name, s_data in stops_by_name.items():
        if s_name in ex_name or ex_name in s_name:
            found = s_data
            break
    lat = found["latitude"] if found else k_lat
    lon = found["longitude"] if found else k_lon
    
    stop_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"chennaibus.stop.{s_name}"))
    stops_table[s_name] = {
        "id": stop_id,
        "stop_name": s_name,
        "latitude": lat,
        "longitude": lon
    }

# Also add 100 more random stops from the GCC/Avadi/Tambaram excel dataset for rich search experience
added_count = 0
for ex_name, s_data in stops_by_name.items():
    if added_count >= 150:
        break
    if ex_name not in stops_table:
        stop_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"chennaibus.stop.{ex_name}"))
        stops_table[ex_name] = {
            "id": stop_id,
            "stop_name": ex_name,
            "latitude": s_data["latitude"],
            "longitude": s_data["longitude"]
        }
        added_count += 1

print(f"Total normalized stops created: {len(stops_table)}")

# Create Routes, Route Stops, Buses, Conductors
routes_table = []
route_stops_table = []
buses_table = []
conductors_table = []
trips_table = []

for rcfg in key_routes_config:
    r_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"chennaibus.route.{rcfg['route_number']}"))
    routes_table.append({
        "id": r_id,
        "route_number": rcfg["route_number"],
        "route_name": rcfg["route_name"],
        "corridor": rcfg["corridor"]
    })
    
    # Route stops
    for idx, s_name in enumerate(rcfg["stops"], start=1):
        s_obj = stops_table[s_name]
        rs_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"chennaibus.route_stop.{r_id}.{s_obj['id']}.{idx}"))
        route_stops_table.append({
            "id": rs_id,
            "route_id": r_id,
            "stop_id": s_obj["id"],
            "stop_name": s_name,
            "stop_sequence": idx,
            "latitude": s_obj["latitude"],
            "longitude": s_obj["longitude"]
        })
        
    # Conductor
    c_data = rcfg["bus"]["conductor"]
    c_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"chennaibus.conductor.{c_data['username']}"))
    conductors_table.append({
        "id": c_id,
        "name": c_data["name"],
        "employee_code": c_data["employee_code"],
        "phone": c_data["phone"],
        "email": c_data["email"],
        "username": c_data["username"],
        "password": c_data["password"],
        "assigned_bus_number": rcfg["bus"]["bus_number"],
        "assigned_route_number": rcfg["route_number"]
    })
    
    # Bus
    b_data = rcfg["bus"]
    b_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"chennaibus.bus.{b_data['bus_number']}"))
    buses_table.append({
        "id": b_id,
        "bus_number": b_data["bus_number"],
        "fleet_code": b_data["fleet_code"],
        "route_id": r_id,
        "route_number": rcfg["route_number"],
        "route_name": rcfg["route_name"],
        "capacity": b_data["capacity"],
        "conductor_id": c_id,
        "conductor_name": c_data["name"],
        "status": "active"
    })

os.makedirs("src/data", exist_ok=True)
os.makedirs("supabase", exist_ok=True)

seed_payload = {
    "routes": routes_table,
    "stops": list(stops_table.values()),
    "route_stops": route_stops_table,
    "conductors": conductors_table,
    "buses": buses_table
}

with open("src/data/seedData.json", "w", encoding="utf-8") as f:
    json.dump(seed_payload, f, indent=2)

print("Saved src/data/seedData.json successfully!")

# Also generate SQL seed script
sql_lines = []
sql_lines.append("-- Chennai Smart Bus Crowd Tracking System - Database Schema & Seed Data\n")
sql_lines.append("""
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
""")

with open("supabase/schema.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print("Saved supabase/schema.sql successfully!")
