export type VehicleStatus = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

export interface Vehicle {
  id: number;
  lat: number;
  lng: number;
  id_vehiculo: number;
  placa: string;
  velocidad: number;
  odometro: string;
  rumbo: number;
  status: VehicleStatus;
  nombre_estado: string;
  fecha: number;
  bateria: string;
  bateria_vehiculo: string;
  senal_gsm: number;
}

export interface VehicleHistoryPoint {
  id: string;
  id_vehiculo: number;
  coordenadas: string;
  tramas_validas: number;
  id_estado: string;
  velocidad: string;
  rumbo: number;
  odometro: string;
  horometro: string;
  numero_satelites: number;
  nivel_bateria: string;
  temperatura: string;
  senal_gsm: number;
  nivel_bateria_vehicular: string;
  id_cliente: number;
  din: number;
  fecha: number;
  altitud: number;
  codigo: number;
  param1: string;
  param2: string;
  param3: string;
  param4: string;
  created_at: string;
  updated_at: string | null;
}

export interface RouteSegment {
  id_estado: string;
  description: string;
  durationMinutes: number;
  distanceKm: number;
  avgSpeed: number;
  startTime: number;
  endTime: number;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  records: VehicleHistoryPoint[];
}

export interface RouteHistory {
  // Array of paths for each moving segment
  routePoints: { lat: number; lng: number }[][];
  // Detailed segments
  segments: RouteSegment[];
}
