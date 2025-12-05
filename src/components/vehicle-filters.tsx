
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VehicleStatus } from "@/lib/types";
import { Label } from "./ui/label";

interface VehicleFiltersProps {
  currentFilter: string;
  onFilterChange: (filter: 'all' | VehicleStatus) => void;
}

export function VehicleFilters({ currentFilter, onFilterChange }: VehicleFiltersProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">
        Filter by Status
      </Label>
      <Select value={currentFilter} onValueChange={(value) => onFilterChange(value as 'all' | VehicleStatus)}>
        <SelectTrigger 
          id="status-filter" 
          className="w-full"
        >
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
