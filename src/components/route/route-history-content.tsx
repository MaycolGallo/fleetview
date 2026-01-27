
'use client';

import {
  ParkingSquare,
  Clock,
  Truck,
} from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useFleetState } from '@/context/fleet-context';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { RouteHistoryMobileTimeline } from './route-history-mobile-timeline';
import { RouteHistoryDesktopTimeline } from './route-history-desktop-timeline';

interface RouteHistoryContentProps {
    onSegmentSelect: (index: number) => void;
}

const statusIconMap: { [key: number]: React.ElementType } = {
    4: Clock, // Ralenti
    5: ParkingSquare, // Estacionado
    6: Truck, // Transitando
};

export function RouteHistoryContent({ onSegmentSelect }: RouteHistoryContentProps) {
    const isMobile = useIsMobile();
    const { state } = useFleetState();
    const { routeGroups: groups, selectedSegmentIndex } = state;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, groups.length);
    }, [groups]);

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
        groups,
        statusIconMap,
        selectedSegmentIndex,
        onSegmentSelect,
        itemRefs,
        scrollContainerRef
    };

    if (isMobile) {
        return <RouteHistoryMobileTimeline {...timelineProps} />;
    }
    
    return <RouteHistoryDesktopTimeline {...timelineProps} />;
}
