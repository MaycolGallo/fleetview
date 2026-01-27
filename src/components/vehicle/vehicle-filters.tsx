
"use client";

import React, { useCallback, useMemo } from 'react';
import { useFleetState, useFleetDispatch } from "@/context/fleet-context";
import type { VehicleStatus } from "@/lib/types";
import { MultiSelect } from '@/components/ui/multi-select';

interface VehicleFiltersProps {}

function VehicleFiltersInternal(props: VehicleFiltersProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { statusFilter, vehicles } = state;
  
  const onFilterChange = useCallback((filters: string[]) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: filters as VehicleStatus[] });
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
    <div className="grid gap-2">
      <MultiSelect
        options={options}
        onValueChange={onFilterChange}
        defaultValue={statusFilter}
        placeholder="Filter by status..."
        className="w-full"
      />
    </div>
  );
}

export const VehicleFilters = React.memo(VehicleFiltersInternal);
