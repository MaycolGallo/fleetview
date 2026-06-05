import type { RawVehicle, VHistorial, Incidencia, MiniMapGroup } from '@/lib/types';

export const SIMULATION_ROUTE = [
  { lat: -12.045, lng: -77.040 },
  { lat: -12.048, lng: -77.042 },
  { lat: -12.050, lng: -77.038 },
  { lat: -12.047, lng: -77.036 },
];

/**
 * MASTER_FLEET_ROUTE: The "Theoretical Standard Path" for the fleet.
 * Used as a visual baseline in Split View and for initial viewport framing.
 */
export const MASTER_FLEET_ROUTE = [
    { lat: -12.030, lng: -77.020 },
    { lat: -12.040, lng: -77.035 },
    { lat: -12.046, lng: -77.042 },
    { lat: -12.055, lng: -77.050 },
    { lat: -12.065, lng: -77.065 },
    { lat: -12.080, lng: -77.075 },
    { lat: -12.100, lng: -77.085 },
];

export const fetchVehicles = async (): Promise<RawVehicle[]> => {
  const res = await fetch('/api/vehicles');
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
};

export const fetchRouteHistory = async (vehicleId: number): Promise<VHistorial> => {
  const res = await fetch('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicleId }),
  });
  if (!res.ok) throw new Error('Failed to fetch route history');
  return res.json();
};

export const fetchIncidencias = async (vehicleId: number): Promise<Incidencia[]> => {
  const res = await fetch('/api/incidencias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicleId }),
  });
  if (!res.ok) throw new Error('Failed to fetch incidencias');
  return res.json();
};

export const fetchMiniMaps = async (): Promise<MiniMapGroup[]> => {
    // In a real app, this would be a GET request to a real database
    // For now, we simulate a small delay to show TanStack Query working
    const mockGroups: MiniMapGroup[] = [
        { id: 'group-1', name: 'Zona Industrial Sur', vehicleIds: [1001, 1005, 1008] },
        { id: 'group-2', name: 'Centro Histórico', vehicleIds: [1002, 1003] },
        { id: 'group-3', name: 'Ruta Panamericana', vehicleIds: [1007, 1010, 1012] },
    ];
    
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockGroups), 800);
    });
};
