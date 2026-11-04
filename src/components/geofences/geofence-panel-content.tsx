'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPinned, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

const GeofenceMapPreview = dynamic(() => import('./geofence-map-preview').then((module) => module.GeofenceMapPreview), { ssr: false });

export function GeofencePanelContent() {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const [open, setOpen] = useState(false);
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
    const points = polygon.split(';').map((point) => { const [pointLat, pointLng] = point.split(',').map(Number); return { lat: pointLat, lng: pointLng }; }).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
    if (shape === 'polygon' && points.length < 3) return;
    dispatch({ type: 'ADD_GEOFENCE', payload: { id: crypto.randomUUID(), name: name.trim(), shape, center: shape === 'circle' ? { lat: Number(lat), lng: Number(lng) } : null, radius: shape === 'circle' ? Number(radius) : null, polygon: shape === 'polygon' ? points : null, event, vehicleId: vehicleId === 'all' ? null : Number(vehicleId), enabled: true } });
    setName(''); setOpen(false);
  };

  return <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
    <div><h2 className="flex items-center gap-2 text-lg font-semibold"><MapPinned className="h-5 w-5 text-primary" /> Geocercas</h2><p className="text-xs text-muted-foreground">Administra las zonas visibles y sus reglas.</p></div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="w-full"><Plus className="mr-2 h-4 w-4" />Nueva geocerca</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Crear geocerca</DialogTitle><DialogDescription>Define una zona y la acción que debe activar.</DialogDescription></DialogHeader>
        <div className="grid gap-6 md:grid-cols-2"><div className="min-w-0 space-y-4"><div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Almacén central" /></div>
          <Tabs value={shape} onValueChange={(value) => setShape(value as typeof shape)}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="circle">Radio</TabsTrigger><TabsTrigger value="polygon">Polígono</TabsTrigger></TabsList>
            <TabsContent value="circle" className="space-y-2"><div className="grid grid-cols-2 gap-2"><div><Label>Latitud</Label><Input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" /></div><div><Label>Longitud</Label><Input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" /></div></div><div><Label>Radio (m)</Label><Input value={radius} onChange={(e) => setRadius(e.target.value)} inputMode="numeric" /></div></TabsContent>
            <TabsContent value="polygon" className="space-y-2"><Label>Coordenadas</Label><Input value={polygon} onChange={(e) => setPolygon(e.target.value)} placeholder="lat,lng; lat,lng; lat,lng" /><p className="text-[11px] text-muted-foreground">Usa al menos 3 puntos separados por punto y coma.</p></TabsContent>
          </Tabs>
          <div className="space-y-2"><Label>Acción</Label><Select value={event} onValueChange={(value) => setEvent(value as typeof event)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="enter">Alarma al entrar</SelectItem><SelectItem value="exit">Alarma al salir</SelectItem><SelectItem value="enter_first">Autodispatch al entrar por primera vez</SelectItem><SelectItem value="exit_first">Autodispatch al salir por primera vez</SelectItem></SelectContent></Select></div>
          </div><div className="min-w-0 space-y-4"><div className="space-y-2"><Label>Vista previa en el mapa</Label><GeofenceMapPreview shape={shape} center={shape === 'circle' ? { lat: Number(lat), lng: Number(lng) } : null} radius={Number(radius) || 1} polygon={polygon.split(';').map((point) => { const [pointLat, pointLng] = point.split(',').map(Number); return { lat: pointLat, lng: pointLng }; })} /></div>
          <div className="space-y-2"><Label>Vehículo</Label><Select value={vehicleId} onValueChange={setVehicleId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toda la flota</SelectItem>{state.vehicles.map((vehicle) => <SelectItem key={vehicle.id_vehiculo} value={String(vehicle.id_vehiculo)}>{vehicle.nombre || `Vehículo ${vehicle.id_vehiculo}`}</SelectItem>)}</SelectContent></Select></div>
          <Button className="w-full" onClick={create}>Crear geocerca</Button>
        </div></div>
      </DialogContent>
    </Dialog>
    <div className="space-y-2">{state.geofences.map((geofence) => <div key={geofence.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div><p className="font-medium">{geofence.name}</p><p className="text-xs capitalize text-muted-foreground">{geofence.shape} · {geofence.event.replace('_', ' ')}</p></div><div className="flex items-center gap-1"><Button variant="ghost" size="icon" title={geofence.enabled ? 'Ocultar en el mapa' : 'Mostrar en el mapa'} onClick={() => dispatch({ type: 'TOGGLE_GEOFENCE', payload: geofence.id })}>{geofence.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</Button><Button variant="ghost" size="icon" title="Eliminar" onClick={() => dispatch({ type: 'REMOVE_GEOFENCE', payload: geofence.id })}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>
  </div>;
}
