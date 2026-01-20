
'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { routeStatusDetailsMap } from '@/context/fleet-context';

interface EventMarkerProps {
    position: { lat: number; lng: number };
    duration: number;
    status: string;
}

function formatDuration(minutes: number) {
  if (minutes < 1) return '< 1 min';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  let result = '';
  if (h > 0) result += `${h}h `;
  if (m > 0) result += `${m}m`;
  return result.trim();
}

export function EventMarker({ position, duration, status }: EventMarkerProps) {
    const statusInfo = routeStatusDetailsMap[status] || null;
    if (!statusInfo) return null;

    const Icon = statusInfo.icon;

    return (
        <AdvancedMarker position={position} zIndex={2}>
            <div className="flex flex-col items-center">
                <div 
                    className="flex items-center gap-2 bg-card/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-border/20"
                >
                    <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: statusInfo.color }}
                    >
                        <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">{statusInfo.name}</span>
                        <span className="text-xs text-muted-foreground">{formatDuration(duration)}</span>
                    </div>
                </div>
            </div>
        </AdvancedMarker>
    );
}
