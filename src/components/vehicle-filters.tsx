"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VehicleStatus } from "@/lib/types";

interface VehicleFiltersProps {
  currentFilter: string;
  onFilterChange: (filter: 'all' | VehicleStatus) => void;
}

export function VehicleFilters({ currentFilter, onFilterChange }: VehicleFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground hidden sm:block">
        Filter by Status:
      </label>
      <Select value={currentFilter} onValueChange={(value) => onFilterChange(value as 'all' | VehicleStatus)}>
        <SelectTrigger id="status-filter" className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Vehicles</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="idle">Idle</SelectItem>
          <SelectItem value="out-of-service">Out of Service</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
