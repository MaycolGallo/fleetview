"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((mod) => mod.LeafletMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

const FleetMapGoogle = dynamic(
  () => import("./fleet-map-google").then((mod) => mod.FleetMapGoogle),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

interface FleetMapProps {
  apiKey: string;
  side?: "ida" | "vuelta";
  trackedVehicleIds?: number[];
  isMainMap?: boolean;
}

export function FleetMap({
  apiKey,
  side,
  trackedVehicleIds,
  isMainMap,
}: FleetMapProps) {
  const { state } = useFleetState();
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const { isMapDark, vehicles, focusedMiniMapId, miniMaps } = state;

  const isFocusMode = isMainMap && focusedMiniMapId;
  const focusedGroup = isFocusMode
    ? miniMaps.find((m) => m.id === focusedMiniMapId)
    : null;

  const trackedVehicles =
    (trackedVehicleIds
      ?.map((id) => vehicles.find((v) => v.id_vehiculo === id))
      .filter(Boolean) as Vehicle[]) || [];
  const isTrackingView = trackedVehicles.length > 0;

  if (provider === "google") {
    return (
      <FleetMapGoogle
        key={`google-${mapProviderKey}`}
        apiKey={apiKey}
        side={side}
        trackedVehicleIds={trackedVehicleIds}
        isOverview={isOverview}
      />
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full relative">
        <Map
          defaultCenter={{ lat: -12.046374, lng: -77.042793 }}
          defaultZoom={isTrackingView || isFocusMode ? 16 : 13}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          mapId={isMapDark ? DARK_MAP_ID : LIGHT_MAP_ID}
          colorScheme={isMapDark ? ColorScheme.DARK : ColorScheme.LIGHT}
        >
          <MapControl
            side={side}
            trackedVehicleIds={trackedVehicleIds}
            isMainMap={isMainMap}
          />
        </Map>
        {(side || isTrackingView || isFocusMode) && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {side && (
              <div className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-primary">
                {side === "ida" ? "Ida" : "Vuelta"}
              </div>
            )}
            {isTrackingView && (
              <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-white">
                RADAR: {trackedVehicles.length}
              </div>
            )}
            {isFocusMode && (
              <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-white">
                FOCUS: {focusedGroup?.name}
              </div>
            )}
          </div>
        )}
      </div>
    </APIProvider>
  );
}
