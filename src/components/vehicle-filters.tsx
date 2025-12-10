
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFleet } from "@/context/fleet-context";
import type { VehicleStatus } from "@/lib/types";

interface VehicleFiltersProps {}

export function VehicleFilters(props: VehicleFiltersProps) {
  const { state, dispatch } = useFleet();
  const { statusFilter } = state;
  
  const onFilterChange = (filter: 'all' | VehicleStatus) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: filter });
  }

  return (
    <div className="grid gap-2">
      <Select value={statusFilter} onValueChange={(value) => onFilterChange(value as 'all' | VehicleStatus)}>
        <SelectTrigger 
          id="status-filter" 
          className="w-full h-10"
        >
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <SelectItem value="all">All Vehicles</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="idle">Idle</SelectItem>
          <SelectItem value="out-of-service">Out of Service</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
