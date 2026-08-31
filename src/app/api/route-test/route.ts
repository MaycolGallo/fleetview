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

  if (startLat < -90 || startLat > 90 || endLat < -90 || endLat > 90 || startLng < -180 || startLng > 180 || endLng < -180 || endLng > 180) {
    return NextResponse.json({ error: 'Las coordenadas deben estar dentro de los rangos válidos.' }, { status: 400 });
  }

  const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?steps=true&overview=false&geometries=geojson`;

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'FleetView route tester' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.code !== 'Ok') {
      return NextResponse.json({
        error: payload?.message || payload?.code || 'El servicio de rutas rechazó las coordenadas.',
      }, { status: 502 });
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'El servicio de rutas no está disponible. Intenta nuevamente.' }, { status: 502 });
  }
}
