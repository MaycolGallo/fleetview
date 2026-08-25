"use client";

import { useState, useEffect, useRef } from 'react';

interface Position {
  lat: number;
  lng: number;
}

interface UseAnimatedPositionOptions {
  /** Backwards-compatible fixed duration for existing marker callers. */
  duration?: number;
  minDuration?: number;
  maxDuration?: number;
  easing?: (t: number) => number;
  disabled?: boolean;
  mode?: 'legacy' | 'route';
  routeDuration?: number;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const calculateDistance = (from: Position, to: Position): number => {
  const earthRadiusKm = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(from.lat * Math.PI / 180)
    * Math.cos(to.lat * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * A custom React hook that smoothly animates a geographical position.
 * Optimized to prevent coordinate clustering and handle rapid updates.
 */
export const useAnimatedPosition = (
  targetPosition: Position,
  options: UseAnimatedPositionOptions = {}
) => {
  const {
    duration: fixedDuration,
    minDuration = 800,
    maxDuration = 2500,
    easing = easeOutCubic,
    disabled = false,
    mode = 'legacy',
    routeDuration = 2000,
  } = options;

  const [currentPosition, setCurrentPosition] = useState<Position>(targetPosition);
  const animationRef = useRef<number | null>(null);
  const startPositionRef = useRef<Position>(targetPosition);
  const startTimeRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);
  const targetRef = useRef(targetPosition);
  const currentRef = useRef(targetPosition);

  targetRef.current = targetPosition;
  currentRef.current = currentPosition;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (disabled) {
      startPositionRef.current = targetRef.current;
      currentRef.current = targetRef.current;
      setCurrentPosition(targetRef.current);
      return;
    }

    const from = currentRef.current;
    const to = targetRef.current;
    if (from.lat === to.lat && from.lng === to.lng) return;

    const distance = calculateDistance(from, to);
    const animationDuration = mode === 'route'
      ? routeDuration
      : fixedDuration ?? Math.min(maxDuration, Math.max(minDuration, minDuration + (distance / 50) * (maxDuration - minDuration)));
    const ease = mode === 'route' ? (t: number) => t : easing;

    startPositionRef.current = from;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / animationDuration, 1);
      const easedProgress = ease(progress);
      const nextPosition = {
        lat: from.lat + (to.lat - from.lat) * easedProgress,
        lng: from.lng + (to.lng - from.lng) * easedProgress,
      };

      currentRef.current = nextPosition;
      setCurrentPosition(nextPosition);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      currentRef.current = to;
      startPositionRef.current = to;
      animationRef.current = null;
      setCurrentPosition(to);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [targetPosition.lat, targetPosition.lng, fixedDuration, minDuration, maxDuration, easing, disabled, mode, routeDuration]);

  useEffect(() => () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
  }, []);

  return currentPosition;
};
