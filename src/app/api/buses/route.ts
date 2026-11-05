import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let buses = BusRepository.getAllBuses();
    if (status) {
      buses = buses.filter(b => b.status === status);
    }

    return NextResponse.json({
      success: true,
      buses
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching buses' }, { status: 500 });
  }
}
