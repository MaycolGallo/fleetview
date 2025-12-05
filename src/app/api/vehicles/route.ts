import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Vehicle, VehicleStatus } from '@/lib/types';

// Lima, Peru bounding box
const LIMA_BOUNDS = {
  lat: { min: -12.25, max: -11.80 },
  lng: { min: -77.15, max: -76.90 },
};

function getRandomCoordinate(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getRandomStatus(): VehicleStatus {
  const statuses: VehicleStatus[] = ['active', 'idle', 'out-of-service'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function generateVehicle(index: number): Vehicle {
  return {
    vehicleId: `VEH-${1000 + index}`,
    latitude: getRandomCoordinate(LIMA_BOUNDS.lat.min, LIMA_BOUNDS.lat.max),
    longitude: getRandomCoordinate(LIMA_BOUNDS.lng.min, LIMA_BOUNDS.lng.max),
    status: getRandomStatus(),
  };
}

export function GET(req: NextRequest) {
  const vehicles: Vehicle[] = Array.from({ length: 50 }, (_, i) => generateVehicle(i));
  return NextResponse.json(vehicles);
}
