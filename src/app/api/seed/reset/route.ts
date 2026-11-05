import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function POST(req: NextRequest) {
  try {
    BusRepository.resetDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database reset to initial GTFS seed data'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Reset error' }, { status: 500 });
  }
}
