'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RemoteActionsFilterProps {
  showInProgress: boolean;
  showFailed: boolean;
  onToggleInProgress: (value: boolean) => void;
  onToggleFailed: (value: boolean) => void;
}

export function RemoteActionsFilter({
  showInProgress,
  showFailed,
  onToggleInProgress,
  onToggleFailed,
}: RemoteActionsFilterProps) {
  const isActive = showInProgress || showFailed;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={showInProgress ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToggleInProgress(!showInProgress)}
        className={cn(
          'gap-2 transition-all',
          showInProgress && 'bg-blue-600 hover:bg-blue-700'
        )}
      >
        <Clock className="w-4 h-4" />
        En Progreso
      </Button>
      
      <Button
        variant={showFailed ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToggleFailed(!showFailed)}
        className={cn(
          'gap-2 transition-all',
          showFailed && 'bg-red-600 hover:bg-red-700'
        )}
      >
        <AlertTriangle className="w-4 h-4" />
        Fallidas
      </Button>

      {isActive && (
        <div className="text-xs text-muted-foreground">
          Filtrado activo
        </div>
      )}
    </div>
  );
}
