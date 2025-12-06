"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VehicleStatus } from "@/lib/types";

interface VehicleFiltersProps {
  currentFilter: string;
  onFilterChange: (filter: 'all' | VehicleStatus) => void;
}

export function VehicleFilters({ currentFilter, onFilterChange }: VehicleFiltersProps) {
  return (
    <div className="grid gap-2">
      <Select value={currentFilter} onValueChange={(value) => onFilterChange(value as 'all' | VehicleStatus)}>
        <SelectTrigger 
          id="status-filter" 
          className="w-full h-10"
          onPointerDown={(e) => e.stopPropagation()}
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
