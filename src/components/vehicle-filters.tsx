

"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFleet, statusDetailsMap, ALL_STATUSES } from "@/context/fleet-context";
import type { VehicleStatus } from "@/lib/types";

interface VehicleFiltersProps {}

export function VehicleFilters(props: VehicleFiltersProps) {
  const { state, dispatch } = useFleet();
  const { statusFilter, vehicles } = state;
  
  const onFilterChange = (filter: 'all' | VehicleStatus) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: filter });
  }

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
