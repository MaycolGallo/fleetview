
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2Icon, AlertTriangle, ExternalLink, PlayCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

export function ApiKeyInstructions() {
  const router = useRouter();

  const handleDemoMode = () => {
    // In a real app, we might set a cookie or state. 
    // For this prototype, we'll just allow navigating if the key is missing 
    // but the user wants to see the UI shells.
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
                Este error ocurre cuando tu API Key es válida pero el proyecto de Google Cloud no tiene una cuenta de facturación activa. Google requiere facturación habilitada para usar los mapas (aunque ofrecen una cuota gratuita mensual).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <section>
              <h3 className="font-bold flex items-center gap-2 mb-2">
                1. Habilitar Facturación
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Ve a la consola de Google Cloud y asegúrate de que tu proyecto esté vinculado a una cuenta de facturación.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://console.cloud.google.com/billing" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  Consola de Facturación <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </section>

            <section>
              <h3 className="font-bold flex items-center gap-2 mb-2">
                2. Configurar Variables de Entorno
              </h3>
              <p className="text-sm text-muted-foreground">
                Crea un archivo <code>.env.local</code> en la raíz del proyecto con tu llave:
              </p>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto border">
                <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI</code>
              </pre>
            </section>
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 gap-2" variant="default" onClick={() => window.location.reload()}>
              Reintentar Conexión
            </Button>
            <Button className="flex-1 gap-2" variant="secondary" onClick={handleDemoMode}>
              <PlayCircle className="w-4 h-4" /> Ver Interfaz (Modo Demo)
            </Button>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground">
            Nota: En Modo Demo las funciones de mapa podrían no cargar correctamente si la llave sigue fallando.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
