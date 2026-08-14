
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { RawVehicle } from '@/lib/types';

// Lima, Peru bounding box
const LIMA_BOUNDS = {
  lat: { min: -12.25, max: -11.80 },
  lng: { min: -77.15, max: -76.90 },
};

const TEST_CLUSTER_CENTER = { lat: -12.046374, lng: -77.042793 };
const METERS_PER_DEGREE = 111_320;

function getStableCoordinate(index: number) {
  // The first ten vehicles are intentionally clustered about one meter apart
  // so the map decluttering behavior can be tested from the vehicle list.
  if (index < 10) {
    return {
      lat: TEST_CLUSTER_CENTER.lat + (index * 1.1) / METERS_PER_DEGREE,
      lng: TEST_CLUSTER_CENTER.lng,
    };
  }

  const column = (index - 10) % 8;
  const row = Math.floor((index - 10) / 8);
  return {
    lat: -12.20 + row * 0.018,
    lng: -77.12 + column * 0.025,
  };
}

const STATUS_DEFINITIONS = [
    { id: 0, name: 'Libre', color: '#B0BEC5' },
    { id: 1, name: 'SRalenti', color: '#78909C' },
    { id: 2, name: 'Detenido y Encendido', color: '#F1C40F' },
    { id: 3, name: 'Exceso de Velocidad', color: '#E74C3C' },
    { id: 4, name: 'Ralenti', color: '#9E9E9E' },
    { id: 5, name: 'Estacionado', color: '#666666' },
    { id: 6, name: 'Transitando', color: '#00CC33' },
    { id: 7, name: 'Bloqueado', color: '#003399' },
    { id: 8, name: 'Batería Desconectada', color: '#FF66B0' },
    { id: 9, name: 'Mantenimiento', color: '#8D6E63' },
    { id: 10, name: 'Encendido Remoto', color: '#27AE60' },
];

const samplePlacas = [
  'ASG-831', 'B2H-576', 'C9A-123', 'D4F-987', 'E1G-456',
  'F8J-321', 'G5K-789', 'H3L-654', 'I7M-912', 'J2N-234',
  'K4P-567', 'L6Q-890', 'M1R-109', 'N5S-876', 'P3T-543'
];

function generateVehicle(index: number): RawVehicle {
  const statusDef = STATUS_DEFINITIONS[index % STATUS_DEFINITIONS.length];
  
  let speed = 0;
  if (statusDef.id === 6) {
    speed = 20 + (index * 7) % 60;
  } else if (statusDef.id === 3) {
    speed = 80 + (index * 11) % 40;
  }

  const { lat, lng } = getStableCoordinate(index);

  return {
    id_ubicacion: 10000 + index,
    id_vehiculo: 1000 + index,
    coordenadas: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    id_estado: statusDef.id,
    fecha: 1_722_000_000 + index * 60,
    velocidad: speed.toFixed(2),
    rumbo: (index * 23) % 360,
    odometro: (45_000 + index * 1_250).toFixed(2),
    senal_gsm: 20 + (index % 12),
    nivel_bateria_vehicular: (12.2 + (index % 16) / 10).toFixed(2),
    vehiculo: {
      vehiculo_placa: samplePlacas[index % samplePlacas.length],
    },
    estado: {
      id_estado: statusDef.id,
      param1: statusDef.name,
      param3: statusDef.color,
    },
  };
}

export function GET(req: NextRequest) {
  const vehicles = Array.from({ length: 50 }, (_, i) => generateVehicle(i));
  return NextResponse.json(vehicles);
}
