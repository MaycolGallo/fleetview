
// The raw, nested data structure from the API
export interface RawVehicle {
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
    param1: string; // Status name
    param3: string; // Status color
  };
}

// The processed and flattened data structure used throughout the app's components and state
export interface Vehicle {
  id_ubicacion: number;
  id_vehiculo: number;
  lat: number;
  lng: number;
  id_estado: number;
  fecha: number;
  velocidad: string;
  rumbo: number;
  odometro: string;
  senal_gsm: number;
  nivel_bateria_vehicular: string;
  placa: string;
  statusName: string;
  statusColor: string;
}

export type VehicleStatus = string;

export interface VehiculoUbicacionHistorial {
  id: string;
  id_vehiculo: number;
  coordenadas: string;
  tramas_validas: number;
  id_estado: number;
  velocidad: string;
  rumbo: number;
  odometro: string;
  horometro: string;
  numero_satelites: number;
  nivel_bateria: string;
  temperatura: string | null;
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

export interface VehiculoHistorialGrouped {
  id_estado: number;
  description: string;
  color: string;
  count: number;
  start_id: string;
  end_id: string;
  total_time_seconds: number;
  total_time_formatted: string;
  avg_velocidad: number;
  max_velocidad: number;
  total_distance_km: number;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  records: VehiculoUbicacionHistorial[];
}

export interface VHistorial {
  groups: VehiculoHistorialGrouped[];
  total_distance_km: number;
  total_time_seconds: number;
  total_time_formatted: string;
  by_estado: {
    [key: number]: {
      name: string;
      total_time_seconds: number;
      total_time_formatted: string;
      total_distance_km: number;
      count: number;
    };
  };
}

export type MapViewport =
  | { type: 'initial' }
  | { type: 'idle' }
  | { type: 'pan_to_vehicle'; payload: { lat: number; lng: number } }
  | { type: 'fit_bounds'; payload: { lat: number; lng: number }[] }
  | { type: 'fit_route'; payload: { lat: number; lng: number }[] };
