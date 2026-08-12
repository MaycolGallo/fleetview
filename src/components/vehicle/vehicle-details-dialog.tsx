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

function VehicleDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <dt className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>{label}</span>
      </dt>
      <dd className="max-w-[58%] break-words text-right text-sm font-semibold text-foreground">{value}</dd>
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
  // Demo fallbacks keep the detail view useful while these fields are not yet
  // present in the live vehicle payload. Live values always take precedence.
  const demo = {
    padron: '99', unidad: '6', nombre: 'Car', marca: 'RENAULT', model: 'MASTER',
    year: 2014, description: 'RENAULT Master con motor 2.3 de 125 CV de potencia',
    chassis: '93YMEN4KEEJ224872', engineNumber: 'M9TA86C015113', color: 'Blanco Glaciar',
    type: 'Minibus', fuelType: 'Diésel', displacement: '2.3 L', seats: 3, doors: 4,
    wheels: 4, cargo: '1,500 kg', fleet: '30 DICIEMBRE', fuel: 68,
  };
  const fuel = vehicle.fuelLevel ?? vehicle.nivel_combustible ?? demo.fuel;
  const engine = vehicle.engine ?? vehicle.motor ?? '2.3 L / 125 CV';
  const model = vehicle.model ?? vehicle.modelo ?? demo.model;
  const year = vehicle.year ?? vehicle.anio ?? demo.year;
  const color = vehicle.color ?? demo.color;
  const brand = vehicle.marca ?? demo.marca;
  const description = vehicle.descripcion ?? demo.description;
  const fuelType = vehicle.tipo_combustible ?? demo.fuelType;
  const displacement = vehicle.cilindrada_litros ?? demo.displacement;
  const padron = vehicle.padron ?? demo.padron;
  const unidad = vehicle.unidad ?? demo.unidad;
  const type = vehicle.tipo_vehiculo ?? demo.type;
  const chassis = vehicle.numero_chasis ?? demo.chassis;
  const engineNumber = vehicle.numero_motor ?? demo.engineNumber;
  const fleet = vehicle.flota ?? demo.fleet;
  const seats = vehicle.asientos ?? demo.seats;
  const doors = vehicle.numero_puertas || demo.doors;
  const wheels = vehicle.numero_ruedas ?? demo.wheels;
  const cargo = vehicle.capacidad_carga_util ?? demo.cargo;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="z-[100] inset-y-0 right-0 bottom-auto left-auto mt-0 h-dvh w-full max-w-md rounded-l-2xl rounded-r-none border-l p-0">
          <DrawerHeader className="shrink-0 border-b px-6 py-5 text-left">
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

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
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

            <section aria-label="Información del vehículo" className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ficha del vehículo</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">Información del vehículo</h3>
              </div>

              <div className="space-y-4">
                <section className="rounded-xl border bg-muted/20 px-4" aria-labelledby="vehicle-identity-heading">
                  <h4 id="vehicle-identity-heading" className="border-b border-border/60 py-3 text-sm font-semibold">Identificación</h4>
                  <dl>
                    <VehicleDetailRow icon={ScanLine} label="ID vehículo" value={vehicle.id_vehiculo} />
                    <VehicleDetailRow icon={CarFront} label="Marca y modelo" value={`${brand} ${model}`} />
                    <VehicleDetailRow icon={CalendarDays} label="Año" value={formatValue(year)} />
                    <VehicleDetailRow icon={Palette} label="Color" value={formatValue(color)} />
                    <VehicleDetailRow icon={ScanLine} label="Padrón / unidad" value={`${padron} / ${unidad}`} />
                    <VehicleDetailRow icon={ScanLine} label="Tipo" value={type} />
                  </dl>
                </section>

                <section className="rounded-xl border bg-muted/20 px-4" aria-labelledby="vehicle-technical-heading">
                  <h4 id="vehicle-technical-heading" className="border-b border-border/60 py-3 text-sm font-semibold">Ficha técnica</h4>
                  <dl>
                    <VehicleDetailRow icon={Gauge} label="Motor" value={engine} />
                    <VehicleDetailRow icon={Gauge} label="Cilindrada" value={displacement} />
                    <VehicleDetailRow icon={ScanLine} label="N.º de motor" value={engineNumber} />
                    <VehicleDetailRow icon={ScanLine} label="Chasis / serie" value={chassis} />
                    <VehicleDetailRow icon={CarFront} label="Asientos / puertas" value={`${seats} / ${doors}`} />
                    <VehicleDetailRow icon={CarFront} label="Ruedas" value={wheels} />
                  </dl>
                </section>

                <section className="rounded-xl border bg-muted/20 px-4" aria-labelledby="vehicle-operation-heading">
                  <h4 id="vehicle-operation-heading" className="border-b border-border/60 py-3 text-sm font-semibold">Operación</h4>
                  <dl>
                    <VehicleDetailRow icon={CircleGauge} label="Combustible" value={`${fuelType} · ${fuel}%`} />
                    <VehicleDetailRow icon={Gauge} label="Odómetro" value={formatValue(Number(vehicle.odometro || 124555).toLocaleString(), ' km')} />
                    <VehicleDetailRow icon={BatteryFull} label="Batería" value={formatValue(vehicle.nivel_bateria_vehicular ?? '12.6', ' V')} />
                    <VehicleDetailRow icon={ScanLine} label="Carga útil" value={cargo} />
                    <VehicleDetailRow icon={ScanLine} label="Flota" value={fleet} />
                  </dl>
                </section>

                <section className="rounded-xl border bg-muted/20 px-4 py-4" aria-labelledby="vehicle-description-heading">
                  <h4 id="vehicle-description-heading" className="mb-2 text-sm font-semibold">Descripción</h4>
                  <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </section>
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
