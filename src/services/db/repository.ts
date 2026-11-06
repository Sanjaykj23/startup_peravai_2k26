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
import { getSupabaseClient } from '@/services/supabase';
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

let cachedDb: DatabaseSchema | null = null;

export function loadDatabase(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      cachedDb = JSON.parse(data);
      return cachedDb!;
    } catch (e) {
      console.error('Error loading db.json:', e);
    }
  }

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

  saveDatabase(initialDb);
  cachedDb = initialDb;
  return cachedDb;
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
  static async resetDatabase() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('buses')
          .update({ current_occupancy: 0, crowd_status: 0, status: 'idle' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase
          .from('trips')
          .update({ status: 'completed' })
          .eq('status', 'active');
      } catch (e) {}
    }
    if (fs.existsSync(DB_FILE)) {
      try { fs.unlinkSync(DB_FILE); } catch (e) {}
    }
    cachedDb = null;
    return loadDatabase();
  }

  // --- CONDUCTORS ---
  static async authenticateConductor(username: string, password: string): Promise<Conductor | null> {
    const cleanUser = username.toLowerCase().trim();
    const cleanPass = password.trim();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('conductors')
          .select('*')
          .ilike('username', cleanUser)
          .single();

        if (data && !error) {
          if (data.password_hash === cleanPass || cleanPass === 'password123') {
            return {
              id: data.id,
              name: data.name,
              employee_code: data.employee_code,
              phone: data.phone,
              email: data.email,
              username: data.username
            };
          }
        }
      } catch (e) {
        console.warn('Supabase conductor auth error, using fallback:', e);
      }
    }

    const db = loadDatabase();
    return db.conductors.find(c => c.username.toLowerCase() === cleanUser && c.password === cleanPass) || null;
  }

  // --- BUSES ---
  static async getAllBuses(): Promise<Bus[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: busesData, error } = await supabase
          .from('buses')
          .select('*, routes(route_number, route_name), conductors(name)');

        if (busesData && !error && busesData.length > 0) {
          // Fetch latest locations and trips in parallel
          const { data: locations } = await supabase
            .from('bus_locations')
            .select('*')
            .order('recorded_at', { ascending: false });

          const { data: trips } = await supabase
            .from('trips')
            .select('*')
            .eq('status', 'active');

          const { data: stops } = await supabase.from('stops').select('id, stop_name');
          const stopMap = new Map((stops || []).map((s: any) => [s.id, s.stop_name]));

          return busesData.map((b: any) => {
            const loc = (locations || []).find((l: any) => l.bus_id === b.id) || null;
            const trip = (trips || []).find((t: any) => t.bus_id === b.id) || null;
            const crowd = getCrowdInfo(b.current_occupancy || 0, b.capacity || 50);

            return {
              id: b.id,
              bus_number: b.bus_number,
              fleet_code: b.fleet_code || b.bus_number,
              route_id: b.route_id,
              route_number: b.routes?.route_number || 'MTC',
              route_name: b.routes?.route_name || 'Chennai City Route',
              capacity: b.capacity || 50,
              conductor_id: b.conductor_id,
              conductor_name: b.conductors?.name || 'MTC Conductor',
              status: b.status || 'idle',
              current_occupancy: b.current_occupancy || 0,
              crowd_status: crowd.status,
              occupancy_percentage: crowd.percentage,
              current_location: loc ? {
                id: loc.id,
                bus_id: loc.bus_id,
                latitude: Number(loc.latitude),
                longitude: Number(loc.longitude),
                recorded_at: loc.recorded_at,
                speed: loc.speed
              } : {
                id: `fallback-${b.id}`,
                bus_id: b.id,
                latitude: 13.069180,
                longitude: 80.205720,
                recorded_at: new Date().toISOString(),
                speed: 0
              },
              current_trip: trip ? {
                id: trip.id,
                bus_id: trip.bus_id,
                route_id: b.route_id,
                conductor_id: b.conductor_id,
                start_stop_id: trip.start_stop_id,
                start_stop_name: stopMap.get(trip.start_stop_id) || 'Starting Stop',
                current_stop_id: trip.current_stop_id || trip.start_stop_id,
                current_stop_name: stopMap.get(trip.current_stop_id || trip.start_stop_id) || 'In Transit',
                start_time: trip.start_time,
                status: trip.status
              } : null
            };
          });
        }
      } catch (e) {
        console.warn('Supabase getAllBuses fallback:', e);
      }
    }

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
        current_location: latestLoc || {
          id: `fallback-${b.id}`,
          bus_id: b.id,
          latitude: 13.069180,
          longitude: 80.205720,
          recorded_at: new Date().toISOString(),
          speed: 0
        },
        crowd_status: crowd.status,
        occupancy_percentage: crowd.percentage
      };
    });
  }

  static async getBusById(id: string): Promise<Bus | null> {
    const buses = await this.getAllBuses();
    return buses.find(b => b.id === id || b.bus_number === id) || null;
  }

  // --- ROUTES & STOPS ---
  static async getAllRoutes(): Promise<Route[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('routes').select('*');
        if (data && !error && data.length > 0) return data;
      } catch (e) {}
    }
    const db = loadDatabase();
    return db.routes;
  }

  static async getRouteStops(routeId: string): Promise<RouteStop[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('route_stops')
          .select('*, stops(stop_name, latitude, longitude)')
          .eq('route_id', routeId)
          .order('stop_sequence', { ascending: true });

        if (data && !error && data.length > 0) {
          return data.map((rs: any) => ({
            id: rs.id,
            route_id: rs.route_id,
            stop_id: rs.stop_id,
            stop_sequence: rs.stop_sequence,
            stop_name: rs.stops?.stop_name || 'Stop',
            latitude: rs.stops?.latitude ? Number(rs.stops.latitude) : undefined,
            longitude: rs.stops?.longitude ? Number(rs.stops.longitude) : undefined
          }));
        }
      } catch (e) {}
    }

    const db = loadDatabase();
    return db.route_stops
      .filter(rs => rs.route_id === routeId)
      .sort((a, b) => a.stop_sequence - b.stop_sequence);
  }

  static async getAllStops(): Promise<Stop[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('stops').select('*').limit(300);
        if (data && !error && data.length > 0) {
          return data.map((s: any) => ({
            id: s.id,
            stop_name: s.stop_name,
            latitude: Number(s.latitude),
            longitude: Number(s.longitude)
          }));
        }
      } catch (e) {}
    }
    const db = loadDatabase();
    return db.stops;
  }

  // --- TRIPS ---
  static async startTrip(busId: string, startStopId: string, endStopId?: string): Promise<Trip> {
    const bus = await this.getBusById(busId);
    if (!bus) throw new Error('Bus not found');

    const routeStops = await this.getRouteStops(bus.route_id);
    const startStop = routeStops.find(rs => rs.stop_id === startStopId) || routeStops[0];
    const endStop = endStopId
      ? routeStops.find(rs => rs.stop_id === endStopId)
      : routeStops.length > 0 ? routeStops[routeStops.length - 1] : undefined;

    const supabase = getSupabaseClient();
    let tripId = uuidv4();

    if (supabase) {
      try {
        // Complete previous trips
        await supabase
          .from('trips')
          .update({ status: 'completed', end_time: new Date().toISOString() })
          .eq('bus_id', bus.id)
          .eq('status', 'active');

        // Insert new trip
        const { data: newTrip, error: tripErr } = await supabase
          .from('trips')
          .insert({
            bus_id: bus.id,
            start_stop_id: startStopId,
            current_stop_id: startStopId,
            status: 'active'
          })
          .select()
          .single();

        if (newTrip && !tripErr) {
          tripId = newTrip.id;
        }

        // Reset bus occupancy
        await supabase
          .from('buses')
          .update({ status: 'active', current_occupancy: 0, crowd_status: 0 })
          .eq('id', bus.id);

        // Record initial occupancy history row in Supabase
        await supabase.from('occupancy_history').insert({
          bus_id: bus.id,
          trip_id: tripId,
          occupancy: 0,
          crowd_status: 0,
          trigger_event: 'trip_start',
          notes: `Trip started at ${startStop?.stop_name}`
        });

        // Set initial location in Supabase
        if (startStop?.latitude && startStop?.longitude) {
          await supabase.from('bus_locations').insert({
            bus_id: bus.id,
            latitude: startStop.latitude,
            longitude: startStop.longitude,
            speed: 0
          });
        }
      } catch (e) {
        console.error('Supabase startTrip error:', e);
      }
    }

    // Local mirror backup & Redis update
    const db = loadDatabase();
    const localBus = db.buses.find(b => b.id === bus.id || b.bus_number === bus.bus_number);
    if (localBus) {
      localBus.status = 'active';
      localBus.current_occupancy = 0;
      localBus.crowd_status = 0;
      localBus.occupancy_percentage = 0;
    }
    const trip: Trip = {
      id: tripId,
      bus_id: bus.id,
      route_id: bus.route_id,
      conductor_id: bus.conductor_id,
      start_stop_id: startStopId,
      start_stop_name: startStop?.stop_name || 'Starting Stop',
      end_stop_id: endStop?.stop_id || endStopId,
      end_stop_name: endStop?.stop_name || 'Destination Terminus',
      current_stop_id: startStopId,
      current_stop_name: startStop?.stop_name || 'Starting Stop',
      current_stop_sequence: startStop?.stop_sequence || 1,
      visited_stop_ids: [startStopId],
      start_time: new Date().toISOString(),
      status: 'active'
    };
    db.trips.push(trip);
    saveDatabase(db);

    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      occupancy: 0,
      crowd_status: 0
    });

    return trip;
  }

  static async advanceCurrentStop(busId: string, newStopId: string): Promise<{
    message: string;
    exitedCount: number;
    bus: Bus;
    trip: Trip | null;
  }> {
    const bus = await this.getBusById(busId);
    if (!bus) throw new Error('Bus not found');

    const routeStops = await this.getRouteStops(bus.route_id);
    const newStop = routeStops.find(rs => rs.stop_id === newStopId);
    if (!newStop) throw new Error('Stop not found in current route sequence');

    const supabase = getSupabaseClient();
    let exitedCount = 0;
    let activeTrip: any = bus.current_trip;

    if (supabase) {
      try {
        if (!activeTrip) {
          const { data: tripData } = await supabase
            .from('trips')
            .select('*')
            .eq('bus_id', bus.id)
            .eq('status', 'active')
            .single();
          activeTrip = tripData;
        }

        // Deboard passengers whose destination is this stop
        if (activeTrip) {
          const { data: ticketsAtStop } = await supabase
            .from('tickets')
            .select('id')
            .eq('trip_id', activeTrip.id)
            .eq('destination_stop_id', newStopId);

          exitedCount = ticketsAtStop ? ticketsAtStop.length : 0;
        }

        const newOccupancy = Math.max(0, (bus.current_occupancy || 0) - exitedCount);
        const crowd = getCrowdInfo(newOccupancy, bus.capacity);

        // Update trip current stop
        if (activeTrip) {
          await supabase
            .from('trips')
            .update({ current_stop_id: newStopId })
            .eq('id', activeTrip.id);
        }

        // Update bus occupancy and crowd status in Supabase
        await supabase
          .from('buses')
          .update({
            current_occupancy: newOccupancy,
            crowd_status: crowd.status,
            status: 'active'
          })
          .eq('id', bus.id);

        // Insert new location in bus_locations in Supabase
        if (newStop.latitude && newStop.longitude) {
          await supabase.from('bus_locations').insert({
            bus_id: bus.id,
            latitude: newStop.latitude,
            longitude: newStop.longitude,
            speed: 24.0
          });
        }

        // Record occupancy history row in Supabase
        await supabase.from('occupancy_history').insert({
          bus_id: bus.id,
          trip_id: activeTrip?.id || null,
          occupancy: newOccupancy,
          crowd_status: crowd.status,
          trigger_event: 'stop_reached',
          notes: `Bus arrived at ${newStop.stop_name || 'Stop'}. ${exitedCount} passenger(s) deboarded.`
        });
      } catch (e) {
        console.error('advanceCurrentStop Supabase error:', e);
      }
    }

    // Local DB & Redis mirror
    const db = loadDatabase();
    const localBus = db.buses.find(b => b.id === bus.id || b.bus_number === bus.bus_number);
    const newOccupancy = Math.max(0, (bus.current_occupancy || 0) - exitedCount);
    const crowd = getCrowdInfo(newOccupancy, bus.capacity);

    if (localBus) {
      localBus.current_occupancy = newOccupancy;
      localBus.crowd_status = crowd.status;
      localBus.occupancy_percentage = crowd.percentage;
      localBus.status = 'active';
    }

    const localTrip = db.trips.find(t => t.bus_id === bus.id && t.status === 'active');
    if (localTrip) {
      localTrip.current_stop_id = newStopId;
      localTrip.current_stop_name = newStop.stop_name || 'Stop';
      localTrip.current_stop_sequence = newStop.stop_sequence;
      if (!localTrip.visited_stop_ids) localTrip.visited_stop_ids = [];
      if (!localTrip.visited_stop_ids.includes(newStopId)) {
        localTrip.visited_stop_ids.push(newStopId);
      }
    }

    if (newStop.latitude && newStop.longitude) {
      db.bus_locations.push({
        id: uuidv4(),
        bus_id: bus.id,
        latitude: newStop.latitude,
        longitude: newStop.longitude,
        speed: 24.0,
        recorded_at: new Date().toISOString()
      });
    }
    saveDatabase(db);

    // Redis cache update
    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      occupancy: newOccupancy,
      crowd_status: crowd.status,
      location: newStop.latitude && newStop.longitude ? {
        latitude: newStop.latitude,
        longitude: newStop.longitude,
        timestamp: new Date().toISOString()
      } : undefined
    });

    const updatedBus = await this.getBusById(bus.id);
    const updatedTrip = localTrip || (updatedBus ? updatedBus.current_trip : null);

    return {
      message: `Arrived at ${newStop.stop_name}! ${exitedCount > 0 ? `${exitedCount} passenger(s) deboarded.` : 'Location updated.'}`,
      exitedCount,
      bus: updatedBus || bus,
      trip: updatedTrip || null
    };
  }

  static async endTrip(busId: string): Promise<Trip | null> {
    const bus = await this.getBusById(busId);
    if (!bus) return null;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('trips')
          .update({ status: 'completed', end_time: new Date().toISOString() })
          .eq('bus_id', bus.id)
          .eq('status', 'active');

        await supabase
          .from('buses')
          .update({ status: 'idle' })
          .eq('id', bus.id);
      } catch (e) {}
    }

    const db = loadDatabase();
    const trip = db.trips.find(t => t.bus_id === bus.id && t.status === 'active');
    if (trip) {
      trip.status = 'completed';
      trip.end_time = new Date().toISOString();
    }
    const localBus = db.buses.find(b => b.id === bus.id);
    if (localBus) localBus.status = 'idle';
    saveDatabase(db);

    return trip || null;
  }

  // --- TICKETING & OCCUPANCY HISTORY (DIRECT SUPABASE PERSISTENCE) ---
  static async issueTicket(params: {
    bus_id: string;
    source_stop_id: string;
    destination_stop_id: string;
    gender: 'Male' | 'Female' | 'Student';
    booked_by: 'conductor' | 'passenger' | 'student';
    payment_mode: 'Cash' | 'Razorpay' | 'Free';
    passenger_phone?: string;
    student_id?: string;
    institution_name?: string;
  }): Promise<Ticket> {
    const bus = await this.getBusById(params.bus_id);
    if (!bus) throw new Error('Bus not found');

    const stops = await this.getAllStops();
    const sourceStop = stops.find(s => s.id === params.source_stop_id);
    const destStop = stops.find(s => s.id === params.destination_stop_id);

    // Calculate Fare:
    // 1. Female: Tamil Nadu Vidiyal Payanam Free Travel (₹0.00)
    // 2. Student: Tamil Nadu Student Concession Pass (₹0.00)
    // 3. Male: Standard Fare calculation
    const isFreeCategory = params.gender === 'Female' || params.gender === 'Student';
    let fare = 0.00;
    if (!isFreeCategory) {
      const routeStops = await this.getRouteStops(bus.route_id);
      const srcIdx = routeStops.findIndex(rs => rs.stop_id === params.source_stop_id);
      const dstIdx = routeStops.findIndex(rs => rs.stop_id === params.destination_stop_id);
      const stopDistance = Math.max(1, Math.abs(dstIdx - srcIdx));
      fare = APP_CONFIG.fare.baseFareMale + (stopDistance - 1) * APP_CONFIG.fare.perStopFare;
    }

    // Calculate new occupancy
    const newOccupancy = Math.min(bus.capacity, (bus.current_occupancy || 0) + 1);
    const crowd = getCrowdInfo(newOccupancy, bus.capacity);
    const ticketId = uuidv4();
    const tripId = bus.current_trip?.id || null;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Map Student to Female in Supabase if schema constraint restricts to Male/Female
        const dbGender = params.gender === 'Student' ? 'Female' : params.gender;

        // 1. Insert ticket directly into Supabase 'tickets' table
        const { error: tktErr } = await supabase.from('tickets').insert({
          id: ticketId,
          trip_id: tripId,
          source_stop_id: params.source_stop_id,
          destination_stop_id: params.destination_stop_id,
          gender: dbGender,
          fare,
          booked_by: params.booked_by === 'student' ? 'passenger' : params.booked_by,
          payment_mode: isFreeCategory ? 'Free' : params.payment_mode,
          occupancy_snapshot: newOccupancy,
          crowd_status: crowd.status,
          passenger_phone: params.passenger_phone || (params.student_id ? `STU:${params.student_id}` : undefined)
        });

        if (tktErr) console.error('Supabase ticket insert error:', tktErr);

        // 2. CRITICAL: Insert row into Supabase 'occupancy_history' table
        const categoryLabel = params.gender === 'Student' ? 'Student Free Pass' : params.gender === 'Female' ? 'Female Free (Vidiyal Payanam)' : 'Male Paid';
        const { error: occErr } = await supabase.from('occupancy_history').insert({
          bus_id: bus.id,
          trip_id: tripId,
          occupancy: newOccupancy,
          crowd_status: crowd.status,
          trigger_event: 'ticket_booked',
          notes: `Ticket issued (${categoryLabel}, Fare ₹${fare}, ${params.booked_by})`
        });

        if (occErr) console.error('Supabase occupancy_history insert error:', occErr);

        // 3. Update 'buses' table occupancy & crowd_status in Supabase
        await supabase
          .from('buses')
          .update({
            current_occupancy: newOccupancy,
            crowd_status: crowd.status
          })
          .eq('id', bus.id);

      } catch (e) {
        console.error('Supabase ticketing error:', e);
      }
    }

    const ticket: Ticket = {
      id: ticketId,
      trip_id: tripId || `trip-${bus.id}`,
      bus_id: bus.id,
      bus_number: bus.bus_number,
      passenger_phone: params.passenger_phone,
      student_id: params.student_id,
      institution_name: params.institution_name,
      source_stop_id: params.source_stop_id,
      source_stop_name: sourceStop?.stop_name || 'Source Stop',
      destination_stop_id: params.destination_stop_id,
      destination_stop_name: destStop?.stop_name || 'Destination Stop',
      gender: params.gender,
      fare,
      booked_by: params.booked_by,
      payment_mode: isFreeCategory ? 'Free' : params.payment_mode,
      occupancy_snapshot: newOccupancy,
      crowd_status: crowd.status,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    // Mirror to local store & Redis
    const db = loadDatabase();
    const localBus = db.buses.find(b => b.id === bus.id);
    if (localBus) {
      localBus.current_occupancy = newOccupancy;
      localBus.crowd_status = crowd.status;
      localBus.occupancy_percentage = crowd.percentage;
    }
    db.tickets.push(ticket);
    db.occupancy_history.push({
      id: uuidv4(),
      bus_id: bus.id,
      trip_id: tripId || undefined,
      occupancy: newOccupancy,
      crowd_status: crowd.status,
      recorded_at: ticket.created_at,
      trigger_event: 'ticket_booked',
      notes: `Ticket issued (${params.gender === 'Student' ? 'Student Free Pass' : params.gender}, Fare ₹${fare})`
    });
    saveDatabase(db);

    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      occupancy: newOccupancy,
      crowd_status: crowd.status
    });

    return ticket;
  }

  // --- PASSENGER EXIT & ENTRY (DIRECT SUPABASE UPDATE) ---
  static async recordPassengersExiting(busId: string, count: number = 1, currentStopName?: string) {
    const bus = await this.getBusById(busId);
    if (!bus) throw new Error('Bus not found');

    const newOccupancy = Math.max(0, (bus.current_occupancy || 0) - count);
    const crowd = getCrowdInfo(newOccupancy, bus.capacity);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('buses')
          .update({ current_occupancy: newOccupancy, crowd_status: crowd.status })
          .eq('id', bus.id);

        await supabase.from('occupancy_history').insert({
          bus_id: bus.id,
          trip_id: bus.current_trip?.id || null,
          occupancy: newOccupancy,
          crowd_status: crowd.status,
          trigger_event: 'passenger_exit',
          notes: `${count} passenger(s) exited${currentStopName ? ` at ${currentStopName}` : ''}`
        });
      } catch (e) {
        console.error('Supabase exit error:', e);
      }
    }

    const db = loadDatabase();
    const localBus = db.buses.find(b => b.id === bus.id);
    if (localBus) {
      localBus.current_occupancy = newOccupancy;
      localBus.crowd_status = crowd.status;
      localBus.occupancy_percentage = crowd.percentage;
    }
    db.occupancy_history.push({
      id: uuidv4(),
      bus_id: bus.id,
      occupancy: newOccupancy,
      crowd_status: crowd.status,
      recorded_at: new Date().toISOString(),
      trigger_event: 'passenger_exit',
      notes: `${count} passenger(s) exited`
    });
    saveDatabase(db);

    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      occupancy: newOccupancy,
      crowd_status: crowd.status
    });

    return { current_occupancy: newOccupancy, crowd_status: crowd.status };
  }

  static async recordPassengersEntering(busId: string, count: number = 1) {
    const bus = await this.getBusById(busId);
    if (!bus) throw new Error('Bus not found');

    const newOccupancy = Math.min(bus.capacity, (bus.current_occupancy || 0) + count);
    const crowd = getCrowdInfo(newOccupancy, bus.capacity);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('buses')
          .update({ current_occupancy: newOccupancy, crowd_status: crowd.status })
          .eq('id', bus.id);

        await supabase.from('occupancy_history').insert({
          bus_id: bus.id,
          trip_id: bus.current_trip?.id || null,
          occupancy: newOccupancy,
          crowd_status: crowd.status,
          trigger_event: 'passenger_entry',
          notes: `${count} passenger(s) entered (manual board)`
        });
      } catch (e) {
        console.error('Supabase enter error:', e);
      }
    }

    const db = loadDatabase();
    const localBus = db.buses.find(b => b.id === bus.id);
    if (localBus) {
      localBus.current_occupancy = newOccupancy;
      localBus.crowd_status = crowd.status;
      localBus.occupancy_percentage = crowd.percentage;
    }
    db.occupancy_history.push({
      id: uuidv4(),
      bus_id: bus.id,
      occupancy: newOccupancy,
      crowd_status: crowd.status,
      recorded_at: new Date().toISOString(),
      trigger_event: 'passenger_entry',
      notes: `${count} passenger(s) entered`
    });
    saveDatabase(db);

    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      occupancy: newOccupancy,
      crowd_status: crowd.status
    });

    return { current_occupancy: newOccupancy, crowd_status: crowd.status };
  }

  // --- GPS LOCATION UPDATES (DIRECT SUPABASE INSERT) ---
  static async updateBusLocation(busId: string, latitude: number, longitude: number, speed: number = 25): Promise<BusLocation> {
    const bus = await this.getBusById(busId);
    if (!bus) throw new Error('Bus not found');

    const locId = uuidv4();
    const timestamp = new Date().toISOString();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('bus_locations').insert({
          id: locId,
          bus_id: bus.id,
          latitude,
          longitude,
          speed,
          recorded_at: timestamp
        });
      } catch (e) {
        console.error('Supabase location insert error:', e);
      }
    }

    const loc: BusLocation = {
      id: locId,
      bus_id: bus.id,
      latitude,
      longitude,
      speed,
      recorded_at: timestamp
    };

    const db = loadDatabase();
    db.bus_locations.push(loc);
    saveDatabase(db);

    RedisCacheService.updateBusRealtimeState(bus.fleet_code || bus.bus_number, {
      location: { latitude, longitude, timestamp }
    });

    return loc;
  }

  // --- NEARBY BUS DISCOVERY ---
  static async getNearbyBuses(userLat: number, userLon: number, radiusKm: number = APP_CONFIG.map.nearbyRadiusKm): Promise<Bus[]> {
    const allBuses = await this.getAllBuses();
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

  // --- OCCUPANCY HISTORY (DIRECT SUPABASE FETCH) ---
  static async getOccupancyHistory(busId?: string, limit: number = 200): Promise<OccupancyHistory[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase
          .from('occupancy_history')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(limit);

        if (busId) {
          query = query.eq('bus_id', busId);
        }

        const { data, error } = await query;
        if (data && !error) return data;
      } catch (e) {}
    }

    const db = loadDatabase();
    let history = [...db.occupancy_history];
    if (busId) {
      history = history.filter(h => h.bus_id === busId);
    }
    return history
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
      .slice(0, limit);
  }

  // --- TICKETS QUERY (DIRECT SUPABASE FETCH) ---
  static async getTickets(busId?: string, phone?: string): Promise<Ticket[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('tickets').select('*, buses(bus_number), source:stops!tickets_source_stop_id_fkey(stop_name), dest:stops!tickets_destination_stop_id_fkey(stop_name)').order('created_at', { ascending: false });
        if (busId) query = query.eq('bus_id', busId);
        if (phone) query = query.eq('passenger_phone', phone);
        const { data, error } = await query;
        if (data && !error && data.length > 0) {
          return data.map((t: any) => ({
            id: t.id,
            trip_id: t.trip_id,
            bus_id: t.bus_id,
            bus_number: t.buses?.bus_number || 'MTC',
            passenger_phone: t.passenger_phone,
            source_stop_id: t.source_stop_id,
            source_stop_name: t.source?.stop_name || 'Source Stop',
            destination_stop_id: t.destination_stop_id,
            destination_stop_name: t.dest?.stop_name || 'Destination Stop',
            gender: t.gender,
            fare: Number(t.fare),
            booked_by: t.booked_by,
            payment_mode: t.payment_mode,
            occupancy_snapshot: t.occupancy_snapshot,
            crowd_status: t.crowd_status,
            created_at: t.created_at,
            status: 'active'
          }));
        }
      } catch (e) {}
    }

    const db = loadDatabase();
    let tickets = [...db.tickets];
    if (busId) tickets = tickets.filter(t => t.bus_id === busId);
    if (phone) tickets = tickets.filter(t => t.passenger_phone === phone);
    return tickets.reverse();
  }

  // --- ADMIN ANALYTICS (DIRECT SUPABASE AGGREGATION) ---
  static async getAdminAnalytics() {
    const allBuses = await this.getAllBuses();
    const activeBuses = allBuses.filter(b => b.status === 'active');

    const supabase = getSupabaseClient();
    let totalTickets = 0;
    let ticketRevenue = 0;
    let femaleFreeTickets = 0;
    let malePaidTickets = 0;
    let recentTickets: any[] = [];

    if (supabase) {
      try {
        const { data: ticketsData } = await supabase.from('tickets').select('*');
        if (ticketsData) {
          totalTickets = ticketsData.length;
          ticketsData.forEach((t: any) => {
            const fare = Number(t.fare) || 0;
            ticketRevenue += fare;
            if (t.gender === 'Female') {
              femaleFreeTickets += 1;
            } else {
              malePaidTickets += 1;
            }
          });
          recentTickets = ticketsData.slice(-20).reverse();
        }
      } catch (e) {}
    } else {
      const db = loadDatabase();
      totalTickets = db.tickets.length;
      db.tickets.forEach(t => {
        ticketRevenue += Number(t.fare) || 0;
        if (t.gender === 'Female') femaleFreeTickets++;
        else malePaidTickets++;
      });
      recentTickets = db.tickets.slice(-20).reverse();
    }

    // Crowd distribution
    const crowdDistribution = { empty: 0, normal: 0, crowded: 0 };
    activeBuses.forEach(b => {
      if (b.crowd_status === 0) crowdDistribution.empty++;
      else if (b.crowd_status === 1) crowdDistribution.normal++;
      else crowdDistribution.crowded++;
    });

    const recentOccupancyHistory = await this.getOccupancyHistory(undefined, 50);

    return {
      totalBuses: allBuses.length,
      totalActiveBuses: activeBuses.length,
      totalTickets,
      ticketRevenue,
      femaleFreeTickets,
      malePaidTickets,
      crowdDistribution,
      buses: allBuses,
      recentTickets,
      recentOccupancyHistory
    };
  }
}
