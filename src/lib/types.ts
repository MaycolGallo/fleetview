export type VehicleStatus = 'active' | 'idle' | 'out-of-service';

export interface Vehicle {
  vehicleId: string;
  latitude: number;
  longitude: number;
  status: VehicleStatus;
}

export interface RouteEvent {
  timestamp: string;
  status: 'start' | 'stop' | 'driving' | 'end';
  distanceKm: number;
  durationMinutes: number;
  description: string;
}

export interface RouteHistory {
  routePoints: { lat: number; lng: number }[];
  routeEvents: RouteEvent[];
}
