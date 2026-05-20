
'use client';

import React, { useEffect, useRef } from 'react';
import { useFleetState } from '@/context/fleet-context';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { RouteHistoryMobileTimeline } from './route-history-mobile-timeline';
import { RouteHistoryDesktopTimeline } from './route-history-desktop-timeline';

interface RouteHistoryContentProps {
    viewportRef?: React.RefObject<HTMLDivElement>;
}

export function RouteHistoryContent({ viewportRef }: RouteHistoryContentProps) {
    const isMobile = useIsMobile();
    const { state } = useFleetState();
    const { routeGroups: groups, selectedSegmentIndex } = state;
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Effect for DOM manipulation (scrollIntoView) is still necessary
    useEffect(() => {
        if (selectedSegmentIndex !== null && itemRefs.current[selectedSegmentIndex]) {
            itemRefs.current[selectedSegmentIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: isMobile ? undefined : 'center'
            });
        }
    }, [selectedSegmentIndex, isMobile]);

    const timelineProps = {
        itemRefs,
        scrollContainerRef: viewportRef
    };

    if (isMobile) {
        return <RouteHistoryMobileTimeline {...timelineProps} />;
    }
    
    return <RouteHistoryDesktopTimeline {...timelineProps} />;
}
