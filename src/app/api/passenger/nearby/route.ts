import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';
import { APP_CONFIG } from '@/configs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radius = searchParams.get('radius');

    // Default to Chennai Central coordinates if no GPS passed
    const userLat = lat ? parseFloat(lat) : APP_CONFIG.map.defaultCenter[0];
    const userLon = lon ? parseFloat(lon) : APP_CONFIG.map.defaultCenter[1];
    const radiusKm = radius ? parseFloat(radius) : APP_CONFIG.map.nearbyRadiusKm;

    const nearbyBuses = BusRepository.getNearbyBuses(userLat, userLon, radiusKm);

    return NextResponse.json({
      success: true,
      userLocation: { latitude: userLat, longitude: userLon },
      radiusKm,
      busesCount: nearbyBuses.length,
      buses: nearbyBuses.map(b => ({
        id: b.id,
        bus_number: b.bus_number,
        fleet_code: b.fleet_code,
        route_number: b.route_number,
        route_name: b.route_name,
        capacity: b.capacity,
        current_occupancy: b.current_occupancy,
        crowd_status: b.crowd_status,
        occupancy_percentage: b.occupancy_percentage,
        distance_km: b.distance_km,
        current_stop: b.current_trip?.current_stop_name || 'In Transit',
        location: b.current_location
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error finding nearby buses' }, { status: 500 });
  }
}
