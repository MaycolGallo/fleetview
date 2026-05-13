
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

const baseVehicleHistoryData = {
    "groups": [
        {
            "id_estado": 4,
            "count": 6,
            "total_time_seconds": 200,
            "total_time_formatted": "3m 20s",
            "avg_velocidad": 0,
            "max_velocidad": 0,
            "total_distance_km": 0,
            "records": [
                { "id": "15830", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "param1": "Ralenti", "lat": -12.046, "lng": -77.042 },
                { "id": "15831", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "param1": "Ralenti", "lat": -12.046, "lng": -77.042 },
                { "id": "15832", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "param1": "Ralenti", "lat": -12.046, "lng": -77.042 },
                { "id": "15833", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "param1": "Ralenti", "lat": -12.046, "lng": -77.042 },
                { "id": "15834", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "param1": "Ralenti", "lat": -12.046, "lng": -77.042 },
                { "id": "15835", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 4, "velocidad": "0.00", "rumbo": 0, "odometro": "9431.00", "param1": "Ralenti", "lat": -12.046, "lng": -77.042 }
            ]
        },
        {
            "id_estado": 6,
            "count": 8,
            "total_time_seconds": 280,
            "total_time_formatted": "4m 40s",
            "avg_velocidad": 45,
            "max_velocidad": 62,
            "total_distance_km": 3.5,
            "records": [
                { "id": "15836", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "25.00", "rumbo": 174, "odometro": "9431.00", "param1": "Transitando", "lat": -12.047, "lng": -77.043 },
                { "id": "15837", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "35.00", "rumbo": 170, "odometro": "9431.50", "param1": "Transitando", "lat": -12.050, "lng": -77.045 },
                { "id": "15838", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "42.00", "rumbo": 165, "odometro": "9432.10", "param1": "Transitando", "lat": -12.055, "lng": -77.048 },
                { "id": "15839", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "55.00", "rumbo": 168, "odometro": "9432.80", "param1": "Transitando", "lat": -12.060, "lng": -77.052 },
                { "id": "15840", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "62.00", "rumbo": 172, "odometro": "9433.50", "param1": "Transitando", "lat": -12.065, "lng": -77.058 },
                { "id": "15841", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "58.00", "rumbo": 175, "odometro": "9434.00", "param1": "Transitando", "lat": -12.070, "lng": -77.065 },
                { "id": "15842", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "40.00", "rumbo": 180, "odometro": "9434.40", "param1": "Transitando", "lat": -12.075, "lng": -77.072 },
                { "id": "15843", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 6, "velocidad": "30.00", "rumbo": 185, "odometro": "9434.50", "param1": "Transitando", "lat": -12.080, "lng": -77.080 }
            ]
        },
        {
            "id_estado": 5,
            "count": 3,
            "total_time_seconds": 18000,
            "total_time_formatted": "5h 0m 0s",
            "avg_velocidad": 0,
            "max_velocidad": 0,
            "total_distance_km": 0.01,
            "records": [
                { "id": "15849", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 5, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.51", "param1": "Estacionado", "lat": -12.080, "lng": -77.080 },
                { "id": "15850", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 5, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.51", "param1": "Estacionado", "lat": -12.080, "lng": -77.080 },
                { "id": "15851", "id_vehiculo": 643, "tramas_validas": 1, "id_estado": 5, "velocidad": "0.00", "rumbo": 185, "odometro": "9434.51", "param1": "Estacionado", "lat": -12.080, "lng": -77.080 }
            ]
        }
    ]
};

export async function POST(req: NextRequest) {
  try {
    const { vehicleId } = await req.json();

    // Create truly dynamic timestamps relative to "now"
    // Add jitter so the start time isn't always identical
    const now = Math.floor(Date.now() / 1000);
    const jitterStart = Math.floor(Math.random() * 600) - 300; // +/- 5 mins
    let currentTime = now - 18500 + jitterStart; 

    const processedGroups = await Promise.all(baseVehicleHistoryData.groups.map(async (group) => {
      const firstRecord = group.records[0];
      let address = 'Address lookup failed';
      let address_short = 'Unknown Location';

      // Add randomness to group duration so distance/time changes on refresh
      const durationJitter = Math.floor(Math.random() * 120) - 60; // +/- 2 mins
      const actualGroupDuration = Math.max(60, group.total_time_seconds + durationJitter);
      const actualDistance = group.id_estado === 6 ? group.total_distance_km + (Math.random() * 0.5) : group.total_distance_km;

      // Update records with live, jittered timestamps
      const liveRecords = group.records.map((rec, recIndex) => {
          const step = Math.floor(actualGroupDuration / group.records.length);
          const recTimestamp = currentTime + (recIndex * step);
          return { ...rec, fecha: recTimestamp };
      });

      // Advance clock for next group
      currentTime += actualGroupDuration + 60; // Add 1m gap between states

      if (firstRecord) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${firstRecord.lat}&lon=${firstRecord.lng}`, {
            headers: {
              'User-Agent': 'FleetView/1.0'
            }
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            address = geoData.display_name || 'Address not found';
            if (geoData.address) {
                address_short = geoData.address.road || geoData.address.neighbourhood || geoData.address.suburb || geoData.address.village || geoData.address.city_district || geoData.address.city || 'Unknown Location';
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
        total_time_seconds: actualGroupDuration,
        total_distance_km: actualDistance,
        total_time_formatted: `${Math.floor(actualGroupDuration / 60)}m ${actualGroupDuration % 60}s`,
        records: liveRecords,
        description: group.records[0]?.param1 || 'Unknown',
        color: statusColorMap[group.id_estado as keyof typeof statusColorMap] || '#B0BEC5',
        address,
        address_short,
      };
    }));

    const totalDistance = processedGroups.reduce((acc, g) => acc + g.total_distance_km, 0);
    const totalTime = processedGroups.reduce((acc, g) => acc + g.total_time_seconds, 0);

    const processedHistory = {
      groups: processedGroups,
      total_distance_km: totalDistance,
      total_time_seconds: totalTime,
      total_time_formatted: `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m`,
      by_estado: {
        "4": { name: "Ralenti", total_time_seconds: processedGroups[0].total_time_seconds, total_time_formatted: processedGroups[0].total_time_formatted, total_distance_km: processedGroups[0].total_distance_km, count: 1 },
        "5": { name: "Estacionado", total_time_seconds: processedGroups[2].total_time_seconds, total_time_formatted: processedGroups[2].total_time_formatted, total_distance_km: processedGroups[2].total_distance_km, count: 1 },
        "6": { name: "Transitando", total_time_seconds: processedGroups[1].total_time_seconds, total_time_formatted: processedGroups[1].total_time_formatted, total_distance_km: processedGroups[1].total_distance_km, count: 1 }
      }
    };

    return NextResponse.json(processedHistory);
  } catch (error) {
    console.error("Error generating route:", error);
    return NextResponse.json({ error: 'Failed to generate route' }, { status: 500 });
  }
}
