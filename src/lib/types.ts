export type VehicleStatus = 'active' | 'idle' | 'out-of-service';

export interface Vehicle {
  id: string; // vehicleId from the API is mapped to id
  vehicleId: string;
  latitude: number;
  longitude: number;
  status: VehicleStatus;
  driverName: string;
  speedKph: number;
  fuelLevel: number; // Percentage
  lastMaintenance: string; // ISO Date string
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
