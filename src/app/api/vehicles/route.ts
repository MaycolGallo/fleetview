
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Vehicle } from '@/lib/types';

// Lima, Peru bounding box
const LIMA_BOUNDS = {
  lat: { min: -12.25, max: -11.80 },
  lng: { min: -77.15, max: -76.90 },
};

function getRandomCoordinate(min: number, max: number) {
  return Math.random() * (max - min) + min;
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

function generateVehicle(index: number): Vehicle {
  const statusDef = STATUS_DEFINITIONS[Math.floor(Math.random() * STATUS_DEFINITIONS.length)];
  
  let speed = 0;
  if (statusDef.id === 6) { // Transitando
    speed = Math.floor(Math.random() * 60) + 20; // 20-79 km/h
  } else if (statusDef.id === 3) { // Exceso de velocidad
    speed = Math.floor(Math.random() * 40) + 80; // 80-119 km/h
  }

  const lat = getRandomCoordinate(LIMA_BOUNDS.lat.min, LIMA_BOUNDS.lat.max);
  const lng = getRandomCoordinate(LIMA_BOUNDS.lng.min, LIMA_BOUNDS.lng.max);

  return {
    id_ubicacion: 10000 + index,
    id_vehiculo: 1000 + index,
    coordenadas: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    id_estado: statusDef.id,
    fecha: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600), // Within the last hour
    velocidad: speed.toFixed(2),
    rumbo: Math.floor(Math.random() * 360),
    odometro: (Math.random() * 100000).toFixed(2),
    senal_gsm: Math.floor(Math.random() * 32),
    nivel_bateria_vehicular: (Math.random() * (13.8 - 12.0) + 12.0).toFixed(2),
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
