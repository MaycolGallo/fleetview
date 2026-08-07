'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  BatteryFull,
  CalendarDays,
  CarFront,
  CircleGauge,
  Gauge,
  Palette,
  ScanLine,
  X,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import type { Vehicle } from '@/lib/types';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85',
];

function formatValue(value: string | number | null | undefined, suffix = '') {
  if (value === null || value === undefined || value === '') return 'No disponible';
  return `${value}${suffix}`;
}

function VehicleMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function VehicleDetailsDialog({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const images = vehicle.imageUrls?.length ? vehicle.imageUrls : FALLBACK_IMAGES;
  const fuel = vehicle.fuelLevel ?? vehicle.nivel_combustible;
  const engine = vehicle.engine ?? vehicle.motor;
  const model = vehicle.model ?? vehicle.modelo;
  const year = vehicle.year ?? vehicle.anio;
  const color = vehicle.color;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="z-[100] inset-y-0 right-0 bottom-auto left-auto mt-0 h-full w-full max-w-xl rounded-l-2xl rounded-r-none border-l p-0">
          <DrawerHeader className="border-b px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DrawerTitle className="flex items-center gap-2 text-xl">
                  <CarFront className="h-5 w-5 text-primary" aria-hidden="true" />
                  {vehicle.placa}
                </DrawerTitle>
                <DrawerDescription className="mt-1">
                  Información general y estado del vehículo
                </DrawerDescription>
              </div>
              <Badge className="shrink-0 text-white" style={{ backgroundColor: vehicle.statusColor }}>
                {vehicle.statusName}
              </Badge>
            </div>
          </DrawerHeader>

          <div className="space-y-6 p-6">
            <section aria-label="Imágenes del vehículo" className="space-y-3">
              <Carousel opts={{ loop: true }} className="mx-auto w-full max-w-3xl">
                <CarouselContent>
                  {images.map((src, index) => (
                    <CarouselItem key={`${src}-${index}`}>
                      <button
                        type="button"
                        className="group relative block aspect-[16/8] w-full overflow-hidden rounded-xl border bg-muted text-left"
                        onClick={() => setSelectedImage(src)}
                        aria-label={`Abrir imagen ${index + 1} de ${images.length}`}
                      >
                        <Image
                          src={src}
                          alt={`Vehículo ${vehicle.placa}, vista ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 90vw, 720px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                        <span className="absolute bottom-3 right-3 rounded-md bg-background/85 px-2 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                          Abrir imagen
                        </span>
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-3" />
                <CarouselNext className="right-3" />
              </Carousel>
              <p className="text-center text-xs text-muted-foreground">Selecciona una imagen para verla en tamaño completo</p>
            </section>

            <section aria-label="Información del vehículo" className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Información del vehículo</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <VehicleMetric icon={ScanLine} label="ID vehículo" value={vehicle.id_vehiculo} />
                <VehicleMetric icon={CarFront} label="Modelo" value={formatValue(model)} />
                <VehicleMetric icon={CalendarDays} label="Año" value={formatValue(year)} />
                <VehicleMetric icon={Palette} label="Color" value={formatValue(color)} />
                <VehicleMetric icon={CircleGauge} label="Combustible" value={formatValue(fuel, fuel === undefined ? '' : '%')} />
                <VehicleMetric icon={Gauge} label="Odómetro" value={formatValue(Number(vehicle.odometro).toLocaleString(), ' km')} />
                <VehicleMetric icon={BatteryFull} label="Batería" value={formatValue(vehicle.nivel_bateria_vehicular, ' V')} />
                <VehicleMetric icon={Gauge} label="Motor" value={formatValue(engine)} />
              </div>
            </section>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={selectedImage !== null} onOpenChange={(nextOpen) => !nextOpen && setSelectedImage(null)} direction="right">
        <DrawerContent className="z-[110] inset-y-0 right-0 bottom-auto left-auto mt-0 h-full w-full max-w-6xl rounded-l-2xl rounded-r-none border-l bg-background/95 p-2 sm:p-4">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Imagen ampliada del vehículo {vehicle.placa}</DrawerTitle>
            <DrawerDescription>Vista completa de la imagen seleccionada</DrawerDescription>
          </DrawerHeader>
          <div className="relative flex min-h-[50vh] items-center justify-center overflow-hidden rounded-lg bg-muted">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt={`Imagen ampliada del vehículo ${vehicle.placa}`}
                width={1600}
                height={1000}
                className="max-h-[80vh] w-auto max-w-full object-contain"
                unoptimized
              />
            )}
          </div>
          <DrawerClose asChild>
            <button type="button" className="absolute right-4 top-4 rounded-full bg-background/90 p-2 shadow" aria-label="Cerrar imagen">
              <X className="h-4 w-4" />
            </button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    </>
  );
}
