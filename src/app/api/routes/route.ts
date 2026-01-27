
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { VHistorial } from '@/lib/types';

// The new data structure for route history is already processed.
// We just need to augment it slightly for the UI.
const statusColorMap: { [key: number]: string } = {
    4: '#9E9E9E', // Ralenti
    5: '#666666', // Estacionado
    6: '#00CC33', // Transitando
};

const newVehicleHistoryData = {
    "groups": [
        {
            "id_estado": 4,
            "count": 6,
            "start_id": "15830",
            "end_id": "15835",
            "total_time_seconds": 200,
            "total_time_formatted": "3m 20s",
            "avg_velocidad": 0,
            "max_velocidad": 0,
            "total_distance_km": 0,
            "records": [
                {
                    "id": "15830",
                    "id_vehiculo": 643,
                    "tramas_validas": 1,
                    "id_estado": 4,
                    "velocidad": "0.00",
                    "rumbo": 0,
                    "odometro": "9431.00",
                    "horometro": "0.00",
                    "numero_satelites": 0,
                    "nivel_bateria": "3.69",
                    "temperatura": "0.00",
                    "senal_gsm": 29,
                    "nivel_bateria_vehicular": "27.70",
                    "id_cliente": 132,
                    "din": 10,
                    "fecha": 1769503928,
                    "altitud": 0,
                    "codigo": 4,
                    "param1": "Ralenti",
                    "lat": -14.1562666,
                    "lng": -75.704655
                },
                {
                    "id": "15831",
                    "id_vehiculo": 643,
                    "tramas_validas": 1,
                    "id_estado": 4,
                    "velocidad": "0.00",
                    "rumbo": 0,
                    "odometro": "9431.00",
                    "horometro": "0.00",
                    "numero_satelites": 0,
                    "nivel_bateria": "3.69",
                    "temperatura": "0.00",
                    "senal_gsm": 29,
                    "nivel_bateria_vehicular": "27.38",
                    "id_cliente": 132,
                    "din": 10,
                    "fecha": 1769503968,
                    "altitud": 0,
                    "codigo": 4,
                    "param1": "Ralenti",
                    "lat": -14.156265,
                    "lng": -75.704655
                },
                {
                    "id": "15832",
                    "id_vehiculo": 643,
                    "tramas_validas": 1,
                    "id_estado": 4,
                    "velocidad": "0.00",
                    "rumbo": 0,
                    "odometro": "9431.00",
                    "horometro": "0.00",
                    "numero_satelites": 0,
                    "nivel_bateria": "3.70",
                    "temperatura": "0.00",
                    "senal_gsm": 29,
                    "nivel_bateria_vehicular": "27.85",
                    "id_cliente": 132,
                    "din": 10,
                    "fecha": 1769504008,
                    "altitud": 0,
                    "codigo": 4,
                    "param1": "Ralenti",
                    "lat": -14.156265,
                    "lng": -75.704655
                },
                {
                    "id": "15833",
                    "id_vehiculo": 643,
                    "tramas_validas": 1,
                    "id_estado": 4,
                    "velocidad": "0.00",
                    "rumbo": 0,
                    "odometro": "9431.00",
                    "horometro": "0.00",
                    "numero_satelites": 0,
                    "nivel_bateria": "3.70",
                    "temperatura": "0.00",
                    "senal_gsm": 29,
                    "nivel_bateria_vehicular": "27.59",
                    "id_cliente": 132,
                    "din": 10,
                    "fecha": 1769504048,
                    "altitud": 0,
                    "codigo": 4,
                    "param1": "Ralenti",
                    "lat": -14.156265,
                    "lng": -75.704655
                },
                {
                    "id": "15834",
                    "id_vehiculo": 643,
                    "tramas_validas": 1,
                    "id_estado": 4,
                    "velocidad": "0.00",
                    "rumbo": 0,
                    "odometro": "9431.00",
                    "horometro": "0.00",
                    "numero_satelites": 0,
                    "nivel_bateria": "3.70",
                    "temperatura": "0.00",
                    "senal_gsm": 29,
                    "nivel_bateria_vehicular": "27.80",
                    "id_cliente": 132,
                    "din": 10,
                    "fecha": 1769504088,
                    "altitud": 0,
                    "codigo": 4,
                    "param1": "Ralenti",
                    "lat": -14.156265,
                    "lng": -75.704655
                },
                {
                    "id": "15835",
                    "id_vehiculo": 643,
                    "tramas_validas": 1,
                    "id_estado": 4,
                    "velocidad": "0.00",
                    "rumbo": 0,
                    "odometro": "9431.00",
                    "horometro": "0.00",
                    "numero_satelites": 0,
                    "nivel_bateria": "3.70",
                    "temperatura": "0.00",
                    "senal_gsm": 29,
                    "nivel_bateria_vehicular": "27.70",
                    "id_cliente": 132,
                    "din": 10,
                    "fecha": 1769504128,
                    "altitud": 0,
                    "codigo": 4,
                    "param1": "Ralenti",
                    "lat": -14.156265,
                    "lng": -75.704655
                }
            ]
        }
    ],
    "total_distance_km": 29.869,
    "total_time_seconds": 24886,
    "total_time_formatted": "6h 54m 46s",
    "by_estado": {
        "4": {
            "name": "Ralenti",
            "total_time_seconds": 1973,
            "total_time_formatted": "32m 53s",
            "total_distance_km": 0.127,
            "count": 13
        },
        "5": {
            "name": "Estacionado",
            "total_time_seconds": 17440,
            "total_time_formatted": "4h 50m 40s",
            "total_distance_km": 0.011,
            "count": 1
        },
        "6": {
            "name": "Transitando",
            "total_time_seconds": 5473,
            "total_time_formatted": "1h 31m 13s",
            "total_distance_km": 29.731,
            "count": 13
        }
    }
};

export async function POST(req: NextRequest) {
  try {
    const { vehicleId } = await req.json();

    const processedHistory = {
      ...newVehicleHistoryData,
      groups: newVehicleHistoryData.groups.map(group => ({
        ...group,
        description: group.records[0]?.param1 || 'Unknown',
        color: statusColorMap[group.id_estado as keyof typeof statusColorMap] || '#B0BEC5',
      })),
    };

    return NextResponse.json(processedHistory);
  } catch (error) {
    console.error("Error generating route:", error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Failed to generate route', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to generate route' }, { status: 500 });
  }
}
