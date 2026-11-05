import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get('routeId');

    const routes = await BusRepository.getAllRoutes();
    const stops = await BusRepository.getAllStops();

    if (routeId) {
      const routeStops = await BusRepository.getRouteStops(routeId);
      const route = routes.find(r => r.id === routeId);
      return NextResponse.json({
        success: true,
        route,
        stops: routeStops
      });
    }

    return NextResponse.json({
      success: true,
      routes,
      stops
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching routes' }, { status: 500 });
  }
}
