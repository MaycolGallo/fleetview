
import { NextRequest, NextResponse } from 'next/server';
import { Incidencia } from '@/lib/types';

// Lima, Peru base coordinates for mock data
const LIMA = { lat: -12.046, lng: -77.042 };

function getRandomOffset() {
  return (Math.random() - 0.5) * 0.05;
}

const INCIDENT_TYPES: Incidencia['type'][] = ['panic', 'harsh_accel', 'harsh_brake', 'speeding', 'excessive_idle'];

const TYPE_DESCRIPTIONS: Record<Incidencia['type'], string> = {
  panic: 'Botón de Pánico Activado',
  harsh_accel: 'Aceleración Brusca Detectada',
  harsh_brake: 'Frenado Brusco Detectado',
  speeding: 'Exceso de Velocidad',
  excessive_idle: 'Ralentí Excesivo',
};

export async function POST(req: NextRequest) {
  try {
    const { vehicleId } = await req.json();
    
    // Generate 5-10 random incidents
    const count = Math.floor(Math.random() * 6) + 5;
    const incidencias: Incidencia[] = Array.from({ length: count }, (_, i) => {
      const type = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)];
      return {
        id: `inc-${vehicleId}-${i}`,
        type,
        lat: LIMA.lat + getRandomOffset(),
        lng: LIMA.lng + getRandomOffset(),
        timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
        description: TYPE_DESCRIPTIONS[type],
        value: type === 'speeding' ? `${Math.floor(Math.random() * 40) + 90} km/h` : undefined,
      };
    }).sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json(incidencias);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}
