
'use client';

import { useRef, useCallback, useSyncExternalStore } from 'react';

/**
 * A custom hook for managing horizontal scroll containers with navigation buttons.
 * Detects if scrolling is possible in either direction and provides helper functions to scroll.
 */
export function useHorizontalScroll() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getScrollSnapshot = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return '0:0';
    const canScrollLeft = el.scrollLeft > 1;
    const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1 && el.scrollWidth > el.clientWidth;
    return `${canScrollLeft ? 1 : 0}:${canScrollRight ? 1 : 0}`;
  }, []);

  const subscribeToScroll = useCallback((onStoreChange: () => void) => {
    document.addEventListener('scroll', onStoreChange, { passive: true, capture: true });
    window.addEventListener('resize', onStoreChange);
    return () => {
      document.removeEventListener('scroll', onStoreChange, true);
      window.removeEventListener('resize', onStoreChange);
    };
  }, []);

  const scrollSnapshot = useSyncExternalStore(subscribeToScroll, getScrollSnapshot, () => '0:0');
  const [canScrollLeft, canScrollRight] = scrollSnapshot.split(':').map(Boolean);

  const refresh = useCallback(() => {
    // Kept for API compatibility. Scroll/resize events update the external snapshot.
  }, []);

  const scroll = useCallback((direction: 'left' | 'right', distance: number = 400) => {
    scrollContainerRef.current?.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  }, []);

  return {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    checkScroll: refresh,
    scroll
  };
}
