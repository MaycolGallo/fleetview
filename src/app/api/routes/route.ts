
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
                { "id": "15830", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "fecha": 1769503928, "param1": "Ralenti", "lat": -14.1562666, "lng": -75.704655 },
                { "id": "15831", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "fecha": 1769503968, "param1": "Ralenti", "lat": -14.156265, "lng": -75.704655 },
                { "id": "15832", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "fecha": 1769504008, "param1": "Ralenti", "lat": -14.156265, "lng": -75.704655 },
                { "id": "15833", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "fecha": 1769504048, "param1": "Ralenti", "lat": -14.156265, "lng": -75.704655 },
                { "id": "15834", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "fecha": 1769504088, "param1": "Ralenti", "lat": -14.156265, "lng": -75.704655 },
                { "id": "15835", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "fecha": 1769504128, "param1": "Ralenti", "lat": -14.156265, "lng": -75.704655 }
            ]
        },
        {
            "id_estado": 6,
            "count": 8,
            "start_id": "15836",
            "end_id": "15843",
            "total_time_seconds": 280,
            "total_time_formatted": "4m 40s",
            "avg_velocidad": 45,
            "max_velocidad": 62,
            "total_distance_km": 3.5,
            "records": [
                { "id": "15836", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "25.00", "rumbo": 174, "odometro": "9431.00", "fecha": 1769504168, "param1": "Transitando", "lat": -14.1562766, "lng": -75.7046583 },
                { "id": "15837", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "35.00", "rumbo": 170, "odometro": "9431.50", "fecha": 1769504208, "param1": "Transitando", "lat": -14.1578, "lng": -75.7052 },
                { "id": "15838", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "42.00", "rumbo": 165, "odometro": "9432.10", "fecha": 1769504248, "param1": "Transitando", "lat": -14.1593, "lng": -75.7059 },
                { "id": "15839", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "55.00", "rumbo": 168, "odometro": "9432.80", "fecha": 1769504288, "param1": "Transitando", "lat": -14.1612, "lng": -75.7065 },
                { "id": "15840", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "62.00", "rumbo": 172, "odometro": "9433.50", "fecha": 1769504328, "param1": "Transitando", "lat": -14.1631, "lng": -75.7071 },
                { "id": "15841", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "58.00", "rumbo": 175, "odometro": "9434.00", "fecha": 1769504368, "param1": "Transitando", "lat": -14.1650, "lng": -75.7076 },
                { "id": "15842", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "40.00", "rumbo": 180, "odometro": "9434.40", "fecha": 1769504408, "param1": "Transitando", "lat": -14.1665, "lng": -75.7078 },
                { "id": "15843", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "30.00", "rumbo": 185, "odometro": "9434.50", "fecha": 1769504448, "param1": "Transitando", "lat": -14.1678, "lng": -75.7080 }
            ]
        },
        {
            "id_estado": 4,
            "count": 5,
            "start_id": "15844",
            "end_id": "15848",
            "total_time_seconds": 160,
            "total_time_formatted": "2m 40s",
            "avg_velocidad": 0,
            "max_velocidad": 0,
            "total_distance_km": 0.001,
            "records": [
                { "id": "15844", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.50", "fecha": 1769504488, "param1": "Ralenti", "lat": -14.1678, "lng": -75.7080 },
                { "id": "15845", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.50", "fecha": 1769504528, "param1": "Ralenti", "lat": -14.1678, "lng": -75.7080 },
                { "id": "15846", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.50", "fecha": 1769504568, "param1": "Ralenti", "lat": -14.1678, "lng": -75.7080 },
                { "id": "15847", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.50", "fecha": 1769504608, "param1": "Ralenti", "lat": -14.1678, "lng": -75.7080 },
                { "id": "15848", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.50", "fecha": 1769504648, "param1": "Ralenti", "lat": -14.1678, "lng": -75.7080 }
            ]
        },
        {
            "id_estado": 5,
            "count": 10,
            "start_id": "15849",
            "end_id": "15858",
            "total_time_seconds": 18000,
            "total_time_formatted": "5h 0m 0s",
            "avg_velocidad": 0,
            "max_velocidad": 0,
            "total_distance_km": 0.01,
            "records": [
                { "id": "15849", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 5, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.51", "fecha": 1769504688, "param1": "Estacionado", "lat": -14.1679, "lng": -75.7081 },
                { "id": "15850", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 5, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.51", "fecha": 1769522688, "param1": "Estacionado", "lat": -14.1679, "lng": -75.7081 },
                { "id": "15858", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 5, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.51", "fecha": 1769522688, "param1": "Estacionado", "lat": -14.1679, "lng": -75.7081 }
            ]
        },
        {
            "id_estado": 6,
            "count": 15,
            "start_id": "15859",
            "end_id": "15873",
            "total_time_seconds": 560,
            "total_time_formatted": "9m 20s",
            "avg_velocidad": 50,
            "max_velocidad": 75,
            "total_distance_km": 7.8,
            "records": [
                { "id": "15859", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "15.00", "rumbo": 190, "odometro": "9434.60", "fecha": 1769522728, "param1": "Transitando", "lat": -14.1685, "lng": -75.7085 },
                { "id": "15860", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "30.00", "rumbo": 200, "odometro": "9435.00", "fecha": 1769522768, "param1": "Transitando", "lat": -14.1700, "lng": -75.7100 },
                { "id": "15861", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "45.00", "rumbo": 210, "odometro": "9435.50", "fecha": 1769522808, "param1": "Transitando", "lat": -14.1720, "lng": -75.7120 },
                { "id": "15862", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "60.00", "rumbo": 220, "odometro": "9436.50", "fecha": 1769522848, "param1": "Transitando", "lat": -14.1745, "lng": -75.7145 },
                { "id": "15863", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "75.00", "rumbo": 225, "odometro": "9437.80", "fecha": 1769522888, "param1": "Transitando", "lat": -14.1770, "lng": -75.7175 },
                { "id": "15864", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "70.00", "rumbo": 230, "odometro": "9438.90", "fecha": 1769522928, "param1": "Transitando", "lat": -14.1795, "lng": -75.7205 },
                { "id": "15865", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "65.00", "rumbo": 235, "odometro": "9439.90", "fecha": 1769522968, "param1": "Transitando", "lat": -14.1820, "lng": -75.7235 },
                { "id": "15866", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "55.00", "rumbo": 240, "odometro": "9440.80", "fecha": 1769523008, "param1": "Transitando", "lat": -14.1840, "lng": -75.7260 },
                { "id": "15867", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "48.00", "rumbo": 245, "odometro": "9441.50", "fecha": 1769523048, "param1": "Transitando", "lat": -14.1855, "lng": -75.7285 },
                { "id": "15868", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "40.00", "rumbo": 250, "odometro": "9442.10", "fecha": 1769523088, "param1": "Transitando", "lat": -14.1870, "lng": -75.7310 },
                { "id": "15869", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "35.00", "rumbo": 255, "odometro": "9442.60", "fecha": 1769523128, "param1": "Transitando", "lat": -14.1885, "lng": -75.7335 },
                { "id": "15870", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "30.00", "rumbo": 260, "odometro": "9443.00", "fecha": 1769523168, "param1": "Transitando", "lat": -14.1895, "lng": -75.7355 },
                { "id": "15871", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "25.00", "rumbo": 265, "odometro": "9443.30", "fecha": 1769523208, "param1": "Transitando", "lat": -14.1905, "lng": -75.7375 },
                { "id": "15872", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "20.00", "rumbo": 270, "odometro": "9443.50", "fecha": 1769523248, "param1": "Transitando", "lat": -14.1910, "lng": -75.7395 },
                { "id": "15873", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "15.00", "rumbo": 275, "odometro": "9443.60", "fecha": 1769523288, "param1": "Transitando", "lat": -14.1912, "lng": -75.7415 }
            ]
        }
    ],
    "total_distance_km": 11.311,
    "total_time_seconds": 19200,
    "total_time_formatted": "5h 20m 0s",
    "by_estado": {
        "4": {
            "name": "Ralenti",
            "total_time_seconds": 360,
            "total_time_formatted": "6m 0s",
            "total_distance_km": 0.001,
            "count": 2
        },
        "5": {
            "name": "Estacionado",
            "total_time_seconds": 18000,
            "total_time_formatted": "5h 0m 0s",
            "total_distance_km": 0.01,
            "count": 1
        },
        "6": {
            "name": "Transitando",
            "total_time_seconds": 840,
            "total_time_formatted": "14m 0s",
            "total_distance_km": 11.3,
            "count": 2
        }
    }
};

export async function POST(req: NextRequest) {
  try {
    const { vehicleId } = await req.json();

    const processedGroups = await Promise.all(newVehicleHistoryData.groups.map(async (group) => {
      const firstRecord = group.records[0];
      let address = 'Address lookup failed';
      let address_short = 'Unknown Location';

      if (firstRecord) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${firstRecord.lat}&lon=${firstRecord.lng}`, {
            headers: {
              'User-Agent': 'FirebaseStudio/1.0 (for a vehicle tracking app)'
            }
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            address = geoData.display_name || 'Address not found';
            if (geoData.address) {
                address_short = geoData.address.road || geoData.address.suburb || geoData.address.city_district || 'Unknown Road';
            } else {
                address_short = 'Address unavailable';
            }
          }
        } catch (e) {
          console.error('Geocoding error:', e);
        }
      }

      return {
        ...group,
        description: group.records[0]?.param1 || 'Unknown',
        color: statusColorMap[group.id_estado as keyof typeof statusColorMap] || '#B0BEC5',
        address,
        address_short,
      };
    }));

    const processedHistory = {
      ...newVehicleHistoryData,
      groups: processedGroups,
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
