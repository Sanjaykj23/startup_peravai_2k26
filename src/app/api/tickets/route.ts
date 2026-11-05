import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bus_id, source_stop_id, destination_stop_id, gender, booked_by, payment_mode, passenger_phone } = body;

    if (!bus_id) {
      return NextResponse.json({ error: 'Bus ID is required' }, { status: 400 });
    }
    if (!source_stop_id || !destination_stop_id) {
      return NextResponse.json({ error: 'Source and Destination stops are required' }, { status: 400 });
    }
    if (!gender || !['Male', 'Female'].includes(gender)) {
      return NextResponse.json({ error: 'Gender must be Male or Female' }, { status: 400 });
    }

    const ticket = BusRepository.issueTicket({
      bus_id,
      source_stop_id,
      destination_stop_id,
      gender,
      booked_by: booked_by || 'conductor',
      payment_mode: payment_mode || (gender === 'Female' ? 'Free' : 'Cash'),
      passenger_phone
    });

    const updatedBus = BusRepository.getBusById(bus_id);

    return NextResponse.json({
      success: true,
      message: 'Ticket generated successfully',
      ticket,
      bus: updatedBus
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Ticket generation error' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const busId = searchParams.get('busId');
    const phone = searchParams.get('phone');

    const db = BusRepository.getDatabase();
    let tickets = [...db.tickets];

    if (busId) {
      tickets = tickets.filter(t => t.bus_id === busId);
    }
    if (phone) {
      tickets = tickets.filter(t => t.passenger_phone === phone);
    }

    return NextResponse.json({
      success: true,
      tickets: tickets.reverse()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching tickets' }, { status: 500 });
  }
}
