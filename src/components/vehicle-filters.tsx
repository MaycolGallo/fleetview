

"use client";

import React, { useCallback, useMemo } from 'react';
import { useFleetState, useFleetDispatch, statusDetailsMap, ALL_STATUSES } from "@/context/fleet-context";
import type { VehicleStatus } from "@/lib/types";
import { MultiSelect } from './ui/multi-select';

interface VehicleFiltersProps {}

function VehicleFiltersInternal(props: VehicleFiltersProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { statusFilter, vehicles } = state;
  
  const onFilterChange = useCallback((filters: string[]) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: filters as VehicleStatus[] });
  }, [dispatch]);

  const options = useMemo(() => {
    const statusCounts = ALL_STATUSES.reduce((acc, status) => {
        acc[status] = vehicles.filter(v => v.status === status).length;
        return acc;
    }, {} as Record<VehicleStatus, number>);

    return ALL_STATUSES.map(status => ({
        value: status,
        label: `${statusDetailsMap[status].name} (${statusCounts[status]})`,
        icon: statusDetailsMap[status].icon,
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
