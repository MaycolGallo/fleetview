
// The processed and flattened data structure used throughout the app's components and state
export interface Vehicle {
  id_ubicacion: number;
  id_vehiculo: number;
  coordenadas: string;
  id_estado: number;
  fecha: number;
  velocidad: string;
  rumbo: number;
  odometro: string;
  senal_gsm: number;
  nivel_bateria_vehicular: string;
  vehiculo: {
    vehiculo_placa: string;
  };
  estado: {
    id_estado: number;
    param1: string; // Status name, e.g., "Transitando"
    param3: string; // Status color hex, e.g., "#00CC33"
  };
}

export type VehicleStatus = string;

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
