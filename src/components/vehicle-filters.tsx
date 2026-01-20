

"use client";

import React, { useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFleetState, useFleetDispatch, statusDetailsMap, ALL_STATUSES } from "@/context/fleet-context";
import type { VehicleStatus } from "@/lib/types";

interface VehicleFiltersProps {}

function VehicleFiltersInternal(props: VehicleFiltersProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { statusFilter, vehicles } = state;
  
  const onFilterChange = useCallback((filter: 'all' | VehicleStatus) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: filter });
  }, [dispatch]);

  const count = vehicles.length;

  return (
    <div className="grid gap-2">
      <Select value={statusFilter} onValueChange={(value) => onFilterChange(value as 'all' | VehicleStatus)}>
        <SelectTrigger 
          id="status-filter" 
          className="w-full h-10"
        >
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <SelectItem value="all">All Vehicles ({count})</SelectItem>
          {ALL_STATUSES.map(status => {
            const statusCount = vehicles.filter(v => v.status === status).length;
            return (
                <SelectItem key={status} value={status}>
                    {statusDetailsMap[status].name} ({statusCount})
                </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export const VehicleFilters = React.memo(VehicleFiltersInternal);
