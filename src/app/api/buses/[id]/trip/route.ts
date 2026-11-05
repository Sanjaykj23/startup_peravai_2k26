import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { action, startStopId, endStopId, stopId } = body;

    if (action === 'start') {
      if (!startStopId) {
        return NextResponse.json({ error: 'Starting Stop is required to start a trip' }, { status: 400 });
      }

      const trip = await BusRepository.startTrip(params.id, startStopId, endStopId);
      const updatedBus = await BusRepository.getBusById(params.id);

      return NextResponse.json({
        success: true,
        message: 'Trip started successfully',
        trip,
        bus: updatedBus
      });
    }

    if (action === 'update_stop') {
      const targetStopId = stopId || body.currentStopId;
      if (!targetStopId) {
        return NextResponse.json({ error: 'Stop ID is required to advance stop' }, { status: 400 });
      }

      const result = await BusRepository.advanceCurrentStop(params.id, targetStopId);
      return NextResponse.json({
        success: true,
        message: result.message,
        exitedCount: result.exitedCount,
        bus: result.bus,
        trip: result.trip
      });
    }

    if (action === 'end') {
      const trip = await BusRepository.endTrip(params.id);
      const updatedBus = await BusRepository.getBusById(params.id);

      return NextResponse.json({
        success: true,
        message: 'Trip ended successfully',
        trip,
        bus: updatedBus
      });
    }

    return NextResponse.json({ error: 'Invalid trip action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Trip operation error' }, { status: 500 });
  }
}
