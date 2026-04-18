
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { APIProvider, Map, AdvancedMarker, ColorScheme } from '@vis.gl/react-google-maps';
import { useFleetState } from '@/context/fleet-context';
import { LIGHT_MAP_ID, DARK_MAP_ID } from '@/lib/map-styles';
import { ShieldAlert, Zap, AlertCircle, Gauge, Clock, MapPin, Calendar } from 'lucide-react';
import type { Notification } from '@/lib/types';
import { format, fromUnixTime } from 'date-fns';
import { cn } from '@/lib/utils';

const typeIconMap: Record<Notification['type'], React.ElementType> = {
  panic: ShieldAlert,
  harsh_accel: Zap,
  harsh_brake: AlertCircle,
  speeding: Gauge,
  excessive_idle: Clock,
};

const typeColorMap: Record<Notification['type'], string> = {
  panic: 'bg-red-500',
  harsh_accel: 'bg-amber-500',
  harsh_brake: 'bg-orange-500',
  speeding: 'bg-red-600',
  excessive_idle: 'bg-gray-500',
};

interface NotificationDetailDialogProps {
  apiKey: string;
  notification: Notification;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDetailDialog({ apiKey, notification, isOpen, onClose }: NotificationDetailDialogProps) {
  const { state } = useFleetState();
  const { isMapDark } = state;
  const Icon = typeIconMap[notification.type];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 gap-0 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-card border-b">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-full text-white shadow-lg", typeColorMap[notification.type])}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">{notification.description}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="font-bold text-foreground">{notification.placa}</span>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(fromUnixTime(notification.timestamp), 'Pp')}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="h-[400px] relative w-full">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={{ lat: notification.lat, lng: notification.lng }}
              defaultZoom={16}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              mapId={isMapDark ? DARK_MAP_ID : LIGHT_MAP_ID}
              colorScheme={isMapDark ? ColorScheme.dark : ColorScheme.light}
            >
              <AdvancedMarker position={{ lat: notification.lat, lng: notification.lng }}>
                <div className="flex flex-col items-center group">
                  <div className={cn(
                    "p-2 rounded-full text-white shadow-xl ring-4 ring-white transition-transform scale-125",
                    typeColorMap[notification.type]
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </AdvancedMarker>
            </Map>
          </APIProvider>
          
          <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-md p-4 rounded-xl border shadow-xl flex items-start gap-3">
             <div className="p-2 bg-primary/10 rounded-full">
                <MapPin className="w-5 h-5 text-primary" />
             </div>
             <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ubicación del Incidente</p>
                <p className="text-sm font-medium">
                  Coordenadas: {notification.lat.toFixed(6)}, {notification.lng.toFixed(6)}
                </p>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
