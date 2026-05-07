
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

export interface Incidencia {
  id: string;
  type: 'panic' | 'harsh_accel' | 'harsh_brake' | 'speeding' | 'excessive_idle';
  lat: number;
  lng: number;
  timestamp: number;
  description: string;
  value?: string;
  placa?: string;
}

export interface Notification extends Incidencia {
  isRead: boolean;
}

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

// The processed record used in the UI, with parsed coordinates
export interface ProcessedRouteRecord extends Omit<VehiculoUbicacionHistorial, 'coordenadas'>{
    lat: number;
    lng: number;
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
  records: ProcessedRouteRecord[];
  address?: string;
  address_short?: string;
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

export interface MiniMapGroup {
  id: string;
  name: string;
  vehicleIds: number[];
}

export interface FleetState {
  vehicles: Vehicle[];
  statusFilter: VehicleStatus[];
  selectedVehicle: Vehicle | null;
  historyVehicle: Vehicle | null;
  routePath: { lat: number; lng: number }[][] | null;
  routeGroups: VehiculoHistorialGrouped[];
  by_estado: VHistorial['by_estado'];
  isRouteSheetOpen: boolean;
  isLoadingRoute: boolean;
  selectedSegmentIndex: number | null;
  visibleVehicleIds: Set<number>;
  miniMaps: MiniMapGroup[];
  isMapDark: boolean;
  mapViewport: MapViewport;
  simulationStep: Record<string, number>;
  pinRotationMode: 'arrow' | 'pin';
  isRoutePlaying: boolean;
  playbackAnimationDuration: number;
  isSplitView: boolean;
  splitDirection: 'horizontal' | 'vertical';
  wasSplitViewBeforeRoute: boolean;
  // Incidencias
  incidencias: Incidencia[];
  isLoadingIncidencias: boolean;
  isIncidenciasSheetOpen: boolean;
  selectedIncidenciaId: string | null;
  // Notifications
  notifications: Notification[];
  // Fleet Master Route
  masterRoute: { lat: number, lng: number }[];
}
