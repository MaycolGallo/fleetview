import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startLat = Number(searchParams.get('startLat'));
  const startLng = Number(searchParams.get('startLng'));
  const endLat = Number(searchParams.get('endLat'));
  const endLng = Number(searchParams.get('endLng'));

  if (![startLat, startLng, endLat, endLng].every(Number.isFinite)) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
  }

  const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?steps=true&overview=false&geometries=geojson`;
  const response = await fetch(url, { headers: { accept: 'application/json' }, next: { revalidate: 0 } });
  if (!response.ok) return NextResponse.json({ error: 'No se pudo obtener la ruta' }, { status: 502 });
  return NextResponse.json(await response.json());
}
