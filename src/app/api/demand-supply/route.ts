import { NextRequest, NextResponse } from 'next/server';
import { DemandSupplyService } from '@/services/analytics/demandSupplyService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const routeId = searchParams.get('routeId') || undefined;
    const timeSlot = searchParams.get('timeSlot') || undefined;
    const dateRange = searchParams.get('dateRange') || undefined;

    const criticalThreshold = searchParams.get('criticalThreshold')
      ? Number(searchParams.get('criticalThreshold'))
      : undefined;
    const highThreshold = searchParams.get('highThreshold')
      ? Number(searchParams.get('highThreshold'))
      : undefined;
    const moderateThreshold = searchParams.get('moderateThreshold')
      ? Number(searchParams.get('moderateThreshold'))
      : undefined;

    const data = await DemandSupplyService.calculateIntelligence({
      routeId,
      timeSlot,
      dateRange,
      criticalThreshold,
      highThreshold,
      moderateThreshold
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in /api/demand-supply:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal error calculating demand supply intelligence'
      },
      { status: 500 }
    );
  }
}
