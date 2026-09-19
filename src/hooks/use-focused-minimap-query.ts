'use client';

import { parseAsString, useQueryState } from 'nuqs';

export function useFocusedMinimapQuery() {
  return useQueryState(
    'focusedMinimap',
    parseAsString.withOptions({ history: 'push', shallow: true }),
  );
}
