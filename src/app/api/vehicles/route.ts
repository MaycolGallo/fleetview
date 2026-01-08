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

const statusMap: { [key in VehicleStatus]: string } = {
  '0': 'Sin Cobertura',
  '1': 'Vehiculo Detenido y Apagado',
  '2': 'Vehiculo Detenido y Encendido',
  '3': 'Exceso de Velocidad',
  '4': 'Alarma de Panico',
  '5': 'Alarma de Puerta',
  '6': 'El vehiculo esta transitando',
  '7': 'Bateria del GPS Desconectada',
  '8': 'Bateria del GPS Baja',
  '9': 'Motor Apagado via Remoto',
  '10': 'Motor Encendido via Remoto',
};


const samplePlacas = [
  'ASG-831', 'B2H-576', 'C9A-123', 'D4F-987', 'E1G-456',
  'F8J-321', 'G5K-789', 'H3L-654', 'I7M-912', 'J2N-234',
  'K4P-567', 'L6Q-890', 'M1R-109', 'N5S-876', 'P3T-543'
];

function generateVehicle(index: number): Vehicle {
  const status = (Math.floor(Math.random() * 11)).toString() as VehicleStatus;
  
  let speed = 0;
  if (status === '6') { // Transitando
    speed = Math.floor(Math.random() * 60) + 20; // 20-79 km/h
  } else if (status === '3') { // Exceso de velocidad
    speed = Math.floor(Math.random() * 40) + 80; // 80-119 km/h
  }

  return {
    id: index,
    lat: getRandomCoordinate(LIMA_BOUNDS.lat.min, LIMA_BOUNDS.lat.max),
    lng: getRandomCoordinate(LIMA_BOUNDS.lng.min, LIMA_BOUNDS.lng.max),
    id_vehiculo: 1000 + index,
    placa: samplePlacas[Math.floor(Math.random() * samplePlacas.length)],
    velocidad: speed,
    odometro: (Math.random() * 100000).toFixed(2),
    rumbo: Math.floor(Math.random() * 360),
    status: status,
    nombre_estado: statusMap[status],
    fecha: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600), // Within the last hour
    bateria: (Math.random() * (4.2 - 3.5) + 3.5).toFixed(2), // GPS battery
    bateria_vehiculo: (Math.random() * (13.8 - 12.0) + 12.0).toFixed(2), // Vehicle battery
  };
}

export function GET(req: NextRequest) {
  const vehicles = Array.from({ length: 50 }, (_, i) => generateVehicle(i));
  return NextResponse.json(vehicles);
}
