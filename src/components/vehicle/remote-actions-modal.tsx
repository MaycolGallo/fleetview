'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Power, AlertTriangle, Lock, Volume2, Droplet, Wind } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Vehicle } from '@/lib/types';

type RemoteAction = 'engine_off' | 'panic' | 'doors' | 'immobilize' | 'horn' | 'fuel_cut' | 'ac' | 'idle';

interface ActionConfig {
  id: RemoteAction;
  label: string;
  icon: React.ReactNode;
  color: string;
  duration: number;
}

const REMOTE_ACTIONS: ActionConfig[] = [
  { id: 'engine_off', label: 'Apagar Motor', icon: <Power className="w-5 h-5" />, color: 'bg-red-600 hover:bg-red-700', duration: 3000 },
  { id: 'panic', label: 'Pánico', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-orange-600 hover:bg-orange-700', duration: 2500 },
  { id: 'doors', label: 'Cerrar Puertas', icon: <Lock className="w-5 h-5" />, color: 'bg-blue-600 hover:bg-blue-700', duration: 2000 },
  { id: 'immobilize', label: 'Inmovilizar', icon: <Lock className="w-5 h-5" />, color: 'bg-purple-600 hover:bg-purple-700', duration: 3500 },
  { id: 'horn', label: 'Claxon', icon: <Volume2 className="w-5 h-5" />, color: 'bg-yellow-600 hover:bg-yellow-700', duration: 1500 },
  { id: 'fuel_cut', label: 'Cortar Combustible', icon: <Droplet className="w-5 h-5" />, color: 'bg-red-700 hover:bg-red-800', duration: 3000 },
  { id: 'ac', label: 'Control de AC', icon: <Wind className="w-5 h-5" />, color: 'bg-cyan-600 hover:bg-cyan-700', duration: 2000 },
  { id: 'idle', label: 'Marcha Idle', icon: <Power className="w-5 h-5" />, color: 'bg-gray-600 hover:bg-gray-700', duration: 2500 },
];

export function RemoteActionsModal({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [executingAction, setExecutingAction] = useState<RemoteAction | null>(null);
  const [progress, setProgress] = useState(0);
  const [actionDuration, setActionDuration] = useState(0);

  const executeAction = async (action: RemoteAction) => {
    const config = REMOTE_ACTIONS.find(a => a.id === action);
    if (!config) return;

    setExecutingAction(action);
    setActionDuration(config.duration);
    setProgress(0);

    // Simulate progress over the duration
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (config.duration / 50));
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    // Complete after duration
    await new Promise(resolve => setTimeout(resolve, config.duration));
    clearInterval(interval);
    setExecutingAction(null);
    setProgress(0);
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Acciones Remotas - {vehicle.placa}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecciona una acción para ejecutar en el vehículo. Solo se puede ejecutar una acción a la vez.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {REMOTE_ACTIONS.map((action) => {
              const isExecuting = executingAction === action.id;
              const isDisabled = executingAction !== null && !isExecuting;

              return (
                <div key={action.id} className="space-y-2">
                  <Button
                    onClick={() => executeAction(action.id)}
                    disabled={isDisabled || isExecuting}
                    className={`w-full h-20 ${action.color} text-white font-semibold transition-all ${isExecuting ? 'opacity-100' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {isExecuting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        action.icon
                      )}
                      <span className="text-sm">{action.label}</span>
                    </div>
                  </Button>

                  {isExecuting && (
                    <div className="space-y-1">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-center text-muted-foreground">
                        {Math.round(progress)}%
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {executingAction && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Ejecutando acción en vehículo {vehicle.placa}...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
