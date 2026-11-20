
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
  const [isTelemetryActive, setIsTelemetryActive] = React.useState(false);

  const togglePanel = (panel: PanelType) => {
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: activePanel === panel ? null : panel });
  };

  React.useEffect(() => {
    if (!isTelemetryActive) return;

    const timer = window.setInterval(() => {
      dispatch({ type: 'SIMULATE_VEHICLE_MOVE', payload: { elapsedSeconds: 1, timestamp: Math.floor(Date.now() / 1000) } });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [dispatch, isTelemetryActive]);

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
          label={isTelemetryActive ? 'Detener actualización GPS en vivo' : 'Iniciar actualización GPS en vivo'}
          isActive={isTelemetryActive}
          onClick={() => setIsTelemetryActive((active) => !active)}
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
