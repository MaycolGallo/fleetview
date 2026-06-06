'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useFleetState } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Share2, Clock, Car, Copy, Check, Globe, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const EXPIRATION_OPTIONS = [
  { label: '1 Hora', value: String(1 * 60 * 60 * 1000) },
  { label: '4 Horas', value: String(4 * 60 * 60 * 1000) },
  { label: '12 Horas', value: String(12 * 60 * 60 * 1000) },
  { label: '24 Horas', value: String(24 * 60 * 60 * 1000) },
  { label: '7 Días', value: String(7 * 24 * 60 * 60 * 1000) },
];

export function SharePanelContent() {
  const { state } = useFleetState();
  const { vehicles } = state;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expiration, setExpiration] = useState(EXPIRATION_OPTIONS[0].value);
  const [generatedLink, setGeneratedLink] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const vehicleOptions = useMemo(() => {
    return vehicles.map(v => ({
      label: `${v.placa} (${v.statusName})`,
      value: String(v.id_vehiculo),
      icon: Car
    }));
  }, [vehicles]);

  const handleGenerateLink = () => {
    if (selectedIds.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos un vehículo", variant: "destructive" });
      return;
    }

    startTransition(() => {
        const payload = {
          ids: selectedIds.map(Number),
          exp: Date.now() + Number(expiration)
        };

        const token = btoa(JSON.stringify(payload));
        const url = `${window.location.origin}/?s=${token}`;
        setGeneratedLink(url);
        setHasCopied(false);
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setHasCopied(true);
    toast({ title: "Copiado", description: "Enlace copiado al portapapeles" });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="p-4 border-b space-y-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-bold leading-tight">Compartir Rastreo</h2>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Crear enlace público temporal
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Car className="w-3 h-3" /> Seleccionar Unidades
            </label>
            <MultiSelect
              options={vehicleOptions}
              onValueChange={setSelectedIds}
              defaultValue={selectedIds}
              placeholder="Elegir vehículos..."
              className="bg-background"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Clock className="w-3 h-3" /> Tiempo de Expiración
            </label>
            <Select value={expiration} onValueChange={setExpiration} disabled={isPending}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Seleccionar tiempo" />
              </SelectTrigger>
              <SelectContent>
                {EXPIRATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerateLink} className="w-full h-12 font-bold gap-2" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            GENERAR ENLACE PÚBLICO
          </Button>

          {generatedLink && (
            <div className="p-4 rounded-xl border bg-primary/5 space-y-3 animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-primary">Enlace de rastreo listo</span>
                <Badge variant="outline" className="text-[9px] bg-background">Público</Badge>
              </div>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="bg-background text-xs" />
                <Button size="icon" variant="outline" onClick={copyToClipboard} className="shrink-0">
                  {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic text-center">
                Cualquier persona con este link podrá ver las unidades seleccionadas hasta que expire.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/5">
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border text-xs text-muted-foreground">
          <Share2 className="w-4 h-4 text-primary shrink-0" />
          <p>Los enlaces compartidos son de solo lectura y no permiten ver el historial completo ni configuraciones.</p>
        </div>
      </div>
    </div>
  );
}
