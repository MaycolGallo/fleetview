import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { RouteHistory, VehicleHistoryPoint, RouteSegment } from '@/lib/types';

// This is a mock data source. In a real application, you would fetch this from a database.
const vehicleHistoryData: VehicleHistoryPoint[] = [
  // Segment 1: Parked (5 minutes)
  {"id":"1","id_vehiculo":643,"coordenadas":"-14.0665,-75.7265","tramas_validas":1,"id_estado":"5","velocidad":"0.00","rumbo":180,"odometro":"8878.00","horometro":"0","numero_satelites":10,"nivel_bateria":"4.1","temperatura":"25","senal_gsm":22,"nivel_bateria_vehicular":"12.5","id_cliente":132,"din":2,"fecha":1768663200,"altitud":0,"codigo":5,"param1":"Estacionado","param2":"El vehiculo se encuentra estacionado","param3":"#666666","param4":"FFFFFF","created_at":"2025-12-17T15:40:00Z","updated_at":null},
  {"id":"2","id_vehiculo":643,"coordenadas":"-14.0665,-75.7265","tramas_validas":1,"id_estado":"5","velocidad":"0.00","rumbo":180,"odometro":"8878.00","horometro":"0","numero_satelites":10,"nivel_bateria":"4.1","temperatura":"25","senal_gsm":22,"nivel_bateria_vehicular":"12.5","id_cliente":132,"din":2,"fecha":1768663500,"altitud":0,"codigo":5,"param1":"Estacionado","param2":"El vehiculo se encuentra estacionado","param3":"#666666","param4":"FFFFFF","created_at":"2025-12-17T15:45:00Z","updated_at":null},
  
  // Segment 2: Driving (10 minutes)
  {"id":"3","id_vehiculo":643,"coordenadas":"-14.0665,-75.7265","tramas_validas":1,"id_estado":"6","velocidad":"25.00","rumbo":180,"odometro":"8878.00","horometro":"0","numero_satelites":12,"nivel_bateria":"4.0","temperatura":"26","senal_gsm":23,"nivel_bateria_vehicular":"13.8","id_cliente":132,"din":2,"fecha":1768663800,"altitud":0,"codigo":6,"param1":"Transitando","param2":"El vehiculo esta en movimiento","param3":"#00CC33","param4":"FFFFFF","created_at":"2025-12-17T15:50:00Z","updated_at":null},
  {"id":"4","id_vehiculo":643,"coordenadas":"-14.0700,-75.7280","tramas_validas":1,"id_estado":"6","velocidad":"45.00","rumbo":175,"odometro":"8879.50","horometro":"0","numero_satelites":12,"nivel_bateria":"4.0","temperatura":"26","senal_gsm":23,"nivel_bateria_vehicular":"13.8","id_cliente":132,"din":2,"fecha":1768664100,"altitud":0,"codigo":6,"param1":"Transitando","param2":"El vehiculo esta en movimiento","param3":"#00CC33","param4":"FFFFFF","created_at":"2025-12-17T15:55:00Z","updated_at":null},
  {"id":"5","id_vehiculo":643,"coordenadas":"-14.0750,-75.7300","tramas_validas":1,"id_estado":"6","velocidad":"50.00","rumbo":170,"odometro":"8881.00","horometro":"0","numero_satelites":12,"nivel_bateria":"4.0","temperatura":"26","senal_gsm":23,"nivel_bateria_vehicular":"13.8","id_cliente":132,"din":2,"fecha":1768664400,"altitud":0,"codigo":6,"param1":"Transitando","param2":"El vehiculo esta en movimiento","param3":"#00CC33","param4":"FFFFFF","created_at":"2025-12-17T16:00:00Z","updated_at":null},

  // Segment 3: Idle (2 minutes)
  {"id":"6","id_vehiculo":643,"coordenadas":"-14.0750,-75.7300","tramas_validas":1,"id_estado":"4","velocidad":"0.00","rumbo":170,"odometro":"8881.00","horometro":"0","numero_satelites":11,"nivel_bateria":"3.9","temperatura":"27","senal_gsm":21,"nivel_bateria_vehicular":"13.7","id_cliente":132,"din":2,"fecha":1768664520,"altitud":0,"codigo":4,"param1":"Ralenti","param2":"El vehiculo esta en ralenti","param3":"#9E9E9E","param4":"FFFFFF","created_at":"2025-12-17T16:02:00Z","updated_at":null},

  // Segment 4: Driving (5 minutes)
  {"id":"7","id_vehiculo":643,"coordenadas":"-14.0755,-75.7305","tramas_validas":1,"id_estado":"6","velocidad":"30.00","rumbo":190,"odometro":"8881.50","horometro":"0","numero_satelites":12,"nivel_bateria":"3.9","temperatura":"27","senal_gsm":22,"nivel_bateria_vehicular":"13.8","id_cliente":132,"din":2,"fecha":1768664640,"altitud":0,"codigo":6,"param1":"Transitando","param2":"El vehiculo esta en movimiento","param3":"#00CC33","param4":"FFFFFF","created_at":"2025-12-17T16:04:00Z","updated_at":null},
  {"id":"8","id_vehiculo":643,"coordenadas":"-14.0800,-75.7320","tramas_validas":1,"id_estado":"6","velocidad":"40.00","rumbo":195,"odometro":"8882.50","horometro":"0","numero_satelites":12,"nivel_bateria":"3.9","temperatura":"27","senal_gsm":22,"nivel_bateria_vehicular":"13.8","id_cliente":132,"din":2,"fecha":1768664940,"altitud":0,"codigo":6,"param1":"Transitando","param2":"El vehiculo esta en movimiento","param3":"#00CC33","param4":"FFFFFF","created_at":"2025-12-17T16:09:00Z","updated_at":null},

  // Segment 5: Parked
  {"id":"9","id_vehiculo":643,"coordenadas":"-14.0800,-75.7320","tramas_validas":1,"id_estado":"5","velocidad":"0.00","rumbo":195,"odometro":"8882.50","horometro":"0","numero_satelites":10,"nivel_bateria":"3.8","temperatura":"26","senal_gsm":24,"nivel_bateria_vehicular":"12.6","id_cliente":132,"din":2,"fecha":1768665000,"altitud":0,"codigo":5,"param1":"Estacionado","param2":"El vehiculo se encuentra estacionado","param3":"#666666","param4":"FFFFFF","created_at":"2025-12-17T16:10:00Z","updated_at":null}
];

