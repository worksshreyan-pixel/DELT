import { google, drive_v3, Auth } from 'googleapis';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { decryptCredential, encryptCredential } from '@/lib/utils/encryption';
import { createAdminClient } from '@/lib/supabase/admin';

export class GoogleDriveClient {
  public drive: drive_v3.Drive;
  private oauth2Client: Auth.OAuth2Client;

  constructor(
    private userId: string,
    private connectionId: string,
    private metadata: any,
    oauth2Client: Auth.OAuth2Client
  ) {
    this.oauth2Client = oauth2Client;
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Initializes the Google Drive client for a given user, handling token decryption and setup.
   */
  static async createForUser(userId: string): Promise<GoogleDriveClient> {
    const supabase = createAdminClient();
    const { data: connection, error } = await supabase
      .from('storage_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google_drive')
      .single();

    if (error || !connection) {
      throw new Error('Google Drive connection not found for user.');
    }

    if (connection.status !== 'connected') {
      throw new Error(`Google Drive connection is ${connection.status}. Reconnection required.`);
    }

    if (connection.provider_type !== 'CUSTOMER_MANAGED') {
      throw new Error('Invalid provider type for Google Drive.');
    }

    const metadata = connection.metadata as any;
    const credentials = metadata?.oauth_credentials;

    if (!credentials?.access_token_encrypted) {
      throw new Error('Missing Google Drive credentials.');
    }

    const encryptionKey = process.env.GOOGLE_OAUTH_ENCRYPTION_KEY;
    if (!encryptionKey) throw new Error('Missing encryption key.');

    const accessToken = decryptCredential(credentials.access_token_encrypted, encryptionKey);
    const refreshToken = credentials.refresh_token_encrypted 
      ? decryptCredential(credentials.refresh_token_encrypted, encryptionKey)
      : undefined;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      // If we have an expiry, we set it so the client knows when to refresh
      expiry_date: credentials.expires_at,
    });

    // Handle token refresh events
    oauth2Client.on('tokens', async (tokens) => {
      // Re-encrypt the new tokens
      const newAccessTokenEncrypted = encryptCredential(tokens.access_token!, encryptionKey);
      
      // IMPORTANT: If Google does not return a new refresh token, preserve the existing one.
      const newRefreshTokenEncrypted = tokens.refresh_token 
        ? encryptCredential(tokens.refresh_token, encryptionKey)
        : credentials.refresh_token_encrypted;

      const updatedMetadata = {
        ...metadata,
        oauth_credentials: {
          ...metadata.oauth_credentials,
          access_token_encrypted: newAccessTokenEncrypted,
          refresh_token_encrypted: newRefreshTokenEncrypted,
          expires_at: tokens.expiry_date || (Date.now() + 3600 * 1000),
        },
      };

      // Background update of tokens in the database
      const admin = createAdminClient();
      await admin
        .from('storage_connections')
        .update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
        .eq('id', connection.id);
    });

