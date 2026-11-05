import { NextRequest, NextResponse } from 'next/server';
import { BusRepository } from '@/services/db/repository';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const conductor = await BusRepository.authenticateConductor(username, password);
    if (!conductor) {
      return NextResponse.json({ error: 'Invalid conductor credentials' }, { status: 401 });
    }

    // Find assigned bus if any
    const buses = await BusRepository.getAllBuses();
    const assignedBus = buses.find(b => b.conductor_id === conductor.id) || null;

    return NextResponse.json({
      success: true,
      conductor: {
        id: conductor.id,
        name: conductor.name,
        employee_code: conductor.employee_code,
        username: conductor.username,
        phone: conductor.phone,
        email: conductor.email
      },
      assignedBus
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
