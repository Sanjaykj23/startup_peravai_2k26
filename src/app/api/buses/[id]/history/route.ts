import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 100;

    const history = BusRepository.getOccupancyHistory(params.id, limit);

    return NextResponse.json({
      success: true,
      bus_id: params.id,
      history
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching history' }, { status: 500 });
  }
}
