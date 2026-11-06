export type DemandSupplyImbalanceStatus =
  | 'critical'          // Ratio > 100%: Demand exceeds available capacity
  | 'high'              // Ratio 70% - 100%: High utilisation, monitor closely
  | 'moderate'          // Ratio 50% - 69%: Healthy balanced utilisation
  | 'underutilized'     // Ratio < 50%: Potentially underutilised supply
  | 'insufficient_data';// Capacity is 0 or no trips

export interface TimeSlotDefinition {
  id: string;
  name: string;
  label: string;
  startHour: number;
  endHour: number;
  isPeak: boolean;
}

export interface RouteDemandSupplyAnalysis {
  routeId: string;
  routeNumber: string;
  routeName: string;
  corridor: string;
  timeSlot: string;
  passengerDemand: number;
  studentPassCount: number;
  femaleFreeCount: number;
  malePaidCount: number;
  busTripsCount: number;
  busesAssignedCount: number;
  busCapacity: number;
  totalAvailableCapacity: number;
  demandToCapacityRatio: number | null; // null if zero capacity to prevent divide-by-zero
  imbalanceStatus: DemandSupplyImbalanceStatus;
  statusLabel: string;
  statusColor: string;
  recommendation: string;
  recommendationDetails: {
    type: 'add_trips' | 'monitor' | 'balanced' | 'reallocate' | 'insufficient_data';
    priority: 'urgent' | 'medium' | 'low' | 'info';
    suggestedAdditionalTrips?: number;
    suggestedReallocationCount?: number;
    actionText: string;
  };
}

export interface DemandSupplySummary {
  totalRoutesAnalysed: number;
  totalPassengerDemand: number;
  totalAvailableCapacity: number;
  overallRatio: number | null;
  criticalRoutesCount: number;
  highUtilisationRoutesCount: number;
  moderateUtilisationRoutesCount: number;
  underutilisedRoutesCount: number;
  insufficientSupplyRoutesCount: number;
  studentDemandCount: number;
  femaleDemandCount: number;
  paidDemandCount: number;
  peakDemandTimeSlot: string;
  peakDemandRoute: string;
}

export interface TimeSlotDemandSupplyBreakdown {
  timeSlotId: string;
  timeSlotLabel: string;
  isPeak: boolean;
  passengerDemand: number;
  availableCapacity: number;
  tripsCount: number;
  ratio: number | null;
  status: DemandSupplyImbalanceStatus;
}

export interface DemandSupplyFilter {
  routeId?: string;
  timeSlot?: string;
  dateRange?: string; // 'all' | 'today' | '7days' | '30days'
  criticalThreshold?: number; // default 100%
  highThreshold?: number;     // default 70%
  moderateThreshold?: number; // default 50%
}

export interface DemandSupplyResponse {
  success: boolean;
  summary: DemandSupplySummary;
  routeAnalyses: RouteDemandSupplyAnalysis[];
  timeSlotBreakdowns: TimeSlotDemandSupplyBreakdown[];
  corridorBreakdowns: {
    corridor: string;
    passengerDemand: number;
    availableCapacity: number;
    ratio: number | null;
  }[];
  thresholds: {
    critical: number;
    high: number;
    moderate: number;
  };
  generatedAt: string;
}
