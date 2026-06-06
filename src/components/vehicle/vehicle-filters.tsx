
"use client";

import React, { useCallback, useMemo, useTransition } from 'react';
import { useFleetState, useFleetDispatch } from "@/context/fleet-context";
import type { VehicleStatus } from "@/lib/types";
import { MultiSelect } from '@/components/ui/multi-select';
import { Loader2 } from 'lucide-react';

interface VehicleFiltersProps {}

function VehicleFiltersInternal(props: VehicleFiltersProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { statusFilter, vehicles } = state;
  
  const [isPending, startTransition] = useTransition();

  const onFilterChange = useCallback((filters: string[]) => {
    startTransition(() => {
        dispatch({ type: 'SET_STATUS_FILTER', payload: filters as VehicleStatus[] });
    });
  }, [dispatch]);

  const options = useMemo(() => {
    const statusMap = new Map<string, { name: string, count: number }>();
    
    vehicles.forEach(v => {
      const statusId = String(v.id_estado);
      if (!statusMap.has(statusId)) {
        statusMap.set(statusId, { name: v.statusName, count: 0 });
      }
      statusMap.get(statusId)!.count++;
    });

    return Array.from(statusMap.entries()).map(([statusId, { name, count }]) => ({
      value: statusId,
      label: `${name} (${count})`,
    }));
  }, [vehicles]);


  return (
    <div className="grid gap-2 relative">
      <MultiSelect
        options={options}
        onValueChange={onFilterChange}
        defaultValue={statusFilter}
        placeholder="Filtrar por estado..."
        className="w-full"
        disabled={isPending}
      />
      {isPending && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

export const VehicleFilters = React.memo(VehicleFiltersInternal);
