import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Vehicle, VehicleStatus } from '@/lib/types';
import { subDays } from 'date-fns';

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

const sampleDrivers = [
  'Juan Perez', 'Maria Garcia', 'Carlos Rodriguez', 'Ana Martinez', 'Luis Hernandez',
  'Sofia Gomez', 'Miguel Diaz', 'Lucia Torres', 'Jorge Vargas', 'Camila Ruiz',
  'Fernando Morales', 'Valeria Castillo', 'Ricardo Sanchez', 'Isabella Ramirez', 'Matias Flores'
];

function generateVehicle(index: number): Omit<Vehicle, 'id'> & { vehicleId: string } {
  const status = getRandomStatus();
  let speedKph;
  switch (status) {
    case 'active':
      speedKph = Math.floor(Math.random() * 60) + 20; // 20-79 km/h
      break;
    case 'idle':
      speedKph = 0;
      break;
    case 'out-of-service':
      speedKph = 0;
      break;
  }

  return {
    vehicleId: `VEH-${1000 + index}`,
    latitude: getRandomCoordinate(LIMA_BOUNDS.lat.min, LIMA_BOUNDS.lat.max),
    longitude: getRandomCoordinate(LIMA_BOUNDS.lng.min, LIMA_BOUNDS.lng.max),
    status: status,
    driverName: sampleDrivers[Math.floor(Math.random() * sampleDrivers.length)],
    speedKph: speedKph,
    fuelLevel: Math.floor(Math.random() * 80) + 20, // 20-99%
    lastMaintenance: subDays(new Date(), Math.floor(Math.random() * 180)).toISOString(), // Within last 6 months
  };
}

export function GET(req: NextRequest) {
  const vehicles = Array.from({ length: 50 }, (_, i) => generateVehicle(i));
  return NextResponse.json(vehicles);
}
