
'use client';

import React, { useMemo } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, Activity, Battery, ShieldAlert, Sparkles, RefreshCw, Loader2, Navigation } from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateFleetSummary } from '@/ai/flows/fleet-summary-flow';
import { simulateVehicleTelemetry } from '@/ai/flows/simulate-vehicle-telemetry';
import { toast } from '@/hooks/use-toast';

export function FleetAnalyticsContent() {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { vehicles, notifications, aiFleetInsight, isLoadingAiInsight, isSimulatingAiPatrol } = state;

  const statusStats = useMemo(() => {
    const counts: Record<string, { count: number, color: string }> = {};
    vehicles.forEach(v => {
      if (!counts[v.statusName]) {
        counts[v.statusName] = { count: 0, color: v.statusColor };
      }
      counts[v.statusName].count++;
    });
    return Object.entries(counts).map(([name, data]) => ({
      name,
      value: data.count,
      color: data.color
    })).sort((a, b) => b.value - a.value);
  }, [vehicles]);

  const batteryDistribution = useMemo(() => {
    const ranges = [
        { label: '<12V', count: 0 },
        { label: '12-12.5V', count: 0 },
        { label: '12.5-13V', count: 0 },
        { label: '>13V', count: 0 },
    ];
    vehicles.forEach(v => {
        const val = parseFloat(v.nivel_bateria_vehicular);
        if (val < 12) ranges[0].count++;
        else if (val < 12.5) ranges[1].count++;
        else if (val < 13) ranges[2].count++;
        else ranges[3].count++;
    });
    return ranges;
  }, [vehicles]);

  const handleGetAiInsight = async () => {
    dispatch({ type: 'SET_AI_INSIGHT_LOADING', payload: true });
    try {
        const input = {
            vehicles: vehicles.slice(0, 15).map(v => ({
                placa: v.placa,
                status: v.statusName,
                speed: v.velocidad,
                battery: v.nivel_bateria_vehicular
            })),
            incidents: notifications.slice(0, 5).map(n => ({
                description: n.description,
                placa: n.placa || 'Unknown',
                type: n.type
            }))
        };
        const insight = await generateFleetSummary(input);
        dispatch({ type: 'SET_AI_INSIGHT', payload: JSON.stringify(insight) });
    } catch (e) {
        console.error(e);
        toast({ title: "Error de IA", description: "No se pudo conectar con el comandante de flota.", variant: "destructive" });
    } finally {
        dispatch({ type: 'SET_AI_INSIGHT_LOADING', payload: false });
    }
  };

  const handleSimulateAiPatrol = async () => {
    dispatch({ type: 'SET_AI_PATROL_LOADING', payload: true });
    try {
        const result = await simulateVehicleTelemetry({ numberOfVehicles: Math.min(10, vehicles.length) });
        
        // Map simulated points to existing vehicle IDs
        const updates = result.map((sim, i) => ({
            id: vehicles[i].id_vehiculo,
            lat: sim.latitude,
            lng: sim.longitude,
            status: sim.status === 'active' ? 'Transitando' : sim.status === 'idle' ? 'Ralenti' : 'Mantenimiento'
        }));

        dispatch({ type: 'UPDATE_VEHICLE_POSITIONS', payload: updates });
        toast({ title: "AI Patrol Sync", description: "La flota ha sido posicionada por la IA." });
    } catch (e) {
        console.error(e);
        toast({ title: "Error de Simulación", description: "No se pudo contactar con el simulador GenAI.", variant: "destructive" });
    } finally {
        dispatch({ type: 'SET_AI_PATROL_LOADING', payload: false });
    }
  };

  const aiData = aiFleetInsight ? JSON.parse(aiFleetInsight) : null;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="p-4 border-b space-y-4 bg-muted/20">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                    <h2 className="text-lg font-bold leading-tight">Inteligencia de Flota</h2>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        Análisis Operativo en Tiempo Real
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
              <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                  onClick={handleSimulateAiPatrol}
                  disabled={isSimulatingAiPatrol}
              >
                  {isSimulatingAiPatrol ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
              </Button>
              <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold"
                  onClick={handleGetAiInsight}
                  disabled={isLoadingAiInsight}
              >
                  {isLoadingAiInsight ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  IA BRIEFING
              </Button>
            </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
            {/* AI Insights Card */}
            {aiData && (
                <Card className="border-primary/20 bg-primary/5 shadow-inner animate-in zoom-in-95 duration-500">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Resumen del Comandante
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border">
                             <span className="text-[10px] font-bold text-muted-foreground uppercase">Health Score</span>
                             <Badge variant={aiData.healthScore > 80 ? "default" : "destructive"} className="font-mono">
                                {aiData.healthScore}%
                             </Badge>
                        </div>
                        <p className="text-xs leading-relaxed italic text-foreground/80">
                            "{aiData.summary}"
                        </p>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase text-destructive tracking-wider">Acciones Sugeridas:</p>
                            {aiData.criticalActions.map((action: string, i: number) => (
                                <div key={i} className="flex gap-2 text-[10px] text-muted-foreground border-l-2 border-primary/30 pl-2">
                                    <span className="text-primary">•</span> {action}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Status Distribution */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold uppercase text-muted-foreground">Distribución de Estados</h3>
                </div>
                <div className="h-[200px] w-full bg-card rounded-xl border p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <ChartTooltip 
                                contentStyle={{ borderRadius: '8px', fontSize: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {statusStats.slice(0, 4).map(s => (
                        <div key={s.name} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                <span className="text-[10px] font-medium truncate max-w-[80px]">{s.name}</span>
                            </div>
                            <span className="text-[10px] font-bold">{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Battery Health */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold uppercase text-muted-foreground">Salud de Baterías (V)</h3>
                </div>
                <div className="h-[180px] w-full bg-card rounded-xl border p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={batteryDistribution}>
                            <XAxis dataKey="label" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <ChartTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', fontSize: '10px' }} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Alerts Ticker */}
            <div className="space-y-3 pb-6">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-destructive" />
                    <h3 className="text-xs font-bold uppercase text-muted-foreground">Críticos Recientes</h3>
                </div>
                <div className="space-y-2">
                    {notifications.slice(0, 3).map((n, i) => (
                        <div key={i} className="p-2 rounded-lg border-l-4 border-l-destructive bg-destructive/5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold">{n.description}</p>
                                <p className="text-[8px] text-muted-foreground">Unidad: {n.placa}</p>
                            </div>
                            <Badge variant="outline" className="text-[8px] border-destructive/20 text-destructive">URGENTE</Badge>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-muted/5 flex items-center justify-between">
          <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
             Fleet Analytics v2.0
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => window.location.reload()}>
              <RefreshCw className="w-3 h-3" />
          </Button>
      </div>
    </div>
  );
}
