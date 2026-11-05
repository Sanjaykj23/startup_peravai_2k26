import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get('routeId');

    const routes = BusRepository.getAllRoutes();
    const db = BusRepository.getDatabase();

    if (routeId) {
      const stops = BusRepository.getRouteStops(routeId);
      const route = routes.find(r => r.id === routeId);
      return NextResponse.json({
        success: true,
        route,
        stops
      });
    }

    return NextResponse.json({
      success: true,
      routes,
      stops: db.stops
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching routes' }, { status: 500 });
  }
}
