import { getSupabaseClient } from '@/services/supabase';
import { loadDatabase } from '@/services/db/repository';
import {
  DemandSupplyFilter,
  DemandSupplyResponse,
  DemandSupplySummary,
  RouteDemandSupplyAnalysis,
  TimeSlotDefinition,
  TimeSlotDemandSupplyBreakdown,
  DemandSupplyImbalanceStatus
} from '@/types/demandSupply';

export const TIME_SLOTS: TimeSlotDefinition[] = [
  { id: 'all_day', name: 'All Day', label: 'All Operating Hours (24h)', startHour: 0, endHour: 24, isPeak: false },
  { id: 'morning_peak', name: 'Morning Peak', label: '08:00 - 11:00 (Morning Peak)', startHour: 8, endHour: 11, isPeak: true },
  { id: 'midday', name: 'Midday', label: '11:00 - 16:00 (Afternoon Off-Peak)', startHour: 11, endHour: 16, isPeak: false },
  { id: 'evening_peak', name: 'Evening Peak', label: '16:00 - 20:00 (Evening Peak)', startHour: 16, endHour: 20, isPeak: true },
  { id: 'night', name: 'Night / Early', label: '20:00 - 08:00 (Night & Early Bird)', startHour: 20, endHour: 8, isPeak: false }
];

export function getTicketTimeSlot(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'midday';
  const hour = d.getHours();

  if (hour >= 8 && hour < 11) return 'morning_peak';
  if (hour >= 11 && hour < 16) return 'midday';
  if (hour >= 16 && hour < 20) return 'evening_peak';
  return 'night';
}

