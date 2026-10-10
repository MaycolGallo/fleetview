import type { Dispatch } from 'react';
import { fleetReducer, getInitialState, type FleetAction } from './fleet-reducer';
import type { FleetState } from '@/lib/types';

export interface FleetStore {
  getState: () => FleetState;
  subscribe: (listener: () => void) => () => void;
  dispatch: Dispatch<FleetAction>;
}

export function createFleetStore(): FleetStore {
  let state = getInitialState();
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch: (action) => {
      const nextState = fleetReducer(state, action);
      if (Object.is(nextState, state)) return;
      state = nextState;
      listeners.forEach((listener) => listener());
    },
  };
}
