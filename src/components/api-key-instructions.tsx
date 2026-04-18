
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2Icon, AlertTriangle, ExternalLink, PlayCircle, Info } from "lucide-react";
import { useRouter } from 'next/navigation';

export function ApiKeyInstructions() {
  const router = useRouter();

  const handleDemoMode = () => {
    // Navigate to demo mode which uses mock data and placeholder maps
    window.location.href = '/?demo=true';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-primary/20">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Code2Icon className="w-6 h-6 text-primary" />
            </div>
            Configuración de Google Maps Requerida
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Error Detectado: BillingNotEnabledMapError</p>
              <p className="text-amber-800/80 dark:text-amber-200/80">
                Tu API Key es válida, pero el proyecto de Google Cloud no tiene una cuenta de facturación activa. Google requiere esto para habilitar los servicios de mapas, incluso si te mantienes dentro de su cuota gratuita.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <section className="bg-muted/50 p-4 rounded-md border">
              <h3 className="font-bold flex items-center gap-2 mb-2 text-sm">
                <Info className="w-4 h-4 text-primary" /> ¿Por qué veo esto ahora?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acabamos de activar el <strong>APIProvider</strong> de Google Maps. Ahora que la app intenta renderizar mapas reales, los servidores de Google verifican los permisos de tu llave. Sin facturación habilitada, Google bloquea la carga del mapa.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">Pasos para solucionar:</h3>
              <ol className="list-decimal list-inside text-xs space-y-2 text-muted-foreground">
                <li>Ve a la <a href="https://console.cloud.google.com/billing" target="_blank" rel="noreferrer" className="text-primary underline">Consola de Facturación</a> de Google Cloud.</li>
                <li>Asegúrate de que tu proyecto tenga una tarjeta o cuenta vinculada.</li>
                <li>Verifica que la <strong>Maps JavaScript API</strong> esté habilitada en el "API Library".</li>
              </ol>
            </section>
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 gap-2" variant="default" onClick={() => window.location.reload()}>
              Reintentar Conexión
            </Button>
            <Button className="flex-1 gap-2" variant="secondary" onClick={handleDemoMode}>
              <PlayCircle className="w-4 h-4" /> Entrar en Modo Demo (Sin Mapas)
            </Button>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground">
            Nota: En Modo Demo verás la interfaz completa pero el mapa será reemplazado por un visor estático.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
