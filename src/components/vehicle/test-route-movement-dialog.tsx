'use client';

import { useState } from 'react';

const LAST_ROUTE_INPUTS_KEY = 'fleetview:last-route-inputs';

type RouteInputs = { start: { lat: string; lng: string }; end: { lat: string; lng: string } };

function readLastRouteInputs(): RouteInputs | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(LAST_ROUTE_INPUTS_KEY);
    return saved ? JSON.parse(saved) as RouteInputs : null;
  } catch {
    return null;
  }
}
import { Loader2, Route, Pause, Play } from 'lucide-react';
import { useFleetState } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Vehicle } from '@/lib/types';
import { useFleetDispatch } from '@/context/fleet-context';

function normalizeVehicleLongitude(longitude: number) {
  // Demo vehicle payloads may contain a positive Lima longitude from the mock
  // coordinate adapter. Keep user-entered values untouched, but make the
  // prefilled vehicle start point routable in Peru.
  return longitude > 0 && longitude < 90 ? -longitude : longitude;
}

export function TestRouteMovementDialog({ vehicle, open, onOpenChange }: { vehicle: Vehicle; open: boolean; onOpenChange: (open: boolean) => void }) {
  const dispatch = useFleetDispatch();
  const { state } = useFleetState();
  const [lastRoute] = useState<RouteInputs | null>(() => readLastRouteInputs());
  const [start, setStart] = useState(() => lastRoute?.start ?? { lat: String(vehicle.lat), lng: String(normalizeVehicleLongitude(Number(vehicle.lng))) });
  const [end, setEnd] = useState(() => lastRoute?.end ?? { lat: '', lng: '' });
  const [rememberLastRoute, setRememberLastRoute] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      if (rememberLastRoute) {
        window.localStorage.setItem(LAST_ROUTE_INPUTS_KEY, JSON.stringify({ start, end }));
      }
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
      dispatch({ type: 'HIDE_ROUTE_SHEET' });
      dispatch({ type: 'START_ROUTE_PLAYBACK' });
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado'); }
    finally { setLoading(false); }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>
    <DialogHeader><DialogTitle>Test route movement</DialogTitle><DialogDescription>Calcula una ruta real y reproduce sus coordenadas para probar la animación.</DialogDescription></DialogHeader>
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="start-lat">Inicio latitud</Label><Input id="start-lat" value={start.lat} onChange={(e) => setStart({ ...start, lat: e.target.value })} required /></div><div className="grid gap-2"><Label htmlFor="start-lng">Inicio longitud</Label><Input id="start-lng" value={start.lng} onChange={(e) => setStart({ ...start, lng: e.target.value })} required /></div></div>
      <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="end-lat">Destino latitud</Label><Input id="end-lat" value={end.lat} onChange={(e) => setEnd({ ...end, lat: e.target.value })} required /></div><div className="grid gap-2"><Label htmlFor="end-lng">Destino longitud</Label><Input id="end-lng" value={end.lng} onChange={(e) => setEnd({ ...end, lng: e.target.value })} required /></div></div>
      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <label htmlFor="remember-last-route" className="flex items-center gap-2 text-sm">
          <input id="remember-last-route" type="checkbox" checked={rememberLastRoute} onChange={(event) => setRememberLastRoute(event.target.checked)} />
          Recordar última ruta
        </label>
        {lastRoute && <Button type="button" variant="ghost" size="sm" onClick={() => { setStart(lastRoute.start); setEnd(lastRoute.end); }}>Usar anterior</Button>}
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <DialogFooter className="gap-2 sm:justify-between">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => dispatch({ type: state.isRoutePlaying ? 'PAUSE_ROUTE_PLAYBACK' : 'START_ROUTE_PLAYBACK' })} disabled={!state.routeGroups.length}>
            {state.isRoutePlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {state.isRoutePlaying ? 'Pausar' : 'Continuar'}
          </Button>
        </div>
        <Button type="submit" disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Route className="mr-2 h-4 w-4" />}Calcular y reproducir</Button>
      </DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
