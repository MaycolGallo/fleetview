import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { RouteHistory, VehicleHistoryPoint } from '@/lib/types';

// This is a mock data source. In a real application, you would fetch this from a database.
const vehicleHistoryData: VehicleHistoryPoint[] = [
  {"id":17,"id_vehiculo":881,"coordenadas":"-14.15632,-75.7046566","tramas_validas":1,"id_estado":5,"velocidad":0,"rumbo":128,"odometro":8764,"horometro":0,"numero_satelites":0,"nivel_bateria":4.1,"temperatura":0,"senal_gsm":24,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721851754,"altitud":0},
  {"id":18,"id_vehiculo":881,"coordenadas":"-14.15632,-75.7046566","tramas_validas":1,"id_estado":5,"velocidad":0,"rumbo":128,"odometro":8764,"horometro":0,"numero_satelites":0,"nivel_bateria":4.1,"temperatura":0,"senal_gsm":24,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721851784,"altitud":0},
  {"id":19,"id_vehiculo":881,"coordenadas":"-14.15632,-75.7046566","tramas_validas":1,"id_estado":5,"velocidad":0,"rumbo":245,"odometro":8764,"horometro":0,"numero_satelites":0,"nivel_bateria":4.1,"temperatura":0,"senal_gsm":25,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721851794,"altitud":0},
  {"id":20,"id_vehiculo":881,"coordenadas":"-14.15632,-75.7046566","tramas_validas":1,"id_estado":6,"velocidad":15,"rumbo":245,"odometro":8765,"horometro":0,"numero_satelites":0,"nivel_bateria":4.1,"temperatura":0,"senal_gsm":24,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721851834,"altitud":0},
  {"id":21,"id_vehiculo":881,"coordenadas":"-14.15590,-75.70510","tramas_validas":1,"id_estado":6,"velocidad":35,"rumbo":245,"odometro":8766,"horometro":0,"numero_satelites":0,"nivel_bateria":4.09,"temperatura":0,"senal_gsm":25,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721851914,"altitud":0},
  {"id":22,"id_vehiculo":881,"coordenadas":"-14.15550,-75.70550","tramas_validas":1,"id_estado":6,"velocidad":45,"rumbo":260,"odometro":8767,"horometro":0,"numero_satelites":0,"nivel_bateria":4.09,"temperatura":0,"senal_gsm":25,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721851954,"altitud":0},
  {"id":23,"id_vehiculo":881,"coordenadas":"-14.15500,-75.70650","tramas_validas":1,"id_estado":4,"velocidad":0,"rumbo":260,"odometro":8768,"horometro":0,"numero_satelites":0,"nivel_bateria":4.09,"temperatura":0,"senal_gsm":25,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721852054,"altitud":0},
  {"id":24,"id_vehiculo":881,"coordenadas":"-14.15500,-75.70650","tramas_validas":1,"id_estado":4,"velocidad":0,"rumbo":260,"odometro":8768,"horometro":0,"numero_satelites":0,"nivel_bateria":4.09,"temperatura":0,"senal_gsm":25,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721852154,"altitud":0},
  {"id":25,"id_vehiculo":881,"coordenadas":"-14.15500,-75.70650","tramas_validas":1,"id_estado":6,"velocidad":20,"rumbo":180,"odometro":8769,"horometro":0,"numero_satelites":0,"nivel_bateria":4.08,"temperatura":0,"senal_gsm":24,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721852254,"altitud":0},
  {"id":26,"id_vehiculo":881,"coordenadas":"-14.15580,-75.70650","tramas_validas":1,"id_estado":6,"velocidad":40,"rumbo":180,"odometro":8770,"horometro":0,"numero_satelites":0,"nivel_bateria":4.08,"temperatura":0,"senal_gsm":24,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721852354,"altitud":0},
  {"id":27,"id_vehiculo":881,"coordenadas":"-14.15650,-75.70650","tramas_validas":1,"id_estado":5,"velocidad":0,"rumbo":180,"odometro":8771,"horometro":0,"numero_satelites":0,"nivel_bateria":4.07,"temperatura":0,"senal_gsm":23,"nivel_bateria_vehicular":26.43,"id_cliente":184,"din":2,"fecha":1721852454,"altitud":0}
];


