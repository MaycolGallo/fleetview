import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Vehicle, Point } from '@/lib/types';

export function createDivIcon(html: string, size: [number, number] = [56, 56], anchor: [number, number] = [28, 56]) {
  return L.divIcon({
    html,
    className: '',
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -anchor[1]],
  });
}

export function createVehicleIconHtml(vehicle: Vehicle, isSelected: boolean) {
  const color = vehicle.statusColor || '#9E9E9E';
  const speed = Math.round(parseFloat(vehicle.velocidad) || 0);

  return renderToStaticMarkup(
    <div
      style={{
        width: '56px',
        height: '56px',
        position: 'relative',
        transform: 'translateY(-4px)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: isSelected ? '46px' : '40px',
          height: isSelected ? '46px' : '40px',
          borderRadius: '9999px',
          backgroundColor: color,
          border: '3px solid white',
          boxShadow: '0 0 0 4px rgba(255,255,255,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '9999px',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: color,
              borderRadius: '9999px',
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '32px',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `12px solid ${color}`,
        }}
      />
      {speed > 0 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '-14px',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.75)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {speed}
        </div>
      )}
    </div>
  );
}

export function createIconHtml(svg: string, backgroundColor: string) {
  return renderToStaticMarkup(
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '9999px',
        backgroundColor,
        border: '2px solid white',
        boxShadow: '0 0 0 4px rgba(255,255,255,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{ width: '18px', height: '18px', color: 'white' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

export const incidenceIconMap: Record<string, string> = {
  panic: '<path d="M12 2L2 22h20L12 2zm0 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm1 8h-2v-2h2v2zm0-4h-2V8h2v5.5z" fill="currentColor" />',
  harsh_accel: '<path d="M13 2L3 18h7v4l7-12h-7V2z" fill="currentColor" />',
  harsh_brake: '<path d="M11 2h2v12h-2V2zm-4 12h10v2H7v-2z" fill="currentColor" />',
  speeding: '<path d="M13 2.1V0h-2v2.1A10 10 0 0 0 2.1 11H0v2h2.1A10 10 0 0 0 11 21.9V24h2v-2.1A10 10 0 0 0 21.9 13H24v-2h-2.1A10 10 0 0 0 13 2.1zM12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" fill="currentColor" />',
  excessive_idle: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11H7v-2h4V6h2v7z" fill="currentColor" />',
};

export const incidenceColorMap: Record<string, string> = {
  panic: '#EF4444',
  harsh_accel: '#F59E0B',
  harsh_brake: '#F97316',
  speeding: '#DC2626',
  excessive_idle: '#6B7280',
};

export function catmullRomSpline(points: Point[], pointsPerSegment = 10): Point[] {
  if (points.length < 2) {
    return points;
  }

  const result: Point[] = [];
  result.push(points[0]);

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

    for (let j = 1; j <= pointsPerSegment; j += 1) {
      const t = j / pointsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const lat = 0.5 * (
        (2 * p1.lat) +
        (-p0.lat + p2.lat) * t +
        (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
        (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3
      );
      const lng = 0.5 * (
        (2 * p1.lng) +
        (-p0.lng + p2.lng) * t +
        (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 +
        (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3
      );
      result.push({ lat, lng });
    }
  }

  return result;
}
