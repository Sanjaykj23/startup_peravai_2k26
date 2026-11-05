export const APP_CONFIG = {
  name: 'Chennai Smart Bus Crowd Tracking System',
  version: '1.0.0 Phase 1',
  agency: 'Metropolitan Transport Corporation (MTC) Chennai',
  
  // Coordinates for Chennai Center (Chennai Central / Ripon Building)
  map: {
    defaultCenter: [13.0827, 80.2707] as [number, number],
    defaultZoom: 12,
    nearbyRadiusKm: 5,
    locationUpdateIntervalSeconds: 30
  },

  // Crowd classification thresholds
  crowd: {
    emptyMax: 30,    // 0 - 30% -> Empty (0)
    normalMax: 70,   // 31 - 70% -> Normal Crowd (1)
    // 71 - 100% -> Overcrowded (2)
  },

  // Fare calculation (MTC Chennai Ordinary / Express simulation)
  fare: {
    baseFareMale: 7.00,
    perStopFare: 2.50,
    femaleFare: 0.00, // Vidiyal Payanam Free Travel Scheme for Women
  },

  // Supabase (PostgreSQL hosting & realtime)
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase-chennaibus.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },

  // Redis (Realtime cache layer)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefixes: {
      occupancy: 'bus:%s:occupancy',
      crowdStatus: 'bus:%s:crowd_status',
      location: 'bus:%s:location',
      trip: 'bus:%s:trip'
    }
  },

  // Razorpay simulation / live test
  razorpay: {
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_chennaismartbus',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_chennaismartbus'
  }
};
