

'use client';

import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { RouteHistoryContent } from './route-history-content';
import { useCallback } from 'react';

interface RouteHistorySheetProps {}

export function RouteHistorySheet(props: RouteHistorySheetProps) {
  const isMobile = useIsMobile();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isRouteSheetOpen } = state;

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
        // @ts-ignore
        if (document.startViewTransition) {
            // @ts-ignore
            document.startViewTransition(() => {
                dispatch({ type: 'BACK_TO_FLEET' });
            });
        } else {
            dispatch({ type: 'BACK_TO_FLEET' });
        }
    }
  }, [dispatch]);

  const handleSegmentSelect = useCallback((segmentIndex: number) => {
    dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: segmentIndex });
  }, [dispatch]);
  
  if (isMobile) {
    return (
        <Drawer open={isRouteSheetOpen} onOpenChange={handleOpenChange}>
            <DrawerContent className="h-[40%]">
                <RouteHistoryContent onSegmentSelect={handleSegmentSelect} />
            </DrawerContent>
      </Drawer>
    )
  }

  return (
    <>
      {isRouteSheetOpen && (
        <div
          style={{ viewTransitionName: 'route-sheet-transition' }}
          className="absolute bottom-4 left-4 right-4 z-20"
        >
          <RouteHistoryContent onSegmentSelect={handleSegmentSelect} />
        </div>
      )}
    </>
  );
}
