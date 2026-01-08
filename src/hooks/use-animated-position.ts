
"use client";

import { useState, useEffect, useRef } from 'react';

// Defines the shape of a geographical position object.
interface Position {
  lat: number;
  lng: number;
}

// Defines the optional configuration for the animation hook.
interface UseAnimatedPositionOptions {
  duration?: number; // The total time the animation should take, in milliseconds.
  easing?: (t: number) => number; // A function that dictates the animation's rate of change over time.
}

// An example of an easing function. This one, "ease-out cubic", starts the
// animation quickly and then slows it down as it approaches the target.
// `t` is the raw progress (0 to 1), and the function returns the adjusted progress.
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * A custom React hook that smoothly animates a geographical position from a
 * starting point to a target point.
 *
 * @param targetPosition The destination `Position` for the animation.
 * @param options Optional configuration for the animation, like `duration` and `easing`.
 * @returns The current `Position` during the animation.
 */
export const useAnimatedPosition = (
  targetPosition: Position,
  options: UseAnimatedPositionOptions = {}
) => {
  // Destructure options with default values. If no duration is provided, it defaults to 1.5 seconds.
  const { duration = 1500, easing = easeOutCubic } = options;

  // `currentPosition` is the state that gets updated on every animation frame,
  // causing the component to re-render and display the new position.
  const [currentPosition, setCurrentPosition] = useState<Position>(targetPosition);

  // `useRef` is used to store values that persist across renders without causing
  // the component to re-render themselves. This is ideal for managing animation state.

  // `animationRef` holds the ID returned by `requestAnimationFrame`, which is
  // needed to cancel the animation frame if the component unmounts or a new
  // animation is triggered.
  const animationRef = useRef<number | null>(null);

  // `startPositionRef` stores the position at the beginning of an animation.
  // This is crucial for calculating the interpolation correctly on each frame.
  const startPositionRef = useRef<Position>(targetPosition);

  // `startTimeRef` stores the timestamp when the animation begins. This allows
  // us to calculate the elapsed time accurately.
  const startTimeRef = useRef<number | null>(null);

  // `isFirstRender` is a flag to prevent the animation from running on the
  // initial render. We want the component to appear at its initial position
  // without animating from somewhere else.
  const isFirstRender = useRef(true);

  // The `useEffect` hook is where the animation logic is triggered.
  // It runs whenever the `targetPosition` or other options change.
  useEffect(() => {
    // On the very first render, we just set the position and do nothing else.
    // The `isFirstRender` ref prevents the animation from running unnecessarily.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setCurrentPosition(targetPosition);
      return;
    }

    // Optimization: if the target position is the same as the last known start
    // position, it means we are already at the destination, so no animation is needed.
    if (
      startPositionRef.current.lat === targetPosition.lat &&
      startPositionRef.current.lng === targetPosition.lng
    ) {
      return;
    }

    // If a new animation is triggered while another is already in progress,
    // we must cancel the old one to avoid conflicting state updates.
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Set the starting point for the new animation to wherever the position
    // currently is. This ensures a smooth transition from the previous state.
    startPositionRef.current = currentPosition;
    // Reset the start time for the new animation.
    startTimeRef.current = null;

    // The `animate` function is the core of the animation loop. It's called
    // recursively by `requestAnimationFrame`.
    const animate = (timestamp: number) => {
      // `timestamp` is a high-resolution timestamp provided by `requestAnimationFrame`.
      // It's the number of milliseconds since the page was loaded.
      // We capture the start time on the first frame of the animation.
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      // Calculate how much time has passed since the animation began.
      const elapsed = timestamp - startTimeRef.current;
      
      // `progress` is a value between 0 and 1 that represents the animation's
      // state. We use `Math.min` to clamp the value at 1, ensuring we don't
      // overshoot the target even if the animation loop runs a bit long.
      const progress = Math.min(elapsed / duration, 1);
      
      // The `easedProgress` applies a transformation to the raw progress.
      // This is what makes the animation feel non-linear and more natural.
      // Instead of moving at a constant speed, it can, for example, ease-out
      // (start fast and end slow), as defined by the `easeOutCubic` function.
      const easedProgress = easing(progress);

      // This is the core of the animation: linear interpolation (or "lerp").
      // We calculate the new latitude and longitude by moving from the start
      // position towards the target position by a fraction equal to the `easedProgress`.
      const newLat =
        startPositionRef.current.lat +
        (targetPosition.lat - startPositionRef.current.lat) * easedProgress;
      const newLng =
        startPositionRef.current.lng +
        (targetPosition.lng - startPositionRef.current.lng) * easedProgress;

      // Update the component's state. This triggers a re-render, and because this
      // function is called on every frame, it creates the illusion of smooth movement.
      setCurrentPosition({ lat: newLat, lng: newLng });

      // If `progress` is less than 1, it means the animation isn't finished yet.
      // We use `requestAnimationFrame` to schedule the `animate` function to be
      // called again on the next paint cycle. The ID of this request is stored
      // in a ref so we can cancel it if the component unmounts or a new
      // animation starts.
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Once the animation is complete, we perform a final state update to
        // ensure the position is *exactly* at the target. This corrects any
        // tiny floating-point inaccuracies from the interpolation.
        setCurrentPosition(targetPosition);
        // We also update the `startPositionRef` to be the `targetPosition`.
        // This is crucial so that if a new animation is triggered, it will start
        // from this new, correct position, preventing any visual jumps.
        startPositionRef.current = targetPosition;
      }
    };

    // Kick off the animation loop by requesting the first frame.
    animationRef.current = requestAnimationFrame(animate);

    // The cleanup function for the `useEffect` hook.
    // If the component unmounts while an animation is in progress,
    // we need to cancel the animation frame request to prevent memory leaks
    // and errors from trying to update state on an unmounted component.
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  // The dependency array ensures this effect re-runs only when the target position,
  // duration, or easing function changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPosition.lat, targetPosition.lng, duration, easing]);

  // Finally, the hook returns the `currentPosition`, which can be used by the
  // component to position an element on the screen.
  return currentPosition;
};
