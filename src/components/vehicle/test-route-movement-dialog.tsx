'use client';

import { useState } from 'react';
import { Loader2, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Vehicle } from '@/lib/types';
import { useFleetDispatch } from '@/context/fleet-context';

export function TestRouteMovementDialog({ vehicle, open, onOpenChange }: { vehicle: Vehicle; open: boolean; onOpenChange: (open: boolean) => void }) {
  const dispatch = useFleetDispatch();
  const [start, setStart] = useState({ lat: String(vehicle.lat), lng: String(vehicle.lng) });
  const [end, setEnd] = useState({ lat: '', lng: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ startLat: start.lat, startLng: start.lng, endLat: end.lat, endLng: end.lng });
      const response = await fetch(`/api/route-test?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo calcular la ruta');
      const coordinates = data.routes?.[0]?.legs?.flatMap((leg: any) => leg.steps?.flatMap((step: any) => step.geometry?.coordinates ?? [])) ?? [];
      const points = coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng, rumbo: 0, fecha: Math.floor(Date.now() / 1000), velocidad: '35' }));
      if (points.length < 2) throw new Error('La ruta no devolvió suficientes puntos');
      const interval = 2;
      points.forEach((point: any, index: number) => { point.fecha += index * interval; });
      dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle });
      dispatch({ type: 'SET_ROUTE_HISTORY', payload: { groups: [{ id_estado: 6, total_time_seconds: Math.max(61, points.length * interval + 1), records: points }], by_estado: {} } });
      dispatch({ type: 'START_ROUTE_PLAYBACK' });
      onOpenChange(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado'); }
    finally { setLoading(false); }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>
    <DialogHeader><DialogTitle>Test route movement</DialogTitle><DialogDescription>Calcula una ruta real y reproduce sus coordenadas para probar la animación.</DialogDescription></DialogHeader>
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="start-lat">Inicio latitud</Label><Input id="start-lat" value={start.lat} onChange={(e) => setStart({ ...start, lat: e.target.value })} required /></div><div className="grid gap-2"><Label htmlFor="start-lng">Inicio longitud</Label><Input id="start-lng" value={start.lng} onChange={(e) => setStart({ ...start, lng: e.target.value })} required /></div></div>
      <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="end-lat">Destino latitud</Label><Input id="end-lat" value={end.lat} onChange={(e) => setEnd({ ...end, lat: e.target.value })} required /></div><div className="grid gap-2"><Label htmlFor="end-lng">Destino longitud</Label><Input id="end-lng" value={end.lng} onChange={(e) => setEnd({ ...end, lng: e.target.value })} required /></div></div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <DialogFooter><Button type="submit" disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Route className="mr-2 h-4 w-4" />}Calculate and play</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
