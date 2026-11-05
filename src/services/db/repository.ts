import fs from 'fs';
import path from 'path';
import { randomUUID as uuidv4 } from 'crypto';
import {
  Bus,
  Conductor,
  Route,
  Stop,
  RouteStop,
  Trip,
  Ticket,
  BusLocation,
  OccupancyHistory,
  CrowdStatusCode,
  getCrowdInfo
} from '@/types';
import { APP_CONFIG } from '@/configs';
import { RedisCacheService } from '@/services/redis';
import seedData from '@/data/seedData.json';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  routes: Route[];
  stops: Stop[];
  route_stops: RouteStop[];
  conductors: Conductor[];
  buses: Bus[];
  trips: Trip[];
  tickets: Ticket[];
  bus_locations: BusLocation[];
  occupancy_history: OccupancyHistory[];
}

// In-memory cache for speed with disk backup
let cachedDb: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      cachedDb = JSON.parse(data);
      return cachedDb!;
    } catch (e) {
      console.error('Error loading db.json, re-initializing from seed data:', e);
    }
  }

  // Initialize fresh from seedData.json
  const initialDb: DatabaseSchema = {
    routes: seedData.routes || [],
    stops: seedData.stops || [],
    route_stops: seedData.route_stops || [],
    conductors: seedData.conductors || [],
    buses: (seedData.buses || []).map((b: any) => ({
      ...b,
      current_occupancy: 0,
      crowd_status: 0 as CrowdStatusCode,
      occupancy_percentage: 0,
      status: 'idle'
    })),
    trips: [],
    tickets: [],
    bus_locations: [],
    occupancy_history: []
  };

  // Seed sample active trips and initial locations along Chennai corridors so map is immediately lively
  initializeActiveTrips(initialDb);

  saveDatabase(initialDb);
  cachedDb = initialDb;
  return cachedDb;
}