const statusMap: { [key: number]: { name: string; type: 'stop' | 'driving' | 'event' } } = {
  0: { name: 'Libre', type: 'event' },
  1: { name: 'SRalenti', type: 'stop' },
  2: { name: 'Libre', type: 'event' },
  4: { name: 'Ralenti', type: 'stop' },
  5: { name: 'Estacionado', type: 'stop' },
  6: { name: 'Transitando', type: 'driving' },
  7: { name: 'Bloqueado', type: 'event' },
  8: { name: 'Desconeccion de Bateria', type: 'event' },
  9: { name: 'Mantenimiento', type: 'event' },
  99: { name: 'Modo sleep o no envia', type: 'event' },
};

function processHistory(history: VehicleHistoryPoint[]) {
  if (history.length === 0) {
    return { routePoints: [], routeEvents: [] };
  }

  // Ensure history is sorted by date
  history.sort((a, b) => a.fecha - b.fecha);

  const routePoints = history.map(p => {
    const [lat, lng] = p.coordenadas.split(',').map(Number);
    return { lat, lng };
  });

  const routeEvents: any[] = [];
  let lastStatus = -1;
  let segmentStartIndex = 0;

  history.forEach((point, index) => {
    if (index === 0) {
      lastStatus = point.id_estado;
      routeEvents.push({
        timestamp: new Date(point.fecha * 1000).toISOString(),
        status: 'start',
        distanceKm: 0,
        durationMinutes: 0,
        description: 'Trip started',
      });
      return;
    }

    const currentStatusInfo = statusMap[point.id_estado];
    const lastStatusInfo = statusMap[lastStatus];

    // Group consecutive statuses. If the status type changes, create a new event.
    if (!currentStatusInfo || !lastStatusInfo || currentStatusInfo.type !== lastStatusInfo.type) {
      const segment = history.slice(segmentStartIndex, index);
      const segmentEndDate = new Date(history[index - 1].fecha * 1000);
      const segmentStartDate = new Date(segment[0].fecha * 1000);
      
      const durationMs = segmentEndDate.getTime() - segmentStartDate.getTime();
      const durationMinutes = durationMs / (1000 * 60);

      const distanceKm = history[index - 1].odometro - segment[0].odometro;
      
      routeEvents.push({
        timestamp: segmentEndDate.toISOString(),
        status: lastStatusInfo?.type || 'event',
        distanceKm: Math.abs(distanceKm),
        durationMinutes: durationMinutes,
        description: lastStatusInfo?.name || `Event Code: ${lastStatus}`
      });

      segmentStartIndex = index;
      lastStatus = point.id_estado;
    }
  });

  // Add the final segment
  const finalSegment = history.slice(segmentStartIndex);
  const finalPoint = finalSegment[finalSegment.length - 1];
  const finalStatusInfo = statusMap[finalPoint.id_estado];
  const finalSegmentStartDate = new Date(finalSegment[0].fecha * 1000);
  const finalSegmentEndDate = new Date(finalPoint.fecha * 1000);

  const finalDurationMs = finalSegmentEndDate.getTime() - finalSegmentStartDate.getTime();
  const finalDurationMinutes = finalDurationMs / (1000 * 60);
  const finalDistanceKm = finalPoint.odometro - finalSegment[0].odometro;

  routeEvents.push({
      timestamp: finalSegmentEndDate.toISOString(),
      status: finalStatusInfo?.type || 'event',
      distanceKm: Math.abs(finalDistanceKm),
      durationMinutes: finalDurationMinutes,
      description: finalStatusInfo?.name || `Event Code: ${finalPoint.id_estado}`
  });

  // Add end event
  routeEvents.push({
    timestamp: new Date(history[history.length - 1].fecha * 1000).toISOString(),
    status: 'end',
    distanceKm: 0,
    durationMinutes: 0,
    description: 'Trip ended',
  });


  return { routePoints, routeEvents };
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicleId } = body;

    // In a real app, you would filter by vehicleId.
    // For this mock, we use the same data for all vehicles.
    const { routePoints, routeEvents } = processHistory(vehicleHistoryData);

    const routeHistory: RouteHistory = {
      routePoints,
      routeEvents,
    };

    return NextResponse.json(routeHistory);
  } catch (error) {
    console.error("Error generating route:", error);
    return NextResponse.json({ error: 'Failed to generate route' }, { status: 500 });
  }
}
