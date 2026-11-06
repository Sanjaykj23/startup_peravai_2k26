export type CrowdStatusCode = 0 | 1 | 2; // 0 = Empty, 1 = Normal, 2 = Overcrowded

export interface CrowdInfo {
  status: CrowdStatusCode;
  label: 'Empty' | 'Normal Crowd' | 'Overcrowded';
  color: string;
  badgeClass: string;
  bgLight: string;
  percentage: number;
}

export function getCrowdInfo(occupancy: number, capacity: number): CrowdInfo {
  const cap = capacity > 0 ? capacity : 50;
  const percentage = Math.min(100, Math.max(0, Math.round((occupancy / cap) * 100)));

  if (percentage <= 30) {
    return {
      status: 0,
      label: 'Empty',
      color: '#10B981', // Green
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      bgLight: 'rgba(16, 185, 129, 0.15)',
      percentage
    };
  } else if (percentage <= 70) {
    return {
      status: 1,
      label: 'Normal Crowd',
      color: '#F59E0B', // Yellow
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      bgLight: 'rgba(245, 158, 11, 0.15)',
      percentage
    };
  } else {
    return {
      status: 2,
      label: 'Overcrowded',
      color: '#EF4444', // Red
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      bgLight: 'rgba(239, 68, 68, 0.15)',
      percentage
    };
  }
}

export interface Conductor {
  id: string;
  name: string;
  employee_code: string;
  phone: string;
  email: string;
  username: string;
  password?: string;
  assigned_bus_number?: string;
  assigned_route_number?: string;
}

export interface Route {
  id: string;
  route_number: string;
  route_name: string;
  corridor?: string;
}

export interface Stop {
  id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
}

export interface RouteStop {
  id: string;
  route_id: string;
  stop_id: string;
  stop_sequence: number;
  stop_name?: string;
  latitude?: number;
  longitude?: number;
}

export interface Trip {
  id: string;
  bus_id: string;
  route_id: string;
  conductor_id: string;
  start_stop_id: string;
  start_stop_name?: string;
  end_stop_id?: string;
  end_stop_name?: string;
  current_stop_id?: string;
  current_stop_name?: string;
  current_stop_sequence?: number;
  visited_stop_ids?: string[];
  start_time: string;
  end_time?: string | null;
  status: 'active' | 'completed' | 'cancelled';
}

export interface BusLocation {
  id: string;
  bus_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  speed?: number;
}

export interface OccupancyHistory {
  id: string;
  bus_id: string;
  trip_id?: string;
  occupancy: number;
  crowd_status: CrowdStatusCode;
  recorded_at: string;
  trigger_event: 'trip_start' | 'ticket_booked' | 'passenger_entry' | 'passenger_exit' | 'stop_reached' | 'manual_update';
  notes?: string;
}

export interface Ticket {
  id: string;
  trip_id: string;
  bus_id: string;
  bus_number: string;
  passenger_id?: string;
  passenger_phone?: string;
  student_id?: string;
  institution_name?: string;
  source_stop_id: string;
  source_stop_name: string;
  destination_stop_id: string;
  destination_stop_name: string;
  gender: 'Male' | 'Female' | 'Student';
  fare: number;
  booked_by: 'conductor' | 'passenger' | 'student';
  payment_mode: 'Cash' | 'Razorpay' | 'Free';
  payment_id?: string;
  occupancy_snapshot: number;
  crowd_status: CrowdStatusCode;
  created_at: string;
  status: 'active' | 'exited';
}

export interface Bus {
  id: string;
  bus_number: string;
  fleet_code: string;
  route_id: string;
  route_number: string;
  route_name: string;
  capacity: number;
  conductor_id: string;
  conductor_name?: string;
  status: 'active' | 'idle' | 'in_transit' | 'maintenance';
  current_occupancy: number;
  crowd_status: CrowdStatusCode;
  occupancy_percentage: number;
  current_trip?: Trip | null;
  current_location?: BusLocation | null;
  distance_km?: number; // Calculated for nearby discovery
}

export * from './demandSupply';
