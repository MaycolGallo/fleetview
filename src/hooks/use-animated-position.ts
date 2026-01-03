
"use client";

import { useState, useEffect, useRef } from 'react';

interface Position {
  lat: number;
  lng: number;
}

interface UseAnimatedPositionOptions {
  duration?: number; // Animation duration in ms
  easing?: (t: number) => number;
}

// Smooth easing function (ease-out cubic)
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const useAnimatedPosition = (
  targetPosition: Position,
  options: UseAnimatedPositionOptions = {}
) => {
  const { duration = 1500, easing = easeOutCubic } = options;
  
  const [currentPosition, setCurrentPosition] = useState<Position>(targetPosition);
  const animationRef = useRef<number | null>(null);
  const startPositionRef = useRef<Position>(targetPosition);
  const startTimeRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setCurrentPosition(targetPosition);
      return;
    }

    // If position hasn't changed, do nothing
    if (
      startPositionRef.current.lat === targetPosition.lat &&
      startPositionRef.current.lng === targetPosition.lng
    ) {
      return;
    }

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startPositionRef.current = currentPosition;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const newLat =
        startPositionRef.current.lat +
        (targetPosition.lat - startPositionRef.current.lat) * easedProgress;
      const newLng =
        startPositionRef.current.lng +
        (targetPosition.lng - startPositionRef.current.lng) * easedProgress;

      setCurrentPosition({ lat: newLat, lng: newLng });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at target
        setCurrentPosition(targetPosition);
        startPositionRef.current = targetPosition;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPosition.lat, targetPosition.lng, duration, easing]);

  return currentPosition;
};
