import {
  IStorageProvider,
  ProviderOwnershipType,
  StorageCapabilities,
  StorageObjectMetadata,
  UploadInitResponse
} from '../types';
import { GoogleDriveClient } from './google-drive-client';

export class GoogleDriveProvider implements IStorageProvider {
  readonly id = 'google_drive';
  readonly ownershipType: ProviderOwnershipType = 'CUSTOMER_MANAGED';
  
  readonly capabilities: StorageCapabilities = {
    canUpload: true,
    canDownload: false,
    canDelete: false,
    canCreateFolders: true,
    canImport: false,
    canExport: false,
    canManagePermissions: false,
    supportsOAuth: true,
    supportsWebhooks: false,
    supportsResumableUpload: true,
  };

  /**
   * Google Drive specific method: Ensure the DELT root folder exists in the user's Google Drive.
   */
  async ensureRootFolder(userId: string): Promise<string> {
    const client = await GoogleDriveClient.createForUser(userId);
    return await client.ensureRootFolder();
  }

  /**
   * Google Drive specific method: Ensure a deal folder exists beneath the DELT root folder.
   */
  async ensureDealFolder(userId: string, dealId: string, dealCode: string): Promise<string> {
    const client = await GoogleDriveClient.createForUser(userId);
    return await client.ensureDealFolder(dealId, dealCode);
  }

  async initializeUpload(
    userId: string,
    dealId: string,
    file: { name: string; size: number; mimeType?: string },
    options?: { isPreview?: boolean; versionNum?: number }
  ): Promise<UploadInitResponse> {
    const client = await GoogleDriveClient.createForUser(userId);
    
    // We need the dealCode to ensure the deal folder, but `initializeUpload` interface only gives dealId.
    // So we fetch the deal code here.
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const { data: deal } = await admin.from('deals').select('deal_code').eq('id', dealId).single();
    
    if (!deal) throw new Error('Deal not found for initializeUpload');
    
    const folderId = await client.ensureDealFolder(dealId, deal.deal_code);
    
    const sessionUri = await client.createResumableUploadSession(folderId, file.name, file.mimeType);

    return {
      signedUrl: sessionUri,
      objectPath: `google_drive://${dealId}/${file.name}`, // Temporary logical path
    };
  }

  async completeUpload(
    userId: string,
    dealId: string,
    uploadContext: UploadInitResponse
  ): Promise<StorageObjectMetadata> {
    if (!uploadContext.externalObjectId) {
      throw new Error('Google Drive completeUpload requires an externalObjectId (File ID).');
    }

    const client = await GoogleDriveClient.createForUser(userId);
    
    // Fetch deal code to get the correct deal folder id
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const { data: deal } = await admin.from('deals').select('deal_code').eq('id', dealId).single();
    if (!deal) throw new Error('Deal not found for completeUpload');

    const folderId = await client.ensureDealFolder(dealId, deal.deal_code);

    // Verify the upload
    const verifiedFile = await client.verifyUpload(uploadContext.externalObjectId, folderId);

    return {
      provider: this.id,
      ownershipType: this.ownershipType,
      externalObjectId: verifiedFile.id,
      externalUrl: verifiedFile.webViewLink,
      name: verifiedFile.name,
      mimeType: verifiedFile.mimeType,
      size: Number(verifiedFile.size || 0),
      objectPath: uploadContext.objectPath || undefined,
    };
  }

  async getAccessUrl(
    userId: string,
    objectPathOrId: string
  ): Promise<string> {
    throw new Error('GoogleDriveProvider.getAccessUrl is not implemented yet.');
  }

  async deletePhysicalObject(
    userId: string,
    objectPathOrId: string
  ): Promise<void> {
    throw new Error('GoogleDriveProvider.deletePhysicalObject is not implemented yet.');
  }

  async unlink(
    userId: string,
    objectPathOrId: string
  ): Promise<void> {
    throw new Error('GoogleDriveProvider.unlink is not implemented yet.');
  }
}
