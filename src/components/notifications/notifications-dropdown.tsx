'use client';

import { useState } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, ShieldAlert, Zap, AlertCircle, Gauge, Clock, Trash2 } from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NotificationDetailDialog } from './notification-detail-dialog';
import type { Notification } from '@/lib/types';

const typeIconMap: Record<Notification['type'], React.ElementType> = {
  panic: ShieldAlert,
  harsh_accel: Zap,
  harsh_brake: AlertCircle,
  speeding: Gauge,
  excessive_idle: Clock,
};

const typeColorMap: Record<Notification['type'], string> = {
  panic: 'text-red-500',
  harsh_accel: 'text-amber-500',
  harsh_brake: 'text-orange-500',
  speeding: 'text-red-600',
  excessive_idle: 'text-gray-500',
};

interface NotificationsDropdownProps {
  apiKey: string;
}

export function NotificationsDropdown({ apiKey }: NotificationsDropdownProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { notifications } = state;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [selectedNoti, setSelectedNoti] = useState<Notification | null>(null);

  const handleNotiClick = (noti: Notification) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: noti.id });
    setSelectedNoti(noti);
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="relative shadow-lg bg-card/90 backdrop-blur-sm pointer-events-auto hover:scale-110 transition-transform active:scale-95"
          >
            <Bell className={cn("h-5 w-5", unreadCount > 0 && "animate-pulse")} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <Badge
                  className="relative h-5 w-5 flex items-center justify-center p-0 rounded-full bg-destructive text-[10px] shadow-sm"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 overflow-hidden bg-card/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200" align="end">
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <h3 className="font-semibold">Incidencias</h3>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground animate-in fade-in duration-500">
                <p className="text-sm">No hay incidencias nuevas</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((noti, index) => {
                  const Icon = typeIconMap[noti.type];
                  return (
                    <div
                      key={noti.id}
                      onClick={() => handleNotiClick(noti)}
                      className={cn(
                        "flex gap-3 p-4 cursor-pointer transition-all hover:bg-accent group animate-in slide-in-from-right-2 fade-in",
                        !noti.isRead && "bg-primary/5"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn("shrink-0 transition-transform group-hover:scale-125 duration-300", typeColorMap[noti.type])}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-semibold text-xs truncate">
                            {noti.description}: {noti.placa}
                          </p>
                          {!noti.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1 animate-pulse" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(fromUnixTime(noti.timestamp), 'Pp')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selectedNoti && (
        <NotificationDetailDialog
          apiKey={apiKey}
          notification={selectedNoti}
          isOpen={!!selectedNoti}
          onClose={() => setSelectedNoti(null)}
        />
      )}
    </>
  );
}