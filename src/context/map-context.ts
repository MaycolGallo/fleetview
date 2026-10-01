'use client';

import { useFleetDispatch, useFleetState } from './fleet-context';
import { getMapFlags } from './fleet-selectors';

export function useMapState() {
  const { state } = useFleetState();
  return {
    mapProvider: state.mapProvider,
    mapType: state.mapType,
    isMapDark: state.isMapDark,
    showTraffic: state.showTraffic,
    focusedMiniMapId: state.focusedMiniMapId,
    miniMaps: state.miniMaps,
    mapViewport: state.mapViewport,
    flags: getMapFlags(state),
  };
}

export function useMapActions() {
  const dispatch = useFleetDispatch();
  return {
    dispatch,
    focusMiniMap: (id: string) => dispatch({ type: 'FOCUS_MINIMAP', payload: id }),
    unfocusMiniMap: () => dispatch({ type: 'UNFOCUS_MINIMAP' }),
    completeViewportAction: () => dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' }),
  };
}
