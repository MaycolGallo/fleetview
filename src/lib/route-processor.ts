
import {
  VehiculoHistorialGrouped,
  VehiculoUbicacionHistorial,
  VHistorial,
  ProcessedRouteRecord,
} from "./types";

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function groupByEstadoConsecutive(
  data: VehiculoUbicacionHistorial[],
): VHistorial {
  if (data.length === 0)
    return {
      groups: [],
      total_distance_km: 0,
      total_time_seconds: 0,
      total_time_formatted: "0s",
      by_estado: {},
    };

  // Build estado names map from the data itself
  const estadoNamesMap: { [key: number]: string } = {};
  data.forEach((record) => {
    if (record.param1 && !estadoNamesMap[record.id_estado]) {
      estadoNamesMap[record.id_estado] = record.param1;
    }
  });

  const groups: VehiculoHistorialGrouped[] = [];
  let currentGroup: VehiculoUbicacionHistorial[] = [data[0]];
  let currentEstado = data[0].id_estado;

  for (let i = 1; i < data.length; i++) {
    if (data[i].id_estado === currentEstado) {
      currentGroup.push(data[i]);
    } else {
      // Process current group
      groups.push(processGroup(currentGroup));

      // Start new group
      currentGroup = [data[i]];
      currentEstado = data[i].id_estado;
    }
  }

  // Process last group
  groups.push(processGroup(currentGroup));

  // Calculate totals
  let totalDistance = 0;
  let totalTime = 0;
  const byEstado: VHistorial["by_estado"] = {};

  groups.forEach((group) => {
    totalDistance += group.total_distance_km;
    totalTime += group.total_time_seconds;

    if (!byEstado[group.id_estado]) {
      byEstado[group.id_estado] = {
        name: estadoNamesMap[group.id_estado] || `Estado ${group.id_estado}`,
        total_time_seconds: 0,
        total_time_formatted: "0s",
        total_distance_km: 0,
        count: 0,
      };
    }

    byEstado[group.id_estado].total_time_seconds += group.total_time_seconds;
    byEstado[group.id_estado].total_distance_km += group.total_distance_km;
    byEstado[group.id_estado].count += 1;
  });

  // Format times for by_estado
  Object.keys(byEstado).forEach((key) => {
    const estadoKey = parseInt(key, 10);
    const estado = byEstado[estadoKey];
    if (estado) {
        estado.total_time_formatted = formatTime(estado.total_time_seconds);
        estado.total_distance_km =
        Math.round(estado.total_distance_km * 1000) / 1000;
    }
  });

  return {
    groups,
    total_distance_km: Math.round(totalDistance * 1000) / 1000,
    total_time_seconds: totalTime,
    total_time_formatted: formatTime(totalTime),
    by_estado: byEstado,
  };
}

function processGroup(
  records: VehiculoUbicacionHistorial[],
): VehiculoHistorialGrouped {
  const minFecha = Math.min(...records.map((r) => r.fecha));
  const maxFecha = Math.max(...records.map((r) => r.fecha));
  const totalTimeSeconds = maxFecha - minFecha;

  const velocidades = records.map((r) => parseFloat(r.velocidad));
  const avgVelocidad =
    velocidades.length > 0 ? velocidades.reduce((a, b) => a + b, 0) / velocidades.length : 0;
  const maxVelocidad = Math.max(...velocidades);

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < records.length; i++) {
    const [lat1, lng1] = records[i - 1].coordenadas.split(",").map(Number);
    const [lat2, lng2] = records[i].coordenadas.split(",").map(Number);
    totalDistance += haversineDistance(lat1, lng1, lat2, lng2);
  }

  const [startLat, startLng] = records[0].coordenadas.split(',').map(Number);
  const [endLat, endLng] = records[records.length - 1].coordenadas.split(',').map(Number);

  const processedRecords: ProcessedRouteRecord[] = records.map(r => {
    const { coordenadas, ...rest } = r;
    const [lat, lng] = coordenadas.split(',').map(Number);
    return { ...rest, lat, lng };
  });

  return {
    id_estado: records[0].id_estado,
    description: records[0].param1,
    color: records[0].param3,
    count: records.length,
    start_id: records[0].id,
    end_id: records[records.length - 1].id,
    total_time_seconds: totalTimeSeconds,
    total_time_formatted: formatTime(totalTimeSeconds),
    avg_velocidad: Math.round(avgVelocidad * 100) / 100,
    max_velocidad: maxVelocidad,
    total_distance_km: Math.round(totalDistance * 1000) / 1000,
    startPoint: { lat: startLat, lng: startLng },
    endPoint: { lat: endLat, lng: endLng },
    records: processedRecords,
  };
}
