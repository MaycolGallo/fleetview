"use client";

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Vehicle } from '@/lib/types';
import { VehiclePin } from './vehicle-pin';

interface FleetMapProps {
  apiKey: string;
  vehicles: Vehicle[];
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedVehicle: Vehicle | null;
}

export function FleetMap({ apiKey, vehicles, onVehicleSelect, selectedVehicle }: FleetMapProps) {
  const defaultCenter = { lat: 39.8283, lng: -98.5795 };
  const defaultZoom = 4;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId="fleetview-map"
        className="w-full h-full"
      >
        {vehicles.map((vehicle) => (
          <AdvancedMarker
            key={vehicle.vehicleId}
            position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
            onClick={() => onVehicleSelect(vehicle)}
          >
            <VehiclePin status={vehicle.status} isSelected={selectedVehicle?.vehicleId === vehicle.vehicleId} />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
