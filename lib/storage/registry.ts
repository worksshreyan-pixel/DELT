// ============================================================================
// DELT — Storage Provider Registry
// ============================================================================

import { IStorageProvider, ProviderOwnershipType } from './types';

class StorageRegistry {
  private providers = new Map<string, IStorageProvider>();
  private defaultProviderId: string = 'supabase';

  register(provider: IStorageProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId: string): IStorageProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Storage provider '${providerId}' is not registered.`);
    }
    return provider;
  }

  getDefaultProvider(): IStorageProvider {
    return this.getProvider(this.defaultProviderId);
  }

  setDefaultProvider(providerId: string) {
    this.defaultProviderId = providerId;
  }
}

export const storageRegistry = new StorageRegistry();
