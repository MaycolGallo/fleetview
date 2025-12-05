export type VehicleStatus = 'active' | 'idle' | 'out-of-service';

export interface Vehicle {
  vehicleId: string;
  latitude: number;
  longitude: number;
  status: VehicleStatus;
}
