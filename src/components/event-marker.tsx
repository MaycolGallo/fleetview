
'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { routeStatusDetailsMap } from '@/context/fleet-context';

interface EventMarkerProps {
    position: { lat: number; lng: number };
    duration: number;
    status: string;
}

function formatDuration(minutes: number) {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  }
  
  const totalMinutes = Math.round(minutes);
  if (totalMinutes < 60) {
      return `${totalMinutes}m`;
  }

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  let result = `${h}h`;
  if (m > 0) {
    result += ` ${m}m`;
  }
  return result;
}

export function EventMarker({ position, duration, status }: EventMarkerProps) {
    const statusInfo = routeStatusDetailsMap[status] || null;
    if (!statusInfo) return null;

    const Icon = statusInfo.icon;

    return (
        <AdvancedMarker position={position} zIndex={2}>
            <div className="flex flex-col items-center">
                {/* The label with duration */}
                <div className="bg-card/80 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md mb-1 whitespace-nowrap">
                    {formatDuration(duration)}
                </div>
                 {/* The icon marker */}
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-card"
                    style={{ backgroundColor: statusInfo.color }}
                >
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
        </AdvancedMarker>
    );
}
