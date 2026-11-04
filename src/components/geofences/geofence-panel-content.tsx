'use client';

import { useState } from 'react';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPinned, Plus, Trash2 } from 'lucide-react';

export function GeofencePanelContent() {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const [name, setName] = useState('');
  const [shape, setShape] = useState<'circle' | 'polygon'>('circle');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('500');
  const [polygon, setPolygon] = useState('');
  const [event, setEvent] = useState<'enter' | 'exit' | 'enter_first' | 'exit_first'>('enter');
  const [vehicleId, setVehicleId] = useState('all');

  const create = () => {
    if (!name.trim()) return;
    if (shape === 'circle' && (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || Number(radius) <= 0)) return;
    if (shape === 'polygon' && polygon.split(';').filter(Boolean).length < 3) return;
    dispatch({ type: 'ADD_GEOFENCE', payload: {
      id: crypto.randomUUID(), name: name.trim(), shape,
      center: shape === 'circle' ? { lat: Number(lat), lng: Number(lng) } : null,
      radius: shape === 'circle' ? Number(radius) : null,
      polygon: shape === 'polygon' ? polygon.split(';').map((point) => { const [pointLat, pointLng] = point.split(',').map(Number); return { lat: pointLat, lng: pointLng }; }) : null,
      event, vehicleId: vehicleId === 'all' ? null : Number(vehicleId), enabled: true,
    }});
    setName('');
  };

  return <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
    <div><h2 className="flex items-center gap-2 text-lg font-semibold"><MapPinned className="h-5 w-5 text-primary" /> Geocercas</h2><p className="text-xs text-muted-foreground">Alertas y autodispatch por entrada o salida.</p></div>
    <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Almacén central" /></div>
    <Tabs value={shape} onValueChange={(value) => setShape(value as typeof shape)}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="circle">Radio</TabsTrigger><TabsTrigger value="polygon">Polígono</TabsTrigger></TabsList>
      <TabsContent value="circle" className="space-y-2"><div className="grid grid-cols-2 gap-2"><div><Label>Latitud</Label><Input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" /></div><div><Label>Longitud</Label><Input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" /></div></div><div><Label>Radio (m)</Label><Input value={radius} onChange={(e) => setRadius(e.target.value)} inputMode="numeric" /></div></TabsContent>
      <TabsContent value="polygon" className="space-y-2"><Label>Coordenadas</Label><Input value={polygon} onChange={(e) => setPolygon(e.target.value)} placeholder="lat,lng; lat,lng; lat,lng" /><p className="text-[11px] text-muted-foreground">Usa al menos 3 puntos separados por punto y coma.</p></TabsContent>
    </Tabs>
    <div className="space-y-2"><Label>Acción</Label><Select value={event} onValueChange={(value) => setEvent(value as typeof event)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="enter">Alarma al entrar</SelectItem><SelectItem value="exit">Alarma al salir</SelectItem><SelectItem value="enter_first">Autodispatch al entrar por primera vez</SelectItem><SelectItem value="exit_first">Autodispatch al salir por primera vez</SelectItem></SelectContent></Select></div>
    <div className="space-y-2"><Label>Vehículo</Label><Select value={vehicleId} onValueChange={setVehicleId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toda la flota</SelectItem>{state.vehicles.map((vehicle) => <SelectItem key={vehicle.id_vehiculo} value={String(vehicle.id_vehiculo)}>{vehicle.nombre || `Vehículo ${vehicle.id_vehiculo}`}</SelectItem>)}</SelectContent></Select></div>
    <Button onClick={create}><Plus className="mr-2 h-4 w-4" />Crear geocerca</Button>
    <div className="space-y-2">{state.geofences.map((geofence) => <div key={geofence.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div><p className="font-medium">{geofence.name}</p><p className="text-xs text-muted-foreground">{geofence.event.replace('_', ' ')}</p></div><Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'REMOVE_GEOFENCE', payload: geofence.id })}><Trash2 className="h-4 w-4" /></Button></div>)}</div>
  </div>;
}
