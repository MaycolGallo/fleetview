export interface VehicleStatusDefinition {
  id: number;
  name: string;
  color: string;
}

export const VEHICLE_STATUS_DEFINITIONS: VehicleStatusDefinition[] = [
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

export function getVehicleStatusDefinition(id: number): VehicleStatusDefinition {
  return VEHICLE_STATUS_DEFINITIONS.find((status) => status.id === id)
    ?? VEHICLE_STATUS_DEFINITIONS[0];
}
