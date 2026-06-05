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
 * Optimized to prevent coordinate clustering and handle rapid updates.
 */
export const useAnimatedPosition = (
  targetPosition: Position,
  options: UseAnimatedPositionOptions = {}
) => {
  const { duration = 1000, easing = easeOutCubic } = options;

  const [currentPosition, setCurrentPosition] = useState<Position>(targetPosition);
  const animationRef = useRef<number | null>(null);
  const startPositionRef = useRef<Position>(targetPosition);
  const startTimeRef = useRef<number | null>(null);
  const lastResolvedPosition = useRef<Position>(targetPosition);

  // Sync state immediately if jumping or initialization
  useEffect(() => {
    if (!lastResolvedPosition.current) {
      setCurrentPosition(targetPosition);
      lastResolvedPosition.current = targetPosition;
      return;
    }
  }, []);

  useEffect(() => {
    // If coords are the same, don't restart animation
    if (
      lastResolvedPosition.current.lat === targetPosition.lat &&
      lastResolvedPosition.current.lng === targetPosition.lng
    ) {
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startPositionRef.current = lastResolvedPosition.current;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const nextPos = {
        lat: startPositionRef.current.lat + (targetPosition.lat - startPositionRef.current.lat) * easedProgress,
        lng: startPositionRef.current.lng + (targetPosition.lng - startPositionRef.current.lng) * easedProgress,
      };

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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetPosition.lat, targetPosition.lng, duration, easing]);

  return currentPosition;
};