'use client';

import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { GitGraph } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ClusteringToggle() {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { enableMarkerClustering } = state;

  const handleToggle = () => {
    dispatch({ type: 'TOGGLE_MARKER_CLUSTERING' });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={enableMarkerClustering ? 'default' : 'outline'}
            size="icon"
            onClick={handleToggle}
            className="h-9 w-9"
            title="Toggle marker clustering"
          >
            <GitGraph className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {enableMarkerClustering ? 'Disable Clustering' : 'Enable Clustering'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