export function isDateInFilter(dateStr: string, dateRange: string = 'all'): boolean {
  if (dateRange === 'all') return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const now = new Date();

  if (dateRange === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (dateRange === '7days') {
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  }
  if (dateRange === '30days') {
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 30;
  }
  return true;
}

export class DemandSupplyService {
  /**
   * Core Demand & Supply Intelligence calculation engine
   */
  static async calculateIntelligence(filters: DemandSupplyFilter = {}): Promise<DemandSupplyResponse> {
    const criticalThreshold = filters.criticalThreshold ?? 100;
    const highThreshold = filters.highThreshold ?? 70;
    const moderateThreshold = filters.moderateThreshold ?? 50;
    const selectedTimeSlot = filters.timeSlot || 'all_day';
    const selectedRouteId = filters.routeId && filters.routeId !== 'all' ? filters.routeId : undefined;
    const dateRange = filters.dateRange || 'all';

    // 1. Fetch live data from Supabase (with fallback to local repository)
    const supabase = getSupabaseClient();
    let routes: any[] = [];
    let buses: any[] = [];
    let trips: any[] = [];
    let tickets: any[] = [];
    let routeStops: any[] = [];

    if (supabase) {
      try {
        const [routesRes, busesRes, tripsRes, ticketsRes, routeStopsRes] = await Promise.all([
          supabase.from('routes').select('*'),
          supabase.from('buses').select('*'),
          supabase.from('trips').select('*'),
          supabase.from('tickets').select('*'),
          supabase.from('route_stops').select('*')
        ]);

        if (routesRes.data && routesRes.data.length > 0) routes = routesRes.data;
        if (busesRes.data && busesRes.data.length > 0) buses = busesRes.data;
        if (tripsRes.data && tripsRes.data.length > 0) trips = tripsRes.data;
        if (ticketsRes.data && ticketsRes.data.length > 0) tickets = ticketsRes.data;
        if (routeStopsRes.data && routeStopsRes.data.length > 0) routeStops = routeStopsRes.data;
      } catch (e) {
        console.warn('Supabase fetch for DemandSupply fallback to local db:', e);
      }
    }

    // Fallback/enrich from local database if Supabase is partially empty
    const localDb = loadDatabase();
    if (routes.length === 0) routes = localDb.routes;
    if (buses.length === 0) buses = localDb.buses;
    if (trips.length === 0) trips = localDb.trips;
    if (routeStops.length === 0) routeStops = localDb.route_stops;

    // Merge any tickets from localDb that might not be in Supabase
    const ticketIdSet = new Set(tickets.map(t => t.id));
    localDb.tickets.forEach((lt: any) => {
      if (!ticketIdSet.has(lt.id)) {
        tickets.push(lt);
      }
    });

    // Maps for fast lookups
    const routesMap = new Map<string, any>(routes.map(r => [r.id, r]));
    const busesMap = new Map<string, any>(buses.map(b => [b.id, b]));
    const tripsMap = new Map<string, any>(trips.map(t => [t.id, t]));

    // Map stops to routes: stop_id -> Set of route_ids
    const stopToRoutesMap = new Map<string, Set<string>>();
    routeStops.forEach(rs => {
      if (!stopToRoutesMap.has(rs.stop_id)) {
        stopToRoutesMap.set(rs.stop_id, new Set());
      }
      stopToRoutesMap.get(rs.stop_id)!.add(rs.route_id);
    });

    // Helper: Identify route_id for a ticket
    function findTicketRouteId(ticket: any): string | null {
      // 1. Through trip_id -> trips -> bus -> route_id
      if (ticket.trip_id && tripsMap.has(ticket.trip_id)) {
        const trip = tripsMap.get(ticket.trip_id);
        if (trip.bus_id && busesMap.has(trip.bus_id)) {
          return busesMap.get(trip.bus_id).route_id;
        }
      }

      // 2. Through ticket.bus_id (if present from local store)
      if (ticket.bus_id && busesMap.has(ticket.bus_id)) {
        return busesMap.get(ticket.bus_id).route_id;
      }

      // 3. Through matching stops with route_stops
      if (ticket.source_stop_id && ticket.destination_stop_id) {
        const srcRoutes = stopToRoutesMap.get(ticket.source_stop_id);
        const dstRoutes = stopToRoutesMap.get(ticket.destination_stop_id);
        if (srcRoutes && dstRoutes) {
          const srcList = Array.from(srcRoutes);
          for (let i = 0; i < srcList.length; i++) {
            if (dstRoutes.has(srcList[i])) return srcList[i];
          }
        }
      }

      return null;
    }

    // 2. Filter tickets based on dateRange & timeSlot
    const filteredTickets = tickets.filter(t => {
      if (!isDateInFilter(t.created_at, dateRange)) return false;
      if (selectedTimeSlot !== 'all_day') {
        const slot = getTicketTimeSlot(t.created_at);
        if (slot !== selectedTimeSlot) return false;
      }
      return true;
    });

    // 3. Calculate Passenger Demand per Route
    interface RouteDemandAcc {
      total: number;
      student: number;
      female: number;
      paid: number;
    }
    const routeDemandMap = new Map<string, RouteDemandAcc>();
    routes.forEach(r => {
      routeDemandMap.set(r.id, { total: 0, student: 0, female: 0, paid: 0 });
    });

    filteredTickets.forEach(ticket => {
      const routeId = findTicketRouteId(ticket);
      if (!routeId || !routeDemandMap.has(routeId)) return;

      const acc = routeDemandMap.get(routeId)!;
      acc.total += 1; // Each valid ticket counts as exactly 1 passenger demand

      const isStudent =
        ticket.gender === 'Student' ||
        ticket.booked_by === 'student' ||
        ticket.passenger_phone?.startsWith('STU:') ||
        ticket.student_id;

      if (isStudent) {
        acc.student += 1;
      } else if (ticket.gender === 'Female') {
        acc.female += 1;
      } else {
        acc.paid += 1;
      }
    });

    // 4. Calculate Available Bus Capacity (Supply) per Route
    // Available Supply = Number of Available Bus Trips × Bus Capacity
    // Exclude cancelled trips!
    const validTrips = trips.filter(t => {
      if (t.status === 'cancelled') return false;
      if (t.start_time && !isDateInFilter(t.start_time, dateRange)) return false;
      if (selectedTimeSlot !== 'all_day' && t.start_time) {
        const slot = getTicketTimeSlot(t.start_time);
        if (slot !== selectedTimeSlot) return false;
      }
      return true;
    });

    // Map trips to route_id
    const routeTripsMap = new Map<string, any[]>();
    routes.forEach(r => routeTripsMap.set(r.id, []));

    validTrips.forEach(trip => {
      const bus = busesMap.get(trip.bus_id);
      if (bus && bus.route_id && routeTripsMap.has(bus.route_id)) {
        routeTripsMap.get(bus.route_id)!.push(trip);
      }
    });

    // 5. Generate Route-wise Demand & Supply Analyses
    const routeAnalyses: RouteDemandSupplyAnalysis[] = [];

    routes.forEach(route => {
      if (selectedRouteId && route.id !== selectedRouteId) return;

      const demandAcc = routeDemandMap.get(route.id) || { total: 0, student: 0, female: 0, paid: 0 };
      const passengerDemand = demandAcc.total;

      // Find buses assigned to this route
      const assignedBuses = buses.filter(b => b.route_id === route.id);
      const busesCount = assignedBuses.length;

      // Determine nominal bus capacity (average or first bus capacity, fallback 50)
      const busCapacity = assignedBuses.length > 0 ? (assignedBuses[0].capacity || 50) : 50;

      // Count valid operated/active trips
      const routeTrips = routeTripsMap.get(route.id) || [];
      const tripsCount = routeTrips.length;

      // Supply calculation:
      // If there are trips recorded in database, Available Capacity = tripsCount * busCapacity.
      // If no trips recorded in DB for this period, available capacity is 0 (Insufficient supply data).
      const totalAvailableCapacity = tripsCount * busCapacity;

      // Demand-to-Capacity Ratio calculation
      // IMPORTANT: Prevent divide-by-zero!
      let demandToCapacityRatio: number | null = null;
      let status: DemandSupplyImbalanceStatus = 'insufficient_data';
      let statusLabel = 'Insufficient Supply Data';
      let statusColor = 'slate';

      if (totalAvailableCapacity > 0) {
        demandToCapacityRatio = Number(((passengerDemand / totalAvailableCapacity) * 100).toFixed(1));

        if (demandToCapacityRatio > criticalThreshold) {
          status = 'critical';
          statusLabel = 'Critical – Demand Exceeds Capacity';
          statusColor = 'red';
        } else if (demandToCapacityRatio >= highThreshold) {
          status = 'high';
          statusLabel = 'High Utilisation – Monitor';
          statusColor = 'orange';
        } else if (demandToCapacityRatio >= moderateThreshold) {
          status = 'moderate';
          statusLabel = 'Moderate Utilisation';
          statusColor = 'yellow';
        } else {
          status = 'underutilized';
          statusLabel = 'Potentially Underutilised';
          statusColor = 'emerald';
        }
      } else if (passengerDemand > 0) {
        // Demand exists but 0 trips operated
        status = 'critical';
        statusLabel = 'No Operating Trips (Zero Supply)';
        statusColor = 'red';
      }

      // Rule-based Recommendation Engine
      let recommendation = '';
      let recType: 'add_trips' | 'monitor' | 'balanced' | 'reallocate' | 'insufficient_data' = 'insufficient_data';
      let priority: 'urgent' | 'medium' | 'low' | 'info' = 'info';
      let suggestedAdditionalTrips: number | undefined;
      let suggestedReallocationCount: number | undefined;
      let actionText = '';

      if (status === 'critical') {
        priority = 'urgent';
        recType = 'add_trips';
        const shortage = Math.max(0, passengerDemand - totalAvailableCapacity);
        suggestedAdditionalTrips = Math.max(1, Math.ceil(shortage / busCapacity));
        recommendation = `Passenger demand (${passengerDemand}) exceeds available bus capacity (${totalAvailableCapacity}). Deploy ${suggestedAdditionalTrips} additional bus trip(s) or increase peak service frequency to 5–8 min headway.`;
        actionText = `Deploy +${suggestedAdditionalTrips} additional trip(s) immediately`;
      } else if (status === 'high') {
        priority = 'medium';
        recType = 'monitor';
        recommendation = `Passenger demand is approaching available capacity (${demandToCapacityRatio}%). Monitor boarding queues at major interchange stops and review peak-hour frequency.`;
        actionText = 'Monitor passenger queues & standbys';
      } else if (status === 'moderate') {
        priority = 'low';
        recType = 'balanced';
        recommendation = `Passenger demand is well-matched with available capacity (${demandToCapacityRatio}%). Current timetable is operating efficiently.`;
        actionText = 'Maintain current timetable & dispatch';
      } else if (status === 'underutilized') {
        priority = 'low';
        recType = 'reallocate';
        suggestedReallocationCount = 1;
        recommendation = `Passenger demand is relatively low compared with available capacity (${demandToCapacityRatio}%). Review service frequency before considering reallocation of 1 bus to high-demand corridors.`;
        actionText = 'Review frequency; consider reallocating 1 bus';
      } else {
        priority = 'info';
        recType = 'insufficient_data';
        recommendation = 'No active or scheduled bus trips recorded for this corridor during the selected window. Schedule trips to meet corridor demand.';
        actionText = 'Assign bus fleet & schedule trips';
      }

      const activeTimeSlotObj = TIME_SLOTS.find(ts => ts.id === selectedTimeSlot);

      routeAnalyses.push({
        routeId: route.id,
        routeNumber: route.route_number,
        routeName: route.route_name,
        corridor: route.corridor || 'Chennai City Corridor',
        timeSlot: activeTimeSlotObj ? activeTimeSlotObj.name : 'All Day',
        passengerDemand,
        studentPassCount: demandAcc.student,
        femaleFreeCount: demandAcc.female,
        malePaidCount: demandAcc.paid,
        busTripsCount: tripsCount,
        busesAssignedCount: busesCount,
        busCapacity,
        totalAvailableCapacity,
        demandToCapacityRatio,
        imbalanceStatus: status,
        statusLabel,
        statusColor,
        recommendation,
        recommendationDetails: {
          type: recType,
          priority,
          suggestedAdditionalTrips,
          suggestedReallocationCount,
          actionText
        }
      });
    });

    // 6. Time-slot-wise Demand Breakdown
    const timeSlotBreakdowns: TimeSlotDemandSupplyBreakdown[] = TIME_SLOTS.filter(ts => ts.id !== 'all_day').map(slot => {
      let slotDemand = 0;
      let slotTrips = 0;
      let slotCapacity = 0;

      // Count tickets for this slot
      filteredTickets.forEach(t => {
        if (getTicketTimeSlot(t.created_at) === slot.id) {
          slotDemand += 1;
        }
      });

      // Count trips for this slot
      validTrips.forEach(tr => {
        if (tr.start_time && getTicketTimeSlot(tr.start_time) === slot.id) {
          slotTrips += 1;
          const bus = busesMap.get(tr.bus_id);
          slotCapacity += bus?.capacity || 50;
        }
      });

      let slotRatio: number | null = null;
      let slotStatus: DemandSupplyImbalanceStatus = 'insufficient_data';

      if (slotCapacity > 0) {
        slotRatio = Number(((slotDemand / slotCapacity) * 100).toFixed(1));
        if (slotRatio > criticalThreshold) slotStatus = 'critical';
        else if (slotRatio >= highThreshold) slotStatus = 'high';
        else if (slotRatio >= moderateThreshold) slotStatus = 'moderate';
        else slotStatus = 'underutilized';
      } else if (slotDemand > 0) {
        slotStatus = 'critical';
      }

      return {
        timeSlotId: slot.id,
        timeSlotLabel: slot.name,
        isPeak: slot.isPeak,
        passengerDemand: slotDemand,
        availableCapacity: slotCapacity,
        tripsCount: slotTrips,
        ratio: slotRatio,
        status: slotStatus
      };
    });

    // 7. Corridor-level summary
    const corridorMap = new Map<string, { demand: number; capacity: number }>();
    routeAnalyses.forEach(ra => {
      const c = ra.corridor;
      if (!corridorMap.has(c)) {
        corridorMap.set(c, { demand: 0, capacity: 0 });
      }
      const acc = corridorMap.get(c)!;
      acc.demand += ra.passengerDemand;
      acc.capacity += ra.totalAvailableCapacity;
    });

    const corridorBreakdowns = Array.from(corridorMap.entries()).map(([corridor, data]) => ({
      corridor,
      passengerDemand: data.demand,
      availableCapacity: data.capacity,
      ratio: data.capacity > 0 ? Number(((data.demand / data.capacity) * 100).toFixed(1)) : null
    }));

    // 8. Overall Summary Cards
    const totalDemand = routeAnalyses.reduce((sum, r) => sum + r.passengerDemand, 0);
    const totalCapacity = routeAnalyses.reduce((sum, r) => sum + r.totalAvailableCapacity, 0);
    const overallRatio = totalCapacity > 0 ? Number(((totalDemand / totalCapacity) * 100).toFixed(1)) : null;

    const criticalRoutes = routeAnalyses.filter(r => r.imbalanceStatus === 'critical');
    const highRoutes = routeAnalyses.filter(r => r.imbalanceStatus === 'high');
    const moderateRoutes = routeAnalyses.filter(r => r.imbalanceStatus === 'moderate');
    const underutilisedRoutes = routeAnalyses.filter(r => r.imbalanceStatus === 'underutilized');
    const insufficientRoutes = routeAnalyses.filter(r => r.imbalanceStatus === 'insufficient_data');

    // Peak demand route
    const sortedByDemand = [...routeAnalyses].sort((a, b) => b.passengerDemand - a.passengerDemand);
    const peakDemandRoute = sortedByDemand.length > 0 && sortedByDemand[0].passengerDemand > 0
      ? `Route ${sortedByDemand[0].routeNumber} (${sortedByDemand[0].passengerDemand} pax)`
      : 'All Balanced';

    // Peak demand time slot
    const sortedSlots = [...timeSlotBreakdowns].sort((a, b) => b.passengerDemand - a.passengerDemand);
    const peakDemandTimeSlot = sortedSlots.length > 0 && sortedSlots[0].passengerDemand > 0
      ? sortedSlots[0].timeSlotLabel
      : 'Midday';

    const summary: DemandSupplySummary = {
      totalRoutesAnalysed: routeAnalyses.length,
      totalPassengerDemand: totalDemand,
      totalAvailableCapacity: totalCapacity,
      overallRatio,
      criticalRoutesCount: criticalRoutes.length,
      highUtilisationRoutesCount: highRoutes.length,
      moderateUtilisationRoutesCount: moderateRoutes.length,
      underutilisedRoutesCount: underutilisedRoutes.length,
      insufficientSupplyRoutesCount: insufficientRoutes.length,
      studentDemandCount: routeAnalyses.reduce((sum, r) => sum + r.studentPassCount, 0),
      femaleDemandCount: routeAnalyses.reduce((sum, r) => sum + r.femaleFreeCount, 0),
      paidDemandCount: routeAnalyses.reduce((sum, r) => sum + r.malePaidCount, 0),
      peakDemandTimeSlot,
      peakDemandRoute
    };

    return {
      success: true,
      summary,
      routeAnalyses,
      timeSlotBreakdowns,
      corridorBreakdowns,
      thresholds: {
        critical: criticalThreshold,
        high: highThreshold,
        moderate: moderateThreshold
      },
      generatedAt: new Date().toISOString()
    };
  }
}
