import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { latitude, longitude, speed } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Latitude and Longitude are required' }, { status: 400 });
    }

    const loc = BusRepository.updateBusLocation(params.id, Number(latitude), Number(longitude), Number(speed) || 25);
    const bus = BusRepository.getBusById(params.id);

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: loc,
      bus
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Location update error' }, { status: 500 });
  }
}
