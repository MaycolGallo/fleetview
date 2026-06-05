"use client";

import { useState, useEffect, useRef } from 'react';

interface Position {
  lat: number;
  lng: number;
}

interface UseAnimatedPositionOptions {
  duration?: number;
  easing?: (t: number) => number;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * A custom React hook that smoothly animates a geographical position.
 * Fixed to ensure independent position state for every marker instance.
 */
export const useAnimatedPosition = (
  targetPosition: Position,
  options: UseAnimatedPositionOptions = {}
) => {
  const { duration = 1000, easing = easeOutCubic } = options;

  // Initialize with target position
  const [currentPosition, setCurrentPosition] = useState<Position>(targetPosition);

  const animationRef = useRef<number | null>(null);
  const startPositionRef = useRef<Position>(targetPosition);
  const startTimeRef = useRef<number | null>(null);
  
  // Ref to track the actual current value for the next animation start
  const lastResolvedPosition = useRef<Position>(targetPosition);

  useEffect(() => {
    // If we are already at the target, do nothing
    if (
      lastResolvedPosition.current.lat === targetPosition.lat &&
      lastResolvedPosition.current.lng === targetPosition.lng
    ) {
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Start from wherever we were last resolved
    startPositionRef.current = lastResolvedPosition.current;
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

      const nextPos = { lat: newLat, lng: newLng };
      setCurrentPosition(nextPos);
      lastResolvedPosition.current = nextPos;

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentPosition(targetPosition);
        lastResolvedPosition.current = targetPosition;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetPosition.lat, targetPosition.lng, duration, easing]);

  return currentPosition;
};
