
"use client";

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';

export function RoutePolyline({
  routePath,
  color,
  weight,
  zIndex = 1,
  onClick,
  showArrows = false,
}: {
  routePath: { lat: number; lng: number }[] | null,
  color: string,
  weight: number,
  zIndex?: number,
  onClick?: () => void,
  showArrows?: boolean,
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (map && routePath && routePath.length > 0) {
      const arrowIcon = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        strokeOpacity: 1,
        scale: 3,
        strokeColor: color,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: 1,
      };

      const newPolyline = new google.maps.Polyline({
        path: routePath,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: weight,
        map: map,
        zIndex: zIndex,
        clickable: !!onClick,
        icons: showArrows ? [{
          icon: arrowIcon,
          offset: '0',
          repeat: '75px'
        }] : undefined,
      });
      polylineRef.current = newPolyline;

      if (onClick) {
        newPolyline.addListener('click', () => {
          onClick();
        });
      }

    } else {
        polylineRef.current = null;
    }

    return () => {
      if (polylineRef.current) {
        google.maps.event.clearInstanceListeners(polylineRef.current);
        polylineRef.current.setMap(null);
      }
    };
  }, [map, routePath, color, weight, zIndex, onClick, showArrows]);

  return null;
}
