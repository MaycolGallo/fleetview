

'use client';

import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatePresence, motion } from 'framer-motion';
import { useFleet } from '@/context/fleet-context';
import { RouteHistoryContent } from './route-history-content';

interface RouteHistorySheetProps {}

export function RouteHistorySheet(props: RouteHistorySheetProps) {
  const isMobile = useIsMobile();
  const { state, dispatch } = useFleet();
  const { isRouteSheetOpen } = state;

  const handleOpenChange = (isOpen: boolean) => {
    dispatch({ type: 'SET_ROUTE_SHEET_OPEN', payload: isOpen });
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
    <AnimatePresence>
      {isRouteSheetOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-4 left-4 right-4 z-20"
        >
          <RouteHistoryContent onSegmentSelect={handleSegmentSelect} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
