'use client';

export interface UploadTask {
  id: string;
  batchId: string;
  dealId: string;
  deliverableId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  status: 'waiting' | 'uploading' | 'completed' | 'failed';
  error?: string;
  previewStatus?: 'waiting' | 'processing' | 'ready' | 'failed' | 'unavailable';
}

export interface UploadBatch {
  id: string;
  dealId: string;
  deliverableId: string;
  description: string;
  previewEnabled: boolean;
  manualPreviewFile?: File;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  tasks: UploadTask[];
  uploadedItems: any[];
}

type QueueListener = (tasks: UploadTask[]) => void;

class UploadQueueManager {
  private tasks: UploadTask[] = [];
  private batches: Map<string, UploadBatch> = new Map();
  private listeners: Set<QueueListener> = new Set();
  private activeUploads = 0;
  private maxConcurrency = 3;

  public subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener([...this.tasks]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const tasksCopy = [...this.tasks];
    this.listeners.forEach((listener) => listener(tasksCopy));
  }

  public getTasks(): UploadTask[] {
    return [...this.tasks];
  }

  public addUploads(
    dealId: string,
    deliverableId: string,
    files: File[],
    description: string,
    previewEnabled: boolean,
    manualPreviewFile?: File,
    autoStart = true
  ) {
    if (files.length === 0) return;

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const batchTasks: UploadTask[] = files.map((file) => {
      const task: UploadTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${file.name.replace(/[^a-zA-Z0-9]/g, '')}`,
        batchId,
        dealId,
        deliverableId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        bytesUploaded: 0,
        totalBytes: file.size,
        percentage: 0,
        status: 'waiting',
        previewStatus: (previewEnabled || !!manualPreviewFile) ? 'waiting' : undefined,
      };
      return task;
    });

    const batch: UploadBatch = {
      id: batchId,
      dealId,
      deliverableId,
      description,
      previewEnabled,
      manualPreviewFile,
      totalFiles: files.length,
      completedFiles: 0,
      failedFiles: 0,
      tasks: batchTasks,
      uploadedItems: [],
    };

    batchTasks.forEach((task, idx) => {
      activeFilesRegistry.set(task.id, files[idx]);
    });

    this.batches.set(batchId, batch);
    this.tasks = [...this.tasks, ...batchTasks];
    this.notify();

    if (autoStart) {
      this.processQueue();
    }
  }

  public startPendingUploadsForDeal(dealId: string) {
    const hasWaiting = this.tasks.some((t) => t.dealId === dealId && t.status === 'waiting');
    if (hasWaiting) {
      this.processQueue();
    }
  }

  public retryTask(taskId: string) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task && task.status === 'failed') {
      task.status = 'waiting';
      task.error = undefined;
      task.bytesUploaded = 0;
      task.percentage = 0;
      this.notify();
      this.processQueue();
    }
  }

  public removeTask(taskId: string) {
    activeFilesRegistry.delete(taskId);
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.notify();
  }

  private processQueue() {
    if (this.activeUploads >= this.maxConcurrency) return;

    const nextTask = this.tasks.find((t) => t.status === 'waiting');
    if (!nextTask) return;

    this.activeUploads++;
    nextTask.status = 'uploading';
    this.notify();

    this.uploadTask(nextTask)
      .then(() => {
        this.activeUploads--;
        this.processQueue();
      })
      .catch((err) => {
        console.error('Queue upload task error:', err);
        this.activeUploads--;
        this.processQueue();
      });
  }

  private async uploadTask(task: UploadTask): Promise<void> {
    const batch = this.batches.get(task.batchId);
    if (!batch) {
      task.status = 'failed';
      task.error = 'Upload batch not found';
      this.notify();
      return;
    }

    // Find the original File object from the batch list
    // Note: Since File objects are not easily stored in reactive state,
    // we query them from a temporary registry or handle it dynamically.
    // To make it easy, we store the files in an active map.
    const file = activeFilesRegistry.get(task.id);
    if (!file) {
      task.status = 'failed';
      task.error = 'File data missing in registry';
      this.notify();
      this.handleTaskCompleted(task, false);
      return;
    }

    try {
      // 1. Initialize upload via backend API (determines path/version and returns signed upload URL)
      const initRes = await fetch('/api/files/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: task.dealId,
          deliverableId: task.deliverableId,
          fileName: task.fileName,
          fileSize: task.fileSize,
          isPreview: false,
        }),
      });

      if (!initRes.ok) {
        const initErr = await initRes.json();
        throw new Error(initErr.error || 'Failed to initialize upload');
      }

      const { signedUrl, filePath, versionNum, provider, uploadSessionId } = await initRes.json();

      // 2. Upload main file with progress tracking
      // For Google Drive resumable uploads, uploadToSignedUrl will parse and return the created file's metadata
      const uploadResult = await this.uploadToSignedUrl(signedUrl, file, (progressPercent, uploadedBytes) => {
        task.bytesUploaded = uploadedBytes;
        task.percentage = progressPercent;
        this.notify();
      }, uploadSessionId);
      
      const externalId = (provider === 'google_drive' && uploadResult && typeof uploadResult === 'object') 
        ? uploadResult.id 
        : undefined;

      // 3. Handle preview generation if applicable
      let previewPath = undefined;
      let previewType = undefined;
      let previewStatus = undefined;
      let previewGeneratedAt = undefined;
      let previewProvider = undefined;

      const ext = task.fileName.split('.').pop()?.toLowerCase() || '';
      const isVideo = (task.fileType || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);

      if (batch.manualPreviewFile) {
        try {
          const initPrevRes = await fetch('/api/files/upload/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealId: task.dealId,
              deliverableId: task.deliverableId,
              fileName: `preview-${batch.manualPreviewFile.name}`,
              fileSize: batch.manualPreviewFile.size,
              isPreview: true,
            }),
          });

          if (initPrevRes.ok) {
            const { signedUrl: prevSignedUrl, filePath: prevFilePath, uploadSessionId: prevSessionId, provider: prevProv } = await initPrevRes.json();
            const uploadSuccess = await this.uploadToSignedUrl(prevSignedUrl, batch.manualPreviewFile, undefined, prevSessionId);
            if (uploadSuccess) {
              previewPath = prevFilePath;
              previewType = batch.manualPreviewFile.type;
              previewStatus = 'ready';
              previewProvider = prevProv || 'supabase';
              previewGeneratedAt = new Date().toISOString();
            }
          }
        } catch (prevErr) {
          console.error('Manual preview upload failed:', prevErr);
          previewStatus = 'failed';
        }
      } else if (batch.previewEnabled && isVideo) {
        previewStatus = 'processing';
        previewType = 'video/mp4';
      } else if (batch.previewEnabled) {
        try {
          const previewBlob = await generateClientPreview(file);
          if (previewBlob) {
            const originalExt = task.fileName.split('.').pop()?.toLowerCase();
            let previewExt = originalExt || 'jpg';
            if (previewBlob.type === 'image/jpeg' && originalExt !== 'jpg' && originalExt !== 'jpeg') {
              previewExt = 'jpg';
            }
            const originalBaseName = task.fileName.substring(0, task.fileName.lastIndexOf('.')) || task.fileName;
            const previewName = `preview-${originalBaseName}.${previewExt}`;

            // Initialize signed url for preview
            const initPrevRes = await fetch('/api/files/upload/init', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dealId: task.dealId,
                deliverableId: task.deliverableId,
                fileName: previewName,
                fileSize: previewBlob.size,
                isPreview: true,
              }),
            });

            if (initPrevRes.ok) {
              const { signedUrl: prevSignedUrl, filePath: prevFilePath, uploadSessionId: prevSessionId, provider: prevProv } = await initPrevRes.json();
              const uploadSuccess = await this.uploadToSignedUrl(prevSignedUrl, previewBlob, undefined, prevSessionId);
              if (uploadSuccess) {
                previewPath = prevFilePath;
                previewType = previewBlob.type;
                previewStatus = 'ready';
                previewProvider = prevProv || 'supabase';
                previewGeneratedAt = new Date().toISOString();
              }
            }
          }
        } catch (prevErr) {
          console.error('Client-side preview generation failed:', prevErr);
          previewStatus = 'failed';
        }
      }

      if (batch.previewEnabled && !isVideo && previewStatus !== 'ready' && previewStatus !== 'failed') {
        previewStatus = 'unavailable';
      }

      // Update the task's previewStatus so UI can reflect it post-upload
      task.previewStatus = previewStatus as any;

      // Add to batch completed items
      const fileItem = {
        id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: task.fileName,
        size: task.fileSize,
        type: task.fileType,
        path: filePath,
        externalId,
        uploadSessionId,
        previewPath,
        previewType,
        previewStatus,
        previewProvider,
        previewGeneratedAt,
      };

      batch.uploadedItems.push(fileItem);
      task.status = 'completed';
      task.percentage = 100;
      this.notify();

      this.handleTaskCompleted(task, true);
    } catch (err: any) {
      console.error(`Upload error for ${task.fileName}:`, err);
      task.status = 'failed';
      task.error = err.message || 'Upload failed';
      this.notify();
      this.handleTaskCompleted(task, false);
    } finally {
      activeFilesRegistry.delete(task.id);
    }
  }

  private uploadToSignedUrl(
    signedUrl: string,
    data: Blob | File,
    onProgress?: (percent: number, loaded: number) => void,
    uploadSessionId?: string
  ): Promise<any> {
    // If uploadSessionId is provided or the signed URL is a Google Drive URL, use Google Drive resumable upload
    const isGoogleDrive = signedUrl.includes('googleapis.com/upload/drive') || !!uploadSessionId && signedUrl.startsWith('google_drive://');

    if (isGoogleDrive || (uploadSessionId && signedUrl.includes('googleapis.com'))) {
      return this.uploadToGoogleDriveResumable(signedUrl, data, onProgress, uploadSessionId);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl, true);
      xhr.setRequestHeader('Content-Type', data.type || 'application/octet-stream');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent, e.loaded);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch {
            resolve(true);
          }
        } else {
          reject(new Error(`Signed URL upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during signed URL upload'));
      };

      xhr.send(data);
    });
  }

  private async uploadToGoogleDriveResumable(
    sessionUri: string,
    data: Blob | File,
    onProgress?: (percent: number, loaded: number) => void,
    uploadSessionId?: string
  ): Promise<any> {
    const totalSize = data.size;
    let offset = 0;
    // Chunk size: 8 MiB (8,388,608 bytes = 32 * 256 KiB, satisfying Google Drive 256 KiB multiple constraint)
    const chunkSize = 8 * 1024 * 1024;
    let retries = 3;

    while (offset < totalSize) {
      const end = Math.min(offset + chunkSize, totalSize);
      const chunk = data.slice(offset, end);
      const chunkByteLength = chunk.size;
      const contentRange = `bytes ${offset}-${offset + chunkByteLength - 1}/${totalSize}`;

      console.log('[GOOGLE_UPLOAD_CHUNK]', {
        uploadSessionId,
        range: contentRange,
        contentLength: chunkByteLength,
      });

      try {
        const response = await new Promise<{
          status: number;
          body: string;
          rangeHeader: string | null;
          statusText: string;
        }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Proxy chunk through /api/files/upload/chunk to prevent CORS issues in browser
          const targetUrl = uploadSessionId
            ? '/api/files/upload/chunk'
            : sessionUri;

          xhr.open('PUT', targetUrl, true);
          xhr.setRequestHeader('Content-Type', data.type || 'application/octet-stream');
          xhr.setRequestHeader('Content-Range', contentRange);
          if (uploadSessionId) {
            xhr.setRequestHeader('x-upload-session-id', uploadSessionId);
          }
          xhr.timeout = 45000; // 45s timeout per chunk

          if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const loaded = offset + e.loaded;
                const percent = Math.round((loaded / totalSize) * 100);
                onProgress(percent, loaded);
              }
            };
          }

          xhr.onload = () => {
            resolve({
              status: xhr.status,
              body: xhr.responseText,
              rangeHeader: xhr.getResponseHeader('Range'),
              statusText: xhr.statusText,
            });
          };

          xhr.onerror = () => {
            if (xhr.status === 0) {
              reject(new Error('Network connection interrupted during upload.'));
            } else {
              reject(new Error(`Upload chunk failed with HTTP status ${xhr.status}: ${xhr.statusText}`));
            }
          };

          xhr.ontimeout = () => reject(new Error('Timeout error during Google Drive upload chunk'));
          xhr.onabort = () => reject(new Error('Upload aborted by user'));
          xhr.send(chunk);
        });

        console.log('[GOOGLE_UPLOAD_CHUNK_RESPONSE]', {
          status: response.status,
          rangeHeader: response.rangeHeader,
        });

        if (response.status === 200 || response.status === 201) {
          console.log('[GOOGLE_UPLOAD_COMPLETE]', { uploadSessionId });
          try {
            return JSON.parse(response.body);
          } catch {
            return true;
          }
        } else if (response.status === 308) {
          if (response.rangeHeader) {
            const match = response.rangeHeader.match(/bytes=0-(\d+)/);
            if (match) {
              offset = parseInt(match[1], 10) + 1;
              retries = 3;
              continue;
            }
          }
          offset = end;
          retries = 3;
          continue;
        } else if (response.status === 404) {
          throw new Error('Google Drive upload session expired. Please retry the upload.');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Google Drive authorization is no longer valid. Reconnect Google Drive.');
        } else if (response.status === 429) {
          if (retries > 0) {
            retries--;
            const backoff = 1000 * (4 - retries);
            console.warn(`Google Drive rate limit (429), retrying in ${backoff}ms (${retries} retries left)`);
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
          throw new Error('Google Drive rate limit exceeded. Please try again later.');
        } else if (response.status >= 500) {
          if (retries > 0) {
            retries--;
            const backoff = 1000 * (4 - retries);
            console.warn(`Google Drive server error ${response.status}, retrying in ${backoff}ms (${retries} retries left)`);
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
          throw new Error(`Google Drive is temporarily unavailable (${response.status}). Please retry.`);
        } else {
          throw new Error(`Google Drive rejected the upload (HTTP ${response.status}).`);
        }
      } catch (err: any) {
        const isNetworkErr = err.message.includes('Network connection interrupted') ||
                             err.message.includes('Timeout') ||
                             err.message.includes('Upload chunk failed');
        if (retries > 0 && isNetworkErr) {
          retries--;
          const backoff = 1000 * (4 - retries);
          console.warn(`Google Drive chunk error (${err.message}), retrying in ${backoff}ms (${retries} retries left)`);
          await new Promise(r => setTimeout(r, backoff));
        } else {
          console.error('[GOOGLE_UPLOAD_ERROR]', { message: err.message, stack: err.stack });
          throw err;
        }
      }
    }
    throw new Error('Google Drive upload incomplete.');
  }

  private async handleTaskCompleted(task: UploadTask, success: boolean) {
    const batch = this.batches.get(task.batchId);
    if (!batch) return;

    if (success) {
      batch.completedFiles++;
    } else {
      batch.failedFiles++;
    }

    const totalFinished = batch.completedFiles + batch.failedFiles;
    if (totalFinished === batch.totalFiles) {
      // All files in this batch finished uploading!
      if (batch.completedFiles > 0) {
        // Register the completed files metadata list in the DB
        try {
          const registerRes = await fetch('/api/files/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealId: batch.dealId,
              deliverableId: batch.deliverableId,
              description: batch.description,
              files: batch.uploadedItems,
            }),
          });

          if (!registerRes.ok) {
            const regErr = await registerRes.json();
            throw new Error(regErr.error || 'Failed to register files metadata');
          }

          // Trigger a global refresh of files in UI if there's a refresh handler
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('delt-files-uploaded', { detail: { dealId: batch.dealId } }));
          }
        } catch (regErr) {
          console.error('Error registering upload metadata:', regErr);
          // Mark related tasks failed
          batch.tasks.forEach((t) => {
            if (t.status === 'completed') {
              t.status = 'failed';
              t.error = 'Registration failed';
            }
          });
          this.notify();
        }
      }
      this.batches.delete(batch.id);
    }
    
    // Auto-remove successful tasks if they don't need preview processing
    if (success && task.previewStatus !== 'processing' && task.previewStatus !== 'waiting') {
      setTimeout(() => {
        this.removeTask(task.id);
      }, 2000);
    }
  }

  public updateTaskPreviewStatusByFileName(fileName: string, status: 'ready' | 'failed' | 'unavailable') {
    let updated = false;
    for (const task of this.tasks) {
      if (task.fileName === fileName && task.previewStatus !== status) {
        task.previewStatus = status as any;
        updated = true;
        
        if (status === 'ready' || status === 'failed' || status === 'unavailable') {
          setTimeout(() => {
            this.removeTask(task.id);
          }, 2000);
        }
      }
    }
    if (updated) {
      this.notify();
    }
  }
}