function initializeActiveTrips(db: DatabaseSchema) {
  // Pre-activate Bus 5701 (570) and Bus 2101 (21G) with sample occupancy to showcase live tracking
  const bus570 = db.buses.find(b => b.bus_number === '5701');
  if (bus570) {
    const routeStops = db.route_stops.filter(rs => rs.route_id === bus570.route_id);
    const startStop = routeStops[0] || { stop_id: 'sample', stop_name: 'M.G.R.KOYAMBEDU', latitude: 13.06918, longitude: 80.20572 };
    
    const tripId = 'trip-570-init';
    const trip: Trip = {
      id: tripId,
      bus_id: bus570.id,
      route_id: bus570.route_id,
      conductor_id: bus570.conductor_id,
      start_stop_id: startStop.stop_id,
      start_stop_name: startStop.stop_name,
      current_stop_id: routeStops[2]?.stop_id || startStop.stop_id,
      current_stop_name: routeStops[2]?.stop_name || 'VADAPALANI',
      start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      status: 'active'
    };
    db.trips.push(trip);

    bus570.status = 'active';
    bus570.current_occupancy = 38; // 38 / 60 = 63% -> Normal Crowd (Yellow)
    const crowd = getCrowdInfo(38, bus570.capacity);
    bus570.crowd_status = crowd.status;
    bus570.occupancy_percentage = crowd.percentage;
    bus570.current_trip = trip;

    // Location at Ashok Pillar / Vadapalani
    const loc: BusLocation = {
      id: 'loc-570-init',
      bus_id: bus570.id,
      latitude: 13.0450,
      longitude: 80.2118,
      recorded_at: new Date().toISOString(),
      speed: 28
    };
    db.bus_locations.push(loc);
    bus570.current_location = loc;

    // Initial occupancy history
    db.occupancy_history.push({
      id: 'occ-570-init',
      bus_id: bus570.id,
      trip_id: tripId,
      occupancy: 38,
      crowd_status: crowd.status,
      recorded_at: new Date().toISOString(),
      trigger_event: 'trip_start',
      notes: 'Initial active trip simulated'
    });
  }

  const bus21G = db.buses.find(b => b.bus_number === '2101');
  if (bus21G) {
    const routeStops = db.route_stops.filter(rs => rs.route_id === bus21G.route_id);
    const startStop = routeStops[0] || { stop_id: 'sample', stop_name: 'ISLAND GROUND', latitude: 13.07632, longitude: 80.28312 };
    
    const tripId = 'trip-21g-init';
    const trip: Trip = {
      id: tripId,
      bus_id: bus21G.id,
      route_id: bus21G.route_id,
      conductor_id: bus21G.conductor_id,
      start_stop_id: startStop.stop_id,
      start_stop_name: startStop.stop_name,
      current_stop_id: routeStops[4]?.stop_id || startStop.stop_id,
      current_stop_name: routeStops[4]?.stop_name || 'TEYNAMPET',
      start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'active'
    };
    db.trips.push(trip);

    bus21G.status = 'active';
    bus21G.current_occupancy = 46; // 46 / 50 = 92% -> Overcrowded (Red)
    const crowd = getCrowdInfo(46, bus21G.capacity);
    bus21G.crowd_status = crowd.status;
    bus21G.occupancy_percentage = crowd.percentage;
    bus21G.current_trip = trip;

    const loc: BusLocation = {
      id: 'loc-21g-init',
      bus_id: bus21G.id,
      latitude: 13.04015,
      longitude: 80.24430,
      recorded_at: new Date().toISOString(),
      speed: 22
    };
    db.bus_locations.push(loc);
    bus21G.current_location = loc;

    db.occupancy_history.push({
      id: 'occ-21g-init',
      bus_id: bus21G.id,
      trip_id: tripId,
      occupancy: 46,
      crowd_status: crowd.status,
      recorded_at: new Date().toISOString(),
      trigger_event: 'ticket_booked',
      notes: 'Peak rush ticket booked'
    });
  }

  // Bus 0051 (5E) at Adyar / Besant Nagar (Empty - Green)
  const bus5E = db.buses.find(b => b.bus_number === '0051');
  if (bus5E) {
    const routeStops = db.route_stops.filter(rs => rs.route_id === bus5E.route_id);
    const startStop = routeStops[0];
    const tripId = 'trip-5e-init';
    const trip: Trip = {
      id: tripId,
      bus_id: bus5E.id,
      route_id: bus5E.route_id,
      conductor_id: bus5E.conductor_id,
      start_stop_id: startStop?.stop_id || 's1',
      start_stop_name: startStop?.stop_name || 'VADAPALANI',
      current_stop_id: routeStops[6]?.stop_id || 's2',
      current_stop_name: routeStops[6]?.stop_name || 'ADYAR B.T',
      start_time: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      status: 'active'
    };
    db.trips.push(trip);
    bus5E.status = 'active';
    bus5E.current_occupancy = 12; // 12 / 70 = 17% -> Empty (Green)
    const crowd = getCrowdInfo(12, bus5E.capacity);
    bus5E.crowd_status = crowd.status;
    bus5E.occupancy_percentage = crowd.percentage;
    bus5E.current_trip = trip;

    const loc: BusLocation = {
      id: 'loc-5e-init',
      bus_id: bus5E.id,
      latitude: 13.00642,
      longitude: 80.25712,
      recorded_at: new Date().toISOString(),
      speed: 35
    };
    db.bus_locations.push(loc);
    bus5E.current_location = loc;

    db.occupancy_history.push({
      id: 'occ-5e-init',
      bus_id: bus5E.id,
      trip_id: tripId,
      occupancy: 12,
      crowd_status: crowd.status,
      recorded_at: new Date().toISOString(),
      trigger_event: 'trip_start'
    });
  }
}

function saveDatabase(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    cachedDb = db;
  } catch (e) {
    console.error('Failed to write to db.json:', e);
  }
}

