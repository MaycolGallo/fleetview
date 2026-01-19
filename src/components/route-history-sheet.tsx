

'use client';

import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFleet } from '@/context/fleet-context';
import { RouteHistoryContent } from './route-history-content';

interface RouteHistorySheetProps {}

export function RouteHistorySheet(props: RouteHistorySheetProps) {
  const isMobile = useIsMobile();
  const { state, dispatch } = useFleet();
  const { isRouteSheetOpen } = state;

  const handleOpenChange = (isOpen: boolean) => {
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
  }

  const handleSegmentSelect = (segmentIndex: number) => {
    dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: segmentIndex });
  };
  
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
