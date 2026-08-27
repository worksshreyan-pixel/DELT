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
    previewEnabled: boolean
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
        previewStatus: previewEnabled ? 'waiting' : undefined,
      };
      return task;
    });

    const batch: UploadBatch = {
      id: batchId,
      dealId,
      deliverableId,
      description,
      previewEnabled,
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

    // Start working on the queue
    this.processQueue();
  }

  public removeTask(taskId: string) {
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
          fileName: task.fileName,
          fileSize: task.fileSize,
          isPreview: false,
        }),
      });

      if (!initRes.ok) {
        const initErr = await initRes.json();
        throw new Error(initErr.error || 'Failed to initialize upload');
      }

      const { signedUrl, filePath, versionNum } = await initRes.json();

      // 2. Upload main file directly to Supabase storage with progress tracking
      await this.uploadToSignedUrl(signedUrl, file, (progressPercent, uploadedBytes) => {
        task.bytesUploaded = uploadedBytes;
        task.percentage = progressPercent;
        this.notify();
      });

      // 3. Handle preview generation if applicable
      let previewPath = undefined;
      let previewType = undefined;
      let previewStatus = undefined;
      let previewGeneratedAt = undefined;

      const ext = task.fileName.split('.').pop()?.toLowerCase() || '';
      const isVideo = (task.fileType || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);

      if (batch.previewEnabled && isVideo) {
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
                fileName: previewName,
                fileSize: previewBlob.size,
                isPreview: true,
              }),
            });

            if (initPrevRes.ok) {
              const { signedUrl: prevSignedUrl, filePath: prevFilePath } = await initPrevRes.json();
              const uploadSuccess = await this.uploadToSignedUrl(prevSignedUrl, previewBlob);
              if (uploadSuccess) {
                previewPath = prevFilePath;
                previewType = previewBlob.type;
                previewStatus = 'ready';
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
        previewPath,
        previewType,
        previewStatus,
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
    onProgress?: (percent: number, loaded: number) => void
  ): Promise<boolean> {
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
          resolve(true);
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
  }

  public updateTaskPreviewStatusByFileName(fileName: string, status: 'ready' | 'failed' | 'unavailable') {
    let updated = false;
    for (const batch of Array.from(this.batches.values())) {
      for (const task of batch.tasks) {
        if (task.fileName === fileName && task.previewStatus !== status) {
          task.previewStatus = status as any;
          updated = true;
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
