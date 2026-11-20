
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Radar, Car, Settings2, Share2, BarChart3, MapPinned, RadioTower } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { cn } from '@/lib/utils';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import type { PanelType } from '@/lib/types';

export function FloatingToolbar() {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { activePanel } = state;

  const togglePanel = (panel: PanelType) => {
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: activePanel === panel ? null : panel });
  };

  const simulateTelemetryUpdate = () => {
    const positions = state.vehicles.map((vehicle, index) => {
      const heading = ((vehicle.rumbo ?? 0) + (index % 2 === 0 ? 8 : -8) + 360) % 360;
      const distance = 0.00008 + (index % 5) * 0.00001;
      const radians = (heading * Math.PI) / 180;

      return {
        id_vehiculo: vehicle.id_vehiculo,
        lat: vehicle.lat + Math.cos(radians) * distance,
        lng: vehicle.lng + Math.sin(radians) * distance,
        rumbo: heading,
      };
    });

    dispatch({ type: 'UPDATE_VEHICLE_POSITIONS', payload: positions });
  };

  return (
    <div className="absolute top-6 left-6 z-50 flex flex-col gap-3">
      <div className="bg-card/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border flex flex-col gap-2 items-center">
        <div className="p-2 bg-primary/10 rounded-xl mb-1">
          <Radar className="w-6 h-6 text-primary" />
        </div>

        <TooltipProvider>
          <ToolbarButton 
            icon={Car} 
            label="Unidades" 
            isActive={activePanel === 'vehicles'} 
            onClick={() => togglePanel('vehicles')} 
          />
          <ToolbarButton 
            icon={Radar} 
            label="Gestión Radar" 
            isActive={activePanel === 'minimaps'} 
            onClick={() => togglePanel('minimaps')} 
          />
          <ToolbarButton
            icon={MapPinned}
            label="Geocercas"
            isActive={activePanel === 'geofences'}
            onClick={() => togglePanel('geofences')}
          />
          <ToolbarButton 
            icon={BarChart3} 
            label="Estadísticas" 
            isActive={activePanel === 'stats'} 
            onClick={() => togglePanel('stats')} 
          />
          <ToolbarButton 
            icon={Share2} 
            label="Compartir" 
            isActive={activePanel === 'share'} 
            onClick={() => togglePanel('share')} 
          />
          <ToolbarButton 
            icon={Settings2} 
            label="Vistas" 
            isActive={activePanel === 'settings'} 
            onClick={() => togglePanel('settings')} 
          />
        </TooltipProvider>

        <div className="w-full h-px bg-border my-1" />
        <ToolbarButton
          icon={RadioTower}
          label="Simular actualización GPS de toda la flota"
          isActive={false}
          disabled={state.vehicles.length === 0}
          onClick={simulateTelemetryUpdate}
        />
        <NotificationsDropdown apiKey="MOCK" />
      </div>
    </div>
  );
}

function ToolbarButton({ 
    icon: Icon, 
    label, 
    isActive,
    disabled = false,
    onClick
}: {
    icon: any,
    label: string,
    isActive: boolean,
    disabled?: boolean,
    onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant={isActive ? 'default' : 'ghost'} 
          size="icon" 
          className={cn("h-12 w-12 rounded-xl transition-all", isActive ? 'shadow-lg scale-105' : 'hover:bg-accent')}
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          <Icon className="h-6 w-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
