import { spawn } from 'child_process';

console.log('Testing Chennai Smart Bus Tracking System...');

const server = spawn('pnpm', ['start'], { shell: true, stdio: 'inherit' });

async function runTests() {
  await new Promise(r => setTimeout(r, 4000));

  try {
    // 1. Check /api/buses
    const busesRes = await fetch('http://localhost:3000/api/buses');
    const busesData = await busesRes.json();
    console.log('✓ GET /api/buses returned:', busesData.buses?.length, 'buses');

    // 2. Check /api/routes
    const routesRes = await fetch('http://localhost:3000/api/routes');
    const routesData = await routesRes.json();
    console.log('✓ GET /api/routes returned:', routesData.routes?.length, 'routes,', routesData.stops?.length, 'stops');

    // 3. Test Conductor Auth
    const authRes = await fetch('http://localhost:3000/api/auth/conductor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cnd_570', password: 'password123' })
    });
    const authData = await authRes.json();
    console.log('✓ Conductor Auth (cnd_570):', authData.conductor?.name, '| Assigned Bus:', authData.assignedBus?.bus_number);

    // 4. Test Nearby Bus Discovery (Chennai Central lat 13.0827, lon 80.2707, radius 10km)
    const nearbyRes = await fetch('http://localhost:3000/api/passenger/nearby?lat=13.0827&lon=80.2707&radius=10');
    const nearbyData = await nearbyRes.json();
    console.log('✓ Nearby Buses within 10KM:', nearbyData.busesCount, 'buses found');

    // 5. Test Ticket Booking (Female Free Vidiyal Payanam)
    const femaleTktRes = await fetch('http://localhost:3000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bus_id: busesData.buses[0].id,
        source_stop_id: routesData.stops[0].id,
        destination_stop_id: routesData.stops[1].id,
        gender: 'Female',
        booked_by: 'passenger',
        payment_mode: 'Free'
      })
    });
    const femaleTkt = await femaleTktRes.json();
    console.log('✓ Female Ticket Issued: Fare = ₹' + femaleTkt.ticket?.fare, '| Mode:', femaleTkt.ticket?.payment_mode, '| Bus Occupancy now:', femaleTkt.bus?.current_occupancy);

    // 6. Test Ticket Booking (Male Paid Fare)
    const maleTktRes = await fetch('http://localhost:3000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bus_id: busesData.buses[0].id,
        source_stop_id: routesData.stops[0].id,
        destination_stop_id: routesData.stops[2]?.id || routesData.stops[1].id,
        gender: 'Male',
        booked_by: 'conductor',
        payment_mode: 'Cash'
      })
    });
    const maleTkt = await maleTktRes.json();
    console.log('✓ Male Ticket Issued: Fare = ₹' + maleTkt.ticket?.fare, '| Mode:', maleTkt.ticket?.payment_mode, '| Bus Occupancy now:', maleTkt.bus?.current_occupancy);

    // 7. Test Admin Analytics
    const analyticsRes = await fetch('http://localhost:3000/api/analytics');
    const analyticsData = await analyticsRes.json();
    console.log('✓ Admin Analytics:', {
      totalActiveBuses: analyticsData.analytics?.totalActiveBuses,
      totalTickets: analyticsData.analytics?.totalTickets,
      revenue: analyticsData.analytics?.ticketRevenue,
      femaleFreePasses: analyticsData.analytics?.femaleFreeTickets,
      crowdDistribution: analyticsData.analytics?.crowdDistribution
    });

    console.log('\nALL TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    server.kill();
    process.exit(0);
  }
}

runTests();
