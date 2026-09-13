// ============================================================================
// DELT — Supabase Storage Provider
// ============================================================================

import { createAdminClient } from '@/lib/supabase/admin';
import {
  IStorageProvider,
  ProviderOwnershipType,
  StorageCapabilities,
  UploadInitResponse,
  StorageObjectMetadata,
} from '../types';

export class SupabaseStorageProvider implements IStorageProvider {
  readonly id = 'supabase';
  readonly ownershipType: ProviderOwnershipType = 'DELT_MANAGED';

  readonly capabilities: StorageCapabilities = {
    canUpload: true,
    canDownload: true,
    canDelete: true,
    canCreateFolders: true,
    canImport: false,
    canExport: false,
    canManagePermissions: false,
    supportsOAuth: false,
    supportsWebhooks: false,
    supportsResumableUpload: false,
  };

  private getBucketName() {
    return 'deal-files'; // Can be externalized to config later
  }

  async initializeUpload(
    userId: string,
    dealId: string,
    file: { name: string; size: number; mimeType?: string },
    options?: { isPreview?: boolean; versionNum?: number }
  ): Promise<UploadInitResponse> {
    const admin = createAdminClient();
    const versionNum = options?.versionNum || 1;
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = options?.isPreview
      ? `previews/${dealId}/v${versionNum}/${Date.now()}_${cleanFileName}`
      : `${dealId}/v${versionNum}/${Date.now()}_${cleanFileName}`;

    const { data: uploadUrlData, error: uploadUrlError } = await admin.storage
      .from(this.getBucketName())
      .createSignedUploadUrl(storagePath);

    if (uploadUrlError || !uploadUrlData?.signedUrl) {
      throw new Error(`Failed to generate signed upload URL: ${uploadUrlError?.message}`);
    }

    return {
      signedUrl: uploadUrlData.signedUrl,
      objectPath: storagePath,
    };
  }

  async completeUpload(
    userId: string,
    dealId: string,
    uploadContext: UploadInitResponse
  ): Promise<StorageObjectMetadata> {
    if (!uploadContext.objectPath) {
      throw new Error('Missing objectPath in upload context');
    }

    // In a real resumable flow, we'd verify the object here.
    // For standard Supabase signed uploads, the client uploads directly.
    // We assume it's successful if completeUpload is called.
    const now = new Date();

    return {
      provider: this.id,
      ownershipType: this.ownershipType,
      objectPath: uploadContext.objectPath,
      name: uploadContext.objectPath.split('/').pop() || 'file', // Basic fallback
      size: 0, // This should be populated by the caller or fetched via admin.storage
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAccessUrl(userId: string, objectPathOrId: string): Promise<string> {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(this.getBucketName())
      .createSignedUrl(objectPathOrId, 3600); // 1 hour expiry

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to get signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  async deletePhysicalObject(userId: string, objectPathOrId: string): Promise<void> {
    const admin = createAdminClient();
    const { error } = await admin.storage
      .from(this.getBucketName())
      .remove([objectPathOrId]);

    if (error) {
      throw new Error(`Failed to delete object from Supabase: ${error.message}`);
    }
  }

  async unlink(userId: string, objectPathOrId: string): Promise<void> {
    // For DELT_MANAGED, unlinking normally implies physical deletion according to business logic.
    // However, if called directly as unlink, we might just leave the file or throw an error.
    // Let's implement physical deletion for now to emulate current behavior, or leave it a no-op 
    // if unlink is purely logical. Unlink in DELT_MANAGED usually means physical deletion if orphaned.
    // Business logic in API layer will decide to call deletePhysicalObject instead.
  }
}
