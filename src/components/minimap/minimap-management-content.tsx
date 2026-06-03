'use client';

import React, { useState, useMemo } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Radar, Plus, Trash2, X, Car, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MiniMapManagementContent() {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { miniMaps, predefinedMiniMaps, vehicles } = state;

  const [newMapName, setNewMapName] = useState('');

  const vehicleOptions = useMemo(() => {
    return vehicles.map(v => ({
      label: `${v.placa} (${v.statusName})`,
      value: String(v.id_vehiculo),
      icon: Car
    }));
  }, [vehicles]);

  const handleCreateMap = () => {
    if (!newMapName.trim()) return;
    dispatch({ 
        type: 'CREATE_MINIMAP_MANUAL', 
        payload: { name: newMapName.trim() } 
    });
    setNewMapName('');
  };

  const handleUpdateVehicles = (mapId: string, vehicleIds: string[]) => {
    dispatch({
        type: 'UPDATE_MINIMAP_VEHICLES',
        payload: { miniMapId: mapId, vehicleIds: vehicleIds.map(Number) }
    });
  };

  const handleRemoveMap = (id: string) => {
    dispatch({ type: 'REMOVE_MINIMAP', payload: id });
  };

  const handleAddPredefinedMap = (id: string) => {
    dispatch({ type: 'ADD_PREDEFINED_MINIMAP', payload: id });
  };

  // Get available predefined minimaps (not already active)
  const availablePredefinedMaps = predefinedMiniMaps.filter(
    pm => !miniMaps.some(am => am.id === pm.id)
  );

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <Tabs defaultValue="available" className="flex-1 flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <Radar className="w-5 h-5 text-primary" />
            <div>
                <h2 className="text-lg font-bold leading-tight">Radar Groups</h2>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    {miniMaps.length} activos
                </p>
            </div>
          </div>
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="available" className="text-xs">
              Disponibles ({availablePredefinedMaps.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">
              Activos ({miniMaps.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Available Predefined Minimaps Tab */}
        <TabsContent value="available" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {availablePredefinedMaps.length === 0 ? (
                <div className="text-center py-12 px-6 text-muted-foreground">
                  <Radar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">Todos los radares están activos.</p>
                  <p className="text-xs mt-1">Elimina uno del panel activo para agregarlo aquí.</p>
                </div>
              ) : (
                availablePredefinedMaps.map((map) => (
                  <div key={map.id} className="p-3 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="p-1 bg-primary/10 rounded">
                          <Radar className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm">{map.name}</span>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-7 gap-1"
                        onClick={() => handleAddPredefinedMap(map.id)}
                      >
                        <Plus className="w-3 h-3" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Active Minimaps Tab */}
        <TabsContent value="active" className="flex-1 m-0 flex flex-col">
          <div className="p-4 border-b bg-muted/20 space-y-3">
            <div className="flex gap-2">
              <Input 
                  placeholder="Nombre del nuevo radar..." 
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateMap()}
                  className="h-10 text-sm"
              />
              <Button size="icon" onClick={handleCreateMap} disabled={!newMapName.trim()}>
                  <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {miniMaps.length === 0 ? (
                  <div className="text-center py-12 px-6 text-muted-foreground">
                      <Radar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-medium">No hay mini-maps activos.</p>
                      <p className="text-xs mt-1">Agrega uno disponible o crea uno personalizado.</p>
                  </div>
              ) : (
                  miniMaps.map((map) => (
                      <div key={map.id} className="p-4 rounded-xl border bg-card shadow-sm space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                          <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-primary/10 rounded-lg">
                                      <Radar className="w-4 h-4 text-primary" />
                                  </div>
                                  <span className="font-bold text-sm">{map.name}</span>
                                  <Badge variant="secondary" className="text-[10px] h-4">
                                      {map.vehicleIds.length}
                                  </Badge>
                              </div>
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() => handleRemoveMap(map.id)}
                              >
                                  <Trash2 className="w-4 h-4" />
                              </Button>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                                  Asignar Unidades
                              </label>
                              <MultiSelect
                                  options={vehicleOptions}
                                  onValueChange={(val) => handleUpdateVehicles(map.id, val)}
                                  defaultValue={map.vehicleIds.map(String)}
                                  placeholder="Seleccionar vehículos..."
                                  className="bg-background shadow-none"
                                  maxCount={2}
                              />
                          </div>

                          {map.vehicleIds.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                  {map.vehicleIds.map(id => {
                                      const v = vehicles.find(v => v.id_vehiculo === id);
                                      if (!v) return null;
                                      return (
                                          <Badge key={id} variant="outline" className="text-[10px] gap-1 pr-1 bg-muted/30">
                                              {v.placa}
                                              <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="h-3 w-3 hover:bg-transparent"
                                                  onClick={() => {
                                                      const nextIds = map.vehicleIds.filter(vid => vid !== id);
                                                      handleUpdateVehicles(map.id, nextIds.map(String));
                                                  }}
                                              >
                                                  <X className="w-2 h-2" />
                                              </Button>
                                          </Badge>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                  ))
              )}
            </div>
          </ScrollArea>
          
          {miniMaps.length > 0 && (
              <div className="p-4 border-t bg-muted/5">
                  <Button 
                    variant="outline" 
                    className="w-full h-10 text-xs font-bold gap-2 text-destructive border-destructive/20 hover:bg-destructive/5"
                    onClick={() => dispatch({ type: 'CLEAR_ALL_MINIMAPS' })}
                  >
                      <Trash2 className="w-4 h-4" />
                      LIMPIAR TODO
                  </Button>
              </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
