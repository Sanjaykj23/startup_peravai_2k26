import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bus = BusRepository.getBusById(params.id);
    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    const routeStops = BusRepository.getRouteStops(bus.route_id);

    return NextResponse.json({
      success: true,
      bus,
      routeStops
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching bus' }, { status: 500 });
  }
}