function parseCoords(coordenadas: string): { lat: number; lng: number } {
  const [lat, lng] = coordenadas.split(',').map(Number);
  return { lat, lng };
}


function processHistory(history: VehicleHistoryPoint[]): RouteHistory {
  if (history.length === 0) {
    return { segments: [], routePoints: [] };
  }

  // Ensure history is sorted by date
  history.sort((a, b) => a.fecha - b.fecha);

  const segments: RouteSegment[] = [];
  if (history.length > 0) {
      let currentSegmentRecords: VehicleHistoryPoint[] = [history[0]];

      for (let i = 1; i < history.length; i++) {
          if (history[i].id_estado !== currentSegmentRecords[0].id_estado) {
              segments.push(createSegment(currentSegmentRecords));
              currentSegmentRecords = [history[i]];
          } else {
              currentSegmentRecords.push(history[i]);
          }
      }
      segments.push(createSegment(currentSegmentRecords));
  }
  
  const routePoints = segments
    .filter(s => s.id_estado === '6')
    .flatMap(s => s.records.map(r => parseCoords(r.coordenadas)));

  return { segments, routePoints };
}

function createSegment(records: VehicleHistoryPoint[]): RouteSegment {
    const firstRecord = records[0];
    const lastRecord = records[records.length - 1];

    const durationMs = (lastRecord.fecha - firstRecord.fecha) * 1000;
    const durationMinutes = durationMs / (1000 * 60);

    const distanceKm = parseFloat(lastRecord.odometro) - parseFloat(firstRecord.odometro);

    const totalSpeed = records.reduce((sum, record) => sum + parseFloat(record.velocidad), 0);
    const avgSpeed = records.length > 0 ? totalSpeed / records.length : 0;
    
    return {
      id_estado: firstRecord.id_estado,
      description: firstRecord.param1,
      durationMinutes: durationMinutes,
      distanceKm: Math.abs(distanceKm),
      avgSpeed: avgSpeed,
      startTime: firstRecord.fecha,
      endTime: lastRecord.fecha,
      startPoint: parseCoords(firstRecord.coordenadas),
      endPoint: parseCoords(lastRecord.coordenadas),
      records: records,
    };
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicleId } = body;

    // In a real app, you would filter by vehicleId.
    // For this mock, we use the same data for all vehicles.
    const routeHistory = processHistory(vehicleHistoryData);

    return NextResponse.json(routeHistory);
  } catch (error) {
    console.error("Error generating route:", error);
    return NextResponse.json({ error: 'Failed to generate route' }, { status: 500 });
  }
}
