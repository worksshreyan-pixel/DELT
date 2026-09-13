// ============================================================================
// DELT — Storage Provider Abstraction Types
// ============================================================================

export type ProviderOwnershipType = 'DELT_MANAGED' | 'CUSTOMER_MANAGED';

export interface StorageCapabilities {
  canUpload: boolean;
  canDownload: boolean;
  canDelete: boolean;
  canCreateFolders: boolean;
  canImport: boolean;
  canExport: boolean;
  canManagePermissions: boolean;
  supportsOAuth: boolean;
  supportsWebhooks: boolean;
  supportsResumableUpload: boolean;
}

export interface StorageObjectMetadata {
  id?: string;
  provider: string;
  ownershipType: ProviderOwnershipType;
  externalObjectId?: string | null;
  externalUrl?: string | null;
  objectPath?: string | null;
  name: string;
  mimeType?: string | null;
  size: number;
  checksum?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StorageConnectionMetadata {
  id: string;
  userId: string;
  provider: string;
  providerType: ProviderOwnershipType;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  externalAccountId?: string | null;
  displayName?: string | null;
}

export interface UploadInitResponse {
  signedUrl?: string;
  objectPath?: string;
  externalObjectId?: string;
  uploadId?: string;
  // Any extra metadata
  extra?: Record<string, any>;
}

/**
 * The core contract for any storage provider (Supabase, Google Drive, etc.)
 */
export interface IStorageProvider {
  /**
   * Identifies the provider uniquely
   */
  readonly id: string;

  /**
   * Identifies if DELT or Customer manages the physical files
   */
  readonly ownershipType: ProviderOwnershipType;

  /**
   * Declares what this provider can do
   */
  readonly capabilities: StorageCapabilities;

  /**
   * Initialize an upload session, generating signed URLs if necessary
   */
  initializeUpload(
    userId: string,
    dealId: string,
    file: { name: string; size: number; mimeType?: string },
    options?: { isPreview?: boolean; versionNum?: number }
  ): Promise<UploadInitResponse>;

  /**
   * Complete the upload session
   */
  completeUpload(
    userId: string,
    dealId: string,
    uploadContext: UploadInitResponse
  ): Promise<StorageObjectMetadata>;

  /**
   * Get a temporary access/download URL for the object
   */
  getAccessUrl(
    userId: string,
    objectPathOrId: string
  ): Promise<string>;

  /**
   * Permanently delete the physical file
   */
  deletePhysicalObject(
    userId: string,
    objectPathOrId: string
  ): Promise<void>;

  /**
   * Unlink (for external files)
   */
  unlink(
    userId: string,
    objectPathOrId: string
  ): Promise<void>;
}