    return new GoogleDriveClient(userId, connection.id, metadata, oauth2Client);
  }

  /**
   * Translates Google API errors into safe, actionable application errors.
   */
  private handleDriveError(error: any): never {
    const status = error?.response?.status || error?.code;
    
    if (status === 401 || status === 403) {
      throw new Error('Google Drive access denied. The connection may need to be reauthorized.');
    }
    if (status === 404) {
      throw new Error('The requested Google Drive resource was not found or was deleted.');
    }
    throw new Error(`Google Drive operation failed: ${error.message || 'Unknown error'}`);
  }

  /**
   * Ensures the DELT root folder exists in the user's Drive, reusing it if found.
   */
  async ensureRootFolder(): Promise<string> {
    const existingRootId = this.metadata?.drive?.root_folder_id;

    if (existingRootId) {
      try {
        const res = await this.drive.files.get({
          fileId: existingRootId,
          fields: 'id, trashed',
        });
        if (!res.data.trashed) {
          return existingRootId; // Still valid and active
        }
      } catch (e: any) {
        if (e?.response?.status !== 404) {
          this.handleDriveError(e);
        }
        // If 404, it was deleted permanently, proceed to search/recreate.
      }
    }

    // Search for existing DELT root folder to prevent duplicates
    try {
      const searchRes = await this.drive.files.list({
        q: "name = 'DELT' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false",
        fields: 'files(id)',
        spaces: 'drive',
      });

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        const foundId = searchRes.data.files[0].id!;
        await this.persistRootFolderId(foundId);
        return foundId;
      }

      // Create a new one
      const createRes = await this.drive.files.create({
        requestBody: {
          name: 'DELT',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root'],
        },
        fields: 'id',
      });

      const newId = createRes.data.id!;
      await this.persistRootFolderId(newId);
      return newId;

    } catch (error) {
      this.handleDriveError(error);
    }
  }

  private async persistRootFolderId(folderId: string) {
    const updatedMetadata = {
      ...this.metadata,
      drive: {
        ...this.metadata?.drive,
        root_folder_id: folderId,
      },
    };

    const admin = createAdminClient();
    await admin
      .from('storage_connections')
      .update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
      .eq('id', this.connectionId);
    
    // Update local copy
    this.metadata = updatedMetadata;
  }

  /**
   * Ensures a deal folder exists beneath the DELT root folder.
   */
  async ensureDealFolder(dealId: string, dealCode: string): Promise<string> {
    const admin = createAdminClient();
    
    // 1. Verify deal ownership
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('deal_code, creator_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      throw new Error('Deal not found or access denied.');
    }

    if (deal.creator_id !== this.userId) {
      throw new Error('Unauthorized: You do not own this deal.');
    }

    if (deal.deal_code !== dealCode) {
      throw new Error('Deal code mismatch.');
    }

    // 2. Check storage_objects for an existing folder reference
    const { data: existingObject } = await admin
      .from('storage_objects')
      .select('id, external_object_id')
      .eq('deal_id', dealId)
      .eq('provider', 'google_drive')
      .eq('mime_type', 'application/vnd.google-apps.folder')
      .is('file_version_id', null)
      .is('deliverable_id', null)
      .single();

    if (existingObject?.external_object_id) {
      try {
        const res = await this.drive.files.get({
          fileId: existingObject.external_object_id,
          fields: 'id, trashed',
        });
        if (!res.data.trashed) {
          return existingObject.external_object_id;
        }
      } catch (e: any) {
        if (e?.response?.status !== 404) {
          this.handleDriveError(e);
        }
        // If 404, it was deleted permanently, fall through to search/recreate
      }
    }

    // 3. Ensure Root Folder exists
    const rootFolderId = await this.ensureRootFolder();

    // 4. Search Drive under Root Folder
    try {
      const searchRes = await this.drive.files.list({
        q: `name = '${dealCode}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed = false`,
        fields: 'files(id)',
        spaces: 'drive',
      });

      let folderId: string;

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        folderId = searchRes.data.files[0].id!;
      } else {
        // Create new deal folder
        const createRes = await this.drive.files.create({
          requestBody: {
            name: dealCode,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [rootFolderId],
          },
          fields: 'id',
        });
        folderId = createRes.data.id!;
      }

      // 5. Persist the reference in storage_objects
      if (existingObject) {
        await admin
          .from('storage_objects')
          .update({ external_object_id: folderId, updated_at: new Date().toISOString() })
          .eq('id', existingObject.id);
      } else {
        await admin
          .from('storage_objects')
          .insert({
            deal_id: dealId,
            connection_id: this.connectionId,
            provider: 'google_drive',
            ownership_type: 'CUSTOMER_MANAGED',
            external_object_id: folderId,
            name: dealCode,
            mime_type: 'application/vnd.google-apps.folder',
            size: 0, // IMPORTANT: size is 0 for folders
            metadata: {},
          });
      }

      return folderId;

    } catch (error) {
      this.handleDriveError(error);
    }
  }

  /**
   * Initializes a Resumable Upload session for a specific deal folder.
   */
  async createResumableUploadSession(folderId: string, fileName: string, mimeType?: string): Promise<string> {
    try {
      // We must explicitly use fetch here because googleapis drive.files.create with uploadType=resumable
      // abstracts away the session URI and tries to perform the upload immediately.
      // We want the raw Session URI to return to the client.
      const accessToken = (await this.oauth2Client.getAccessToken()).token;
      if (!accessToken) throw new Error('Failed to retrieve access token for upload.');

      const metadata = {
        name: fileName,
        parents: [folderId],
        ...(mimeType ? { mimeType } : {})
      };

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType || 'application/octet-stream',
        },
        body: JSON.stringify(metadata)
      });

      if (!res.ok) {
        throw new Error(`Failed to create resumable upload session: ${res.statusText}`);
      }

      const location = res.headers.get('Location');
      if (!location) {
        throw new Error('Google Drive API did not return a resumable session URI.');
      }

      return location;
    } catch (error) {
      this.handleDriveError(error);
    }
  }

  /**
   * Verifies that the uploaded file exists, is not trashed, and belongs to the expected folder.
   */
  async verifyUpload(fileId: string, expectedFolderId: string): Promise<any> {
    try {
      const res = await this.drive.files.get({
        fileId,
        fields: 'id, name, size, mimeType, parents, trashed, webViewLink'
      });

      const file = res.data;

      if (file.trashed) {
        throw new Error('Uploaded file is in the trash.');
      }

      if (!file.parents || !file.parents.includes(expectedFolderId)) {
        throw new Error('Uploaded file does not belong to the correct deal folder.');
      }

      return file;
    } catch (error) {
      this.handleDriveError(error);
    }
  }
}
