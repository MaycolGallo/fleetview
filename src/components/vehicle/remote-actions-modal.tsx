'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Power, AlertTriangle, Lock, Volume2, Droplet, Wind, Check, X, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Vehicle, RemoteActionRecord } from '@/lib/types';

type RemoteAction = 'engine_off' | 'panic' | 'doors' | 'immobilize' | 'horn' | 'fuel_cut' | 'ac' | 'idle';

interface ActionConfig {
  id: RemoteAction;
  label: string;
  icon: React.ReactNode;
  color: string;
  duration: number;
  isHighRisk?: boolean;
  consequence?: string;
}

const REMOTE_ACTIONS: ActionConfig[] = [
  { id: 'engine_off', label: 'Apagar Motor', icon: <Power className="w-5 h-5" />, color: 'bg-red-600 hover:bg-red-700', duration: 3000, isHighRisk: true, consequence: 'Apaga el motor del vehículo. El vehículo no podrá reiniciar sin intervención manual.' },
  { id: 'panic', label: 'Pánico', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-orange-600 hover:bg-orange-700', duration: 2500, isHighRisk: true, consequence: 'Activa alarma de emergencia. Alerta a ocupantes y autoridades.' },
  { id: 'doors', label: 'Cerrar Puertas', icon: <Lock className="w-5 h-5" />, color: 'bg-blue-600 hover:bg-blue-700', duration: 2000 },
  { id: 'immobilize', label: 'Inmovilizar', icon: <Lock className="w-5 h-5" />, color: 'bg-purple-600 hover:bg-purple-700', duration: 3500, isHighRisk: true, consequence: 'Desactiva el sistema de encendido. El vehículo no podrá moverse.' },
  { id: 'horn', label: 'Claxon', icon: <Volume2 className="w-5 h-5" />, color: 'bg-yellow-600 hover:bg-yellow-700', duration: 1500 },
  { id: 'fuel_cut', label: 'Cortar Combustible', icon: <Droplet className="w-5 h-5" />, color: 'bg-red-700 hover:bg-red-800', duration: 3000, isHighRisk: true, consequence: 'Corta el suministro de combustible. El vehículo se detendrá inmediatamente.' },
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
  const [actionHistory, setActionHistory] = useState<RemoteActionRecord[]>([]);
  const [confirmAction, setConfirmAction] = useState<RemoteAction | null>(null);

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

    // Add to history
    const record: RemoteActionRecord = {
      id: `${vehicle?.id_vehiculo}-${Date.now()}`,
      vehicleId: vehicle?.id_vehiculo || 0,
      action: action,
      actionLabel: config.label,
      status: Math.random() > 0.1 ? 'success' : 'failed',
      timestamp: Date.now(),
      duration: config.duration,
      isHighRisk: config.isHighRisk || false,
      error: Math.random() > 0.1 ? undefined : 'Error de comunicación con el vehículo',
    };

    setActionHistory(prev => [record, ...prev]);
    setExecutingAction(null);
    setProgress(0);
  };

  const handleActionClick = (action: RemoteAction) => {
    const config = REMOTE_ACTIONS.find(a => a.id === action);
    if (config?.isHighRisk) {
      setConfirmAction(action);
    } else {
      executeAction(action);
    }
  };

  if (!vehicle) return null;

  return (
    <>
      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Confirmar Acción de Alto Riesgo
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {confirmAction && (
                <>
                  <p className="font-semibold text-foreground">
                    {REMOTE_ACTIONS.find(a => a.id === confirmAction)?.label}
                  </p>
                  <p className="text-sm">
                    {REMOTE_ACTIONS.find(a => a.id === confirmAction)?.consequence}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Esta acción no puede ser revertida fácilmente. Asegúrate de estar autorizado.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  executeAction(confirmAction);
                  setConfirmAction(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Acciones Remotas - {vehicle.placa}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="actions">Ejecutar Acciones</TabsTrigger>
              <TabsTrigger value="history">Historial ({actionHistory.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-4 mt-4">
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
                        onClick={() => handleActionClick(action.id)}
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
                          {action.isHighRisk && <span className="text-xs opacity-75">⚠️ Alto Riesgo</span>}
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
            </TabsContent>

            <TabsContent value="history" className="space-y-3 mt-4">
              {actionHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay historial de acciones remotas
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {actionHistory.map((record) => (
                    <div key={record.id} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{record.actionLabel}</span>
                          {record.isHighRisk && <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">Alto Riesgo</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {record.status === 'success' && <Check className="w-4 h-4 text-green-600" />}
                          {record.status === 'failed' && <X className="w-4 h-4 text-red-600" />}
                          {record.status === 'in_progress' && <Clock className="w-4 h-4 text-blue-600" />}
                          <span className={`text-xs font-medium ${
                            record.status === 'success' ? 'text-green-600' :
                            record.status === 'failed' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {record.status === 'success' ? 'Exitosa' :
                             record.status === 'failed' ? 'Fallida' :
                             'En Progreso'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.timestamp).toLocaleString('es-ES')}
                      </p>
                      {record.error && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Error: {record.error}
                        </p>
                      )}
                      {record.duration && (
                        <p className="text-xs text-muted-foreground">
                          Duración: {(record.duration / 1000).toFixed(1)}s
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
