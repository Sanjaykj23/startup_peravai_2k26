import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { action, count, currentStopName } = await req.json();
    const qty = Number(count) || 1;

    let result;
    if (action === 'exit') {
      result = BusRepository.recordPassengersExiting(params.id, qty, currentStopName);
    } else if (action === 'enter') {
      result = BusRepository.recordPassengersEntering(params.id, qty);
    } else {
      return NextResponse.json({ error: 'Action must be enter or exit' }, { status: 400 });
    }

    const bus = BusRepository.getBusById(params.id);

    return NextResponse.json({
      success: true,
      current_occupancy: result.current_occupancy,
      crowd_status: result.crowd_status,
      bus
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Occupancy update error' }, { status: 500 });
  }
}