// Global files registry to reference original File payloads across async loops
export const activeFilesRegistry = new Map<string, File>();

export const uploadQueue = new UploadQueueManager();

// Shared client-side image & pdf preview generator
async function generateClientPreview(file: File): Promise<Blob | null> {
  const fileType = file.type || '';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  const isPdf = fileType === 'application/pdf' || ext === 'pdf';

  if (isImage) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          ctx.save();

          const fontSize = Math.max(32, Math.round(Math.min(width, height) * 0.045));
          ctx.strokeStyle = 'rgba(70, 70, 70, 0.35)';
          ctx.lineWidth = 2;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const text = 'DELT PREVIEW';
          const textWidth = ctx.measureText(text).width;
          const stepX = textWidth + 35;
          const stepY = fontSize + 45;

          ctx.rotate((-30 * Math.PI) / 180);

          for (let y = -height * 2; y < height * 2.5; y += stepY) {
            const xOffset = (Math.round(y / stepY) % 2 === 0) ? 0 : stepX / 2;
            for (let x = -width * 2 - xOffset; x < width * 2.5; x += stepX) {
              ctx.strokeText(text, x + xOffset, y);
            }
          }
          ctx.restore();

          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.6);
        };
        img.onerror = () => resolve(null);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  if (isPdf) {
    try {
      const PDFLib = await loadPdfLib();
      if (!PDFLib) return null;

      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await (PDFLib as any).PDFDocument.load(fileBytes);
      const font = await pdfDoc.embedFont((PDFLib as any).StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const pagesToKeep = pages.slice(0, 5);

      const previewDoc = await (PDFLib as any).PDFDocument.create();
      const copiedPages = await previewDoc.copyPages(pdfDoc, pagesToKeep.map((_: any, i: number) => i));

      for (const page of copiedPages) {
        previewDoc.addPage(page);
        const { width, height } = page.getSize();

        const text = 'DELT PREVIEW';
        const fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.045));
        const stepX = (fontSize * 8) + 35;
        const stepY = fontSize + 45;
        const rotationAngle = 30;

        page.pushOperators(
          (PDFLib as any).pushGraphicsState(),
          (PDFLib as any).setStrokingColor((PDFLib as any).rgb(0.27, 0.27, 0.27)),
          (PDFLib as any).setLineWidth(2),
          (PDFLib as any).setTextRenderingMode((PDFLib as any).TextRenderingMode.Outline)
        );

        for (let y = -100; y < height + 200; y += stepY) {
          const xOffset = (Math.round(y / stepY) % 2 === 0) ? 0 : stepX / 2;
          for (let x = -100 - xOffset; x < width + 200; x += stepX) {
            page.drawText(text, {
              x: x + xOffset,
              y: y,
              size: fontSize,
              font: font,
              opacity: 0.35,
              rotate: (PDFLib as any).degrees(rotationAngle),
            });
          }
        }

        page.pushOperators((PDFLib as any).popGraphicsState());
      }

      const previewBytes = await previewDoc.save();
      return new Blob([previewBytes], { type: 'application/pdf' });
    } catch (err) {
      console.error('Error generating PDF preview client-side:', err);
      return null;
    }
  }

  return null;
}

const loadPdfLib = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve(null);
    if ((window as any).PDFLib) return resolve((window as any).PDFLib);
    const script = document.createElement('script');
    script.src = '/lib/pdf-lib.min.js';
    script.onload = () => resolve((window as any).PDFLib);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};
