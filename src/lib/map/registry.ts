import type { MapAdapter, MapAdapterFactory, MapProviderRegistry } from './ports';

export function createMapProviderRegistry(factories: Record<string, MapAdapterFactory>): MapProviderRegistry {
  return {
    get(provider, map): MapAdapter {
      const factory = factories[provider];
      if (!factory) throw new Error(`Unsupported map provider: ${provider}`);
      return factory(map);
    },
  };
}
