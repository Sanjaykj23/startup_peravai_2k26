import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format'); // 'json' or 'csv'

    const analytics = BusRepository.getAdminAnalytics();

    if (format === 'csv') {
      // Export occupancy history as CSV dataset for ML training
      const history = BusRepository.getOccupancyHistory(undefined, 1000);
      const csvHeader = 'id,bus_id,trip_id,occupancy,crowd_status,recorded_at,trigger_event,notes\n';
      const csvRows = history.map(h => 
        `"${h.id}","${h.bus_id}","${h.trip_id || ''}",${h.occupancy},${h.crowd_status},"${h.recorded_at}","${h.trigger_event}","${(h.notes || '').replace(/"/g, '""')}"`
      ).join('\n');

      return new NextResponse(csvHeader + csvRows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="chennai_mtc_occupancy_history_ml_dataset.csv"'
        }
      });
    }

    return NextResponse.json({
      success: true,
      analytics
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Analytics query error' }, { status: 500 });
  }
}