// Calculate Haversine distance in KM
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class BusRepository {
  static getDatabase(): DatabaseSchema {
    return loadDatabase();
  }

  static resetDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    cachedDb = null;
    return loadDatabase();
  }

  // --- CONDUCTORS ---
  static authenticateConductor(username: string, password: string): Conductor | null {
    const db = loadDatabase();
    const conductor = db.conductors.find(
      c => c.username.toLowerCase() === username.toLowerCase().trim() && c.password === password.trim()
    );
    if (!conductor) return null;
    return conductor;
  }

  static getConductorById(id: string): Conductor | null {
    const db = loadDatabase();
    return db.conductors.find(c => c.id === id) || null;
  }

  // --- BUSES ---
  static getAllBuses(): Bus[] {
    const db = loadDatabase();
    return db.buses.map(b => {
      const activeTrip = db.trips.find(t => t.bus_id === b.id && t.status === 'active') || null;
      const latestLoc = db.bus_locations
        .filter(l => l.bus_id === b.id)
        .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0] || null;

      const crowd = getCrowdInfo(b.current_occupancy, b.capacity);
      return {
        ...b,
        current_trip: activeTrip,
        current_location: latestLoc,
        crowd_status: crowd.status,
        occupancy_percentage: crowd.percentage
      };
    });
  }

  static getBusById(id: string): Bus | null {
    const buses = this.getAllBuses();
    return buses.find(b => b.id === id || b.bus_number === id) || null;
  }

  // --- ROUTES & STOPS ---
  static getAllRoutes(): Route[] {
    const db = loadDatabase();
    return db.routes;
  }

  static getRouteStops(routeId: string): RouteStop[] {
    const db = loadDatabase();
    return db.route_stops
      .filter(rs => rs.route_id === routeId)
      .sort((a, b) => a.stop_sequence - b.stop_sequence);
  }

  static getAllStops(): Stop[] {
    const db = loadDatabase();
    return db.stops;
  }

  // --- TRIPS ---
  static startTrip(busId: string, startStopId: string): Trip {
    const db = loadDatabase();
    const bus = db.buses.find(b => b.id === busId || b.bus_number === busId);
    if (!bus) throw new Error('Bus not found');

    // End previous active trip if any
    db.trips.forEach(t => {
      if (t.bus_id === bus.id && t.status === 'active') {
        t.status = 'completed';
        t.end_time = new Date().toISOString();
      }
    });

    const routeStops = this.getRouteStops(bus.route_id);
    const startStop = routeStops.find(rs => rs.stop_id === startStopId) ||
      db.stops.find(s => s.id === startStopId) ||
      routeStops[0];

    const trip: Trip = {
      id: uuidv4(),
      bus_id: bus.id,
      route_id: bus.route_id,
      conductor_id: bus.conductor_id,
      start_stop_id: startStopId,
      start_stop_name: startStop?.stop_name || 'Starting Stop',
      current_stop_id: startStopId,
      current_stop_name: startStop?.stop_name || 'Starting Stop',
      start_time: new Date().toISOString(),
      status: 'active'
    };

    db.trips.push(trip);

    // Reset occupancy for new trip
    bus.status = 'active';
    bus.current_occupancy = 0;
    const crowd = getCrowdInfo(0, bus.capacity);
    bus.crowd_status = crowd.status;
    bus.occupancy_percentage = crowd.percentage;
    bus.current_trip = trip;

    // Set initial location from starting stop
    if (startStop?.latitude && startStop?.longitude) {
      const loc: BusLocation = {
        id: uuidv4(),
        bus_id: bus.id,
        latitude: startStop.latitude,
        longitude: startStop.longitude,
        recorded_at: new Date().toISOString(),
        speed: 0
      };
      db.bus_locations.push(loc);
      bus.current_location = loc;
      RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
        location: { latitude: loc.latitude, longitude: loc.longitude, timestamp: loc.recorded_at }
      });
    }

    // Log to occupancy_history
    const historyEntry: OccupancyHistory = {
      id: uuidv4(),
      bus_id: bus.id,
      trip_id: trip.id,
      occupancy: 0,
      crowd_status: crowd.status,
      recorded_at: new Date().toISOString(),
      trigger_event: 'trip_start',
      notes: `Trip started at ${startStop?.stop_name}`
    };
    db.occupancy_history.push(historyEntry);

    saveDatabase(db);

    // Sync Redis
    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      occupancy: 0,
      crowd_status: crowd.status
    });

    return trip;
  }

  static endTrip(busId: string): Trip | null {
    const db = loadDatabase();
    const bus = db.buses.find(b => b.id === busId || b.bus_number === busId);
    if (!bus) return null;

    const trip = db.trips.find(t => t.bus_id === bus.id && t.status === 'active');
    if (trip) {
      trip.status = 'completed';
      trip.end_time = new Date().toISOString();
    }

    bus.status = 'idle';
    bus.current_trip = null;

    saveDatabase(db);
    return trip || null;
  }

  // --- TICKETING ---
  static issueTicket(params: {
    bus_id: string;
    source_stop_id: string;
    destination_stop_id: string;
    gender: 'Male' | 'Female';
    booked_by: 'conductor' | 'passenger';
    payment_mode: 'Cash' | 'Razorpay' | 'Free';
    passenger_phone?: string;
  }): Ticket {
    const db = loadDatabase();
    const bus = db.buses.find(b => b.id === params.bus_id || b.bus_number === params.bus_id);
    if (!bus) throw new Error('Bus not found');

    const activeTrip = db.trips.find(t => t.bus_id === bus.id && t.status === 'active');
    if (!activeTrip && params.booked_by === 'conductor') {
      throw new Error('Cannot issue ticket: Trip has not been started yet.');
    }

    const tripId = activeTrip?.id || `trip-adhoc-${bus.id}`;

    const sourceStop = db.stops.find(s => s.id === params.source_stop_id);
    const destStop = db.stops.find(s => s.id === params.destination_stop_id);

    // Fare calculation
    // TN Vidiyal Payanam Scheme: Free travel simulation for women!
    let fare = 0;
    if (params.gender === 'Female') {
      fare = 0.00;
    } else {
      // Male passengers charged base fare
      const routeStops = this.getRouteStops(bus.route_id);
      const srcIdx = routeStops.findIndex(rs => rs.stop_id === params.source_stop_id);
      const dstIdx = routeStops.findIndex(rs => rs.stop_id === params.destination_stop_id);
      const stopDistance = Math.max(1, Math.abs(dstIdx - srcIdx));
      fare = APP_CONFIG.fare.baseFareMale + (stopDistance - 1) * APP_CONFIG.fare.perStopFare;
    }

    // Increase occupancy
    bus.current_occupancy = Math.min(bus.capacity, bus.current_occupancy + 1);
    const crowd = getCrowdInfo(bus.current_occupancy, bus.capacity);
    bus.crowd_status = crowd.status;
    bus.occupancy_percentage = crowd.percentage;

    const ticket: Ticket = {
      id: uuidv4(),
      trip_id: tripId,
      bus_id: bus.id,
      bus_number: bus.bus_number,
      passenger_phone: params.passenger_phone,
      source_stop_id: params.source_stop_id,
      source_stop_name: sourceStop?.stop_name || 'Source Stop',
      destination_stop_id: params.destination_stop_id,
      destination_stop_name: destStop?.stop_name || 'Destination Stop',
      gender: params.gender,
      fare,
      booked_by: params.booked_by,
      payment_mode: params.gender === 'Female' ? 'Free' : params.payment_mode,
      occupancy_snapshot: bus.current_occupancy,
      crowd_status: crowd.status,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    db.tickets.push(ticket);

    // CRITICAL REQUIREMENT: Record in occupancy_history for ML dataset
    const historyEntry: OccupancyHistory = {
      id: uuidv4(),
      bus_id: bus.id,
      trip_id: tripId,
      occupancy: bus.current_occupancy,
      crowd_status: crowd.status,
      recorded_at: ticket.created_at,
      trigger_event: 'ticket_booked',
      notes: `Ticket issued (${params.gender}, Fare ₹${fare}, ${params.booked_by})`
    };
    db.occupancy_history.push(historyEntry);

    saveDatabase(db);

    // Update Redis Cache
    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      occupancy: bus.current_occupancy,
      crowd_status: crowd.status
    });

    return ticket;
  }

  // --- PASSENGER EXIT / ENTRY LOGIC ---
  static recordPassengersExiting(busId: string, count: number = 1, currentStopName?: string): {
    current_occupancy: number;
    crowd_status: CrowdStatusCode;
  } {
    const db = loadDatabase();
    const bus = db.buses.find(b => b.id === busId || b.bus_number === busId);
    if (!bus) throw new Error('Bus not found');

    const activeTrip = db.trips.find(t => t.bus_id === bus.id && t.status === 'active');
    bus.current_occupancy = Math.max(0, bus.current_occupancy - count);
    const crowd = getCrowdInfo(bus.current_occupancy, bus.capacity);
    bus.crowd_status = crowd.status;
    bus.occupancy_percentage = crowd.percentage;

    // Record in occupancy_history
    const historyEntry: OccupancyHistory = {
      id: uuidv4(),
      bus_id: bus.id,
      trip_id: activeTrip?.id,
      occupancy: bus.current_occupancy,
      crowd_status: crowd.status,
      recorded_at: new Date().toISOString(),
      trigger_event: 'passenger_exit',
      notes: `${count} passenger(s) exited${currentStopName ? ` at ${currentStopName}` : ''}`
    };
    db.occupancy_history.push(historyEntry);

    saveDatabase(db);

    // Sync Redis
    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      occupancy: bus.current_occupancy,
      crowd_status: crowd.status
    });

    return {
      current_occupancy: bus.current_occupancy,
      crowd_status: crowd.status
    };
  }

  static recordPassengersEntering(busId: string, count: number = 1): {
    current_occupancy: number;
    crowd_status: CrowdStatusCode;
  } {
    const db = loadDatabase();
    const bus = db.buses.find(b => b.id === busId || b.bus_number === busId);
    if (!bus) throw new Error('Bus not found');

    const activeTrip = db.trips.find(t => t.bus_id === bus.id && t.status === 'active');
    bus.current_occupancy = Math.min(bus.capacity, bus.current_occupancy + count);
    const crowd = getCrowdInfo(bus.current_occupancy, bus.capacity);
    bus.crowd_status = crowd.status;
    bus.occupancy_percentage = crowd.percentage;

    // Record in occupancy_history
    const historyEntry: OccupancyHistory = {
      id: uuidv4(),
      bus_id: bus.id,
      trip_id: activeTrip?.id,
      occupancy: bus.current_occupancy,
      crowd_status: crowd.status,
      recorded_at: new Date().toISOString(),
      trigger_event: 'passenger_entry',
      notes: `${count} passenger(s) entered (manual board)`
    };
    db.occupancy_history.push(historyEntry);

    saveDatabase(db);

    // Sync Redis
    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      occupancy: bus.current_occupancy,
      crowd_status: crowd.status
    });

    return {
      current_occupancy: bus.current_occupancy,
      crowd_status: crowd.status
    };
  }

  // --- GPS LOCATION UPDATES (Periodically every 30s) ---
  static updateBusLocation(busId: string, latitude: number, longitude: number, speed: number = 25): BusLocation {
    const db = loadDatabase();
    const bus = db.buses.find(b => b.id === busId || b.bus_number === busId);
    if (!bus) throw new Error('Bus not found');

    const loc: BusLocation = {
      id: uuidv4(),
      bus_id: bus.id,
      latitude,
      longitude,
      recorded_at: new Date().toISOString(),
      speed
    };

    db.bus_locations.push(loc);
    bus.current_location = loc;

    saveDatabase(db);

    // Store in Redis matching: bus:BUS001:location
    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      location: { latitude, longitude, timestamp: loc.recorded_at }
    });

    return loc;
  }

  // --- NEARBY BUS DISCOVERY (Haversine 5 KM radius) ---
  static getNearbyBuses(userLat: number, userLon: number, radiusKm: number = APP_CONFIG.map.nearbyRadiusKm): Bus[] {
    const allBuses = this.getAllBuses();
    const results: Bus[] = [];

    for (const bus of allBuses) {
      if (bus.status !== 'active' || !bus.current_location) continue;

      const dist = calculateDistanceKm(
        userLat,
        userLon,
        bus.current_location.latitude,
        bus.current_location.longitude
      );

      if (dist <= radiusKm) {
        results.push({
          ...bus,
          distance_km: dist
        });
      }
    }

    return results.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  }

  // --- OCCUPANCY HISTORY FOR ML PREDICTION DATASET ---
  static getOccupancyHistory(busId?: string, limit: number = 200): OccupancyHistory[] {
    const db = loadDatabase();
    let history = [...db.occupancy_history];
    if (busId) {
      history = history.filter(h => h.bus_id === busId);
    }
    return history
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
      .slice(0, limit);
  }

  // --- ADMIN ANALYTICS ---
  static getAdminAnalytics() {
    const db = loadDatabase();
    const allBuses = this.getAllBuses();
    const activeBuses = allBuses.filter(b => b.status === 'active');

    const totalTickets = db.tickets.length;
    let ticketRevenue = 0;
    let femaleFreeTickets = 0;
    let malePaidTickets = 0;

    db.tickets.forEach(t => {
      ticketRevenue += Number(t.fare) || 0;
      if (t.gender === 'Female') {
        femaleFreeTickets += 1;
      } else {
        malePaidTickets += 1;
      }
    });

    // Crowd distribution
    const crowdDistribution = {
      empty: 0,
      normal: 0,
      crowded: 0
    };

    activeBuses.forEach(b => {
      if (b.crowd_status === 0) crowdDistribution.empty++;
      else if (b.crowd_status === 1) crowdDistribution.normal++;
      else crowdDistribution.crowded++;
    });

    const recentOccupancyHistory = this.getOccupancyHistory(undefined, 50);

    return {
      totalBuses: allBuses.length,
      totalActiveBuses: activeBuses.length,
      totalTickets,
      ticketRevenue,
      femaleFreeTickets,
      malePaidTickets,
      crowdDistribution,
      buses: allBuses,
      recentTickets: db.tickets.slice(-20).reverse(),
      recentOccupancyHistory,
      conductors: db.conductors
    };
  }
}
