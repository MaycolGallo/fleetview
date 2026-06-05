
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * A custom hook for managing horizontal scroll containers with navigation buttons.
 * Detects if scrolling is possible in either direction and provides helper functions to scroll.
 */
export function useHorizontalScroll() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      // Use a small buffer (1px) for floating point precision issues
      const isAtStart = el.scrollLeft <= 1;
      const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      
      setCanScrollLeft(!isAtStart);
      setCanScrollRight(!isAtEnd && el.scrollWidth > el.clientWidth);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    
    // Initial check after mount/render
    const timeout = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timeout);
    };
  }, [checkScroll]);

  // Re-check when content might have changed externally
  const refresh = useCallback(() => {
    checkScroll();
  }, [checkScroll]);

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
