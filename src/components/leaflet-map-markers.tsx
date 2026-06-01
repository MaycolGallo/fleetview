'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Marker } from 'react-leaflet';
import type { Point, Vehicle, Incidencia } from '@/lib/types';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { VehicleContextMenu } from '@/components/vehicle/vehicle-context-menu';
import { VehicleMobileContextMenu } from '@/components/vehicle/vehicle-mobile-context-menu';
import { createDivIcon, createVehicleIconHtml, createIconHtml, incidenceIconMap, incidenceColorMap } from './leaflet-map-helpers';

interface LeafletMarkerProps {
  position: Point;
  iconHtml: string;
  zIndex?: number;
  eventHandlers?: any;
}

export function LeafletMarker({ position, iconHtml, zIndex = 0, eventHandlers }: LeafletMarkerProps) {
  const icon = useMemo(() => createDivIcon(iconHtml), [iconHtml]);

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={icon}
      eventHandlers={eventHandlers}
      zIndexOffset={zIndex}
    />
  );
}

export function LeafletVehicleMarker({ vehicle }: { vehicle: Vehicle }) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const isMobile = useIsMobile();
  const { selectedVehicle } = state;
  const isSelected = selectedVehicle?.id_vehiculo === vehicle.id_vehiculo;
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const touchTimer = useRef<number | null>(null);
  const targetPosition = { lat: vehicle.lat, lng: vehicle.lng };

  const handlePan = useCallback(() => {
    dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
  }, [dispatch, vehicle]);

  const handleClick = useCallback((e: any) => {
    e.originalEvent?.stopPropagation();
    handlePan();
    if (isMobile) {
      setDrawerOpen(true);
    }
  }, [handlePan, isMobile]);

  const handleContextMenu = useCallback((e: any) => {
    const original = e.originalEvent as MouseEvent;
    if (!original) return;
    original.preventDefault();
    original.stopPropagation();
    setMenuPosition({ x: original.clientX, y: original.clientY });
  }, []);

  const handleTouchStart = useCallback((e: any) => {
    e.originalEvent?.stopPropagation();
    if (!isMobile) return;
    touchTimer.current = window.setTimeout(() => {
      setDrawerOpen(true);
    }, 500);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimer.current) {
      window.clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  }, []);

  const iconHtml = useMemo(() => createVehicleIconHtml(vehicle, isSelected), [vehicle, isSelected]);
  const eventHandlers = useMemo(() => ({
    click: handleClick,
    contextmenu: handleContextMenu,
    touchstart: handleTouchStart,
    touchend: handleTouchEnd,
  }), [handleClick, handleContextMenu, handleTouchStart, handleTouchEnd]);

  return (
    <>
      <LeafletMarker
        position={targetPosition}
        iconHtml={iconHtml}
        zIndex={isSelected ? 1000 : 0}
        eventHandlers={eventHandlers}
      />
      {menuPosition && (
        <VehicleContextMenu
          vehicle={vehicle}
          position={menuPosition}
          onClose={() => setMenuPosition(null)}
        />
      )}
      {drawerOpen && isMobile && (
        <VehicleMobileContextMenu
          isOpen={drawerOpen}
          onOpenChange={setDrawerOpen}
          vehicle={vehicle}
        />
      )}
    </>
  );
}

export function LeafletIncidenciaMarker({ incidencia, isSelected, onClick }: { incidencia: Incidencia; isSelected: boolean; onClick: () => void; }) {
  const iconSvg = incidenceIconMap[incidencia.type] ?? incidenceIconMap.excessive_idle;
  const color = incidenceColorMap[incidencia.type] ?? '#6B7280';
  const iconHtml = createIconHtml(iconSvg, color);

  return (
    <LeafletMarker
      position={{ lat: incidencia.lat, lng: incidencia.lng }}
      iconHtml={iconHtml}
      zIndex={isSelected ? 1000 : 500}
      eventHandlers={{ click: onClick }}
    />
  );
}

export function LeafletEventMarker({ position, color }: { position: Point; color: string }) {
  const iconHtml = createIconHtml('<path d="M10 0h4v12h-4V0z" fill="currentColor"/>', color);
  return <LeafletMarker position={position} iconHtml={iconHtml} zIndex={200} />;
}
