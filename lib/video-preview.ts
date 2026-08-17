import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createAdminClient } from '@/lib/supabase/admin';

const execPromise = promisify(exec);

/**
 * Checks if a real FFmpeg-capable runtime is available.
 */
export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await execPromise('ffmpeg -version');
    await execPromise('ffprobe -version');
    return true;
  } catch (error) {
    console.warn('[VIDEO_PREVIEW] FFmpeg check failed. Video processing is unavailable in this environment.');
    return false;
  }
}

/**
 * Scans the filesystem for a standard sans-serif TrueType font.
 */
function getFontPath(): string | null {
  const winFont = 'C:\\Windows\\Fonts\\arial.ttf';
  if (fs.existsSync(winFont)) {
    return winFont;
  }
  const linuxFonts = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
  ];
  for (const f of linuxFonts) {
    if (fs.existsSync(f)) {
      return f;
    }
  }
  return null;
}

/**
 * Formats the font parameter for FFmpeg drawtext filter, copying it locally to avoid escaping colons/slashes on Windows.
 */
function getEscapedFontFileParam(): string {
  const fontPath = getFontPath();
  if (!fontPath) return '';

  const localFontName = 'delt_temp_font.ttf';
  const localFontPath = path.join(process.cwd(), localFontName);

  if (!fs.existsSync(localFontPath) && fs.existsSync(fontPath)) {
    try {
      fs.copyFileSync(fontPath, localFontPath);
      console.log(`[VIDEO_PREVIEW] Copied system font to local path: ${localFontPath}`);
    } catch (err) {
      console.warn('[VIDEO_PREVIEW] Failed to copy font file to local directory:', err);
    }
  }

  if (fs.existsSync(localFontPath)) {
    // Return relative path to local file (escaped properly for FFmpeg)
    return `:fontfile='${localFontName}'`;
  }
  return '';
}

/**
 * Creates the staggered tiled grid of hollow (outlined) watermarks.
 */
function getWatermarkFilter(): string {
  const text = 'DELT PREVIEW';
  const fontSize = 18;
  const stepX = 220;
  const stepY = 120;
  const fontParam = getEscapedFontFileParam();

  const drawtextFilters: string[] = [];
  // Staggered grid covering a 480p frame (height=480, standard width up to 854)
  for (let y = 30; y < 480; y += stepY) {
    const isEven = Math.round(y / stepY) % 2 === 0;
    const xOffset = isEven ? 0 : Math.round(stepX / 2);
    for (let x = 30; x < 854; x += stepX) {
      // Escape text for FFmpeg drawtext parameters
      const escapedText = text.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\\\:');
      drawtextFilters.push(
        `drawtext=text='${escapedText}':fontcolor=0x464646@0.0:borderw=1.5:bordercolor=0x464646@0.35:fontsize=${fontSize}${fontParam}:x=${x + xOffset}:y=${y}`
      );
    }
  }
  return drawtextFilters.join(',');
}

/**
 * Main video preview generation task.
 * Runs asynchronously in the background.
 */
export async function generateVideoPreview(dealId: string, fileVersionId: string, fileId: string): Promise<void> {
  const admin = createAdminClient();
  let tempOutPath: string | null = null;

  try {
    console.log(`[VIDEO_PREVIEW] Starting generation for deal=${dealId}, version=${fileVersionId}, file=${fileId}`);

    // 1. Fetch file version record
    const { data: versionRecord, error: fetchErr } = await admin
      .from('file_versions')
      .select('*')
      .eq('id', fileVersionId)
      .eq('deal_id', dealId)
      .maybeSingle();

    if (fetchErr || !versionRecord) {
      throw new Error(`File version ${fileVersionId} not found: ${fetchErr?.message}`);
    }

    const files = Array.isArray(versionRecord.files) ? versionRecord.files : [];
    const fileIndex = files.findIndex((f: any) => f.id === fileId);
    if (fileIndex === -1) {
      throw new Error(`File ${fileId} not found in version ${fileVersionId}`);
    }

    const fileItem = files[fileIndex];

    // Ensure we don't duplicate generation if already ready
    if (fileItem.previewStatus === 'ready' && fileItem.previewPath) {
      console.log(`[VIDEO_PREVIEW] Preview already exists for file=${fileId}. Skipping.`);
      return;
    }

    // 2. Mark status as processing in DB (to render processing UI state)
    const filesWithProcessing = [...files];
    filesWithProcessing[fileIndex] = {
      ...fileItem,
      previewStatus: 'processing',
    };

    await admin
      .from('file_versions')
      .update({ files: filesWithProcessing })
      .eq('id', fileVersionId);

    // Check if external video processor URL is configured
    const processorUrl = process.env.VIDEO_PROCESSOR_URL;
    if (processorUrl) {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[VIDEO_PROCESSOR] Forwarding request. requestId=${requestId} dealId=${dealId} fileId=${fileId} processorUrl=${processorUrl}`);
      const secret = process.env.VIDEO_PROCESSOR_SECRET;

      try {
        const response = await fetch(`${processorUrl.replace(/\/$/, '')}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(secret ? { 'Authorization': `Bearer ${secret}` } : {})
          },
          body: JSON.stringify({
            dealId,
            fileVersionId,
            fileId
          })
        });

        console.log(`[VIDEO_PROCESSOR] Response received. requestId=${requestId} dealId=${dealId} fileId=${fileId} status=${response.status} success=${response.ok}`);
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`[VIDEO_PROCESSOR] Render processor returned error status ${response.status}: ${errText}`);
        }

        console.log(`[VIDEO_PROCESSOR] Successfully delegated preview generation. requestId=${requestId} dealId=${dealId} fileId=${fileId} processorUrl=${processorUrl} success=true`);
        return;
      } catch (err: any) {
        console.error(`[VIDEO_PROCESSOR] Failed to call Render processor. requestId=${requestId} dealId=${dealId} fileId=${fileId} error=`, err);
        // Do NOT fall back to local FFmpeg in production - propagate error to trigger failed status directly
        throw err;
      }
    }

    // 3. Verify FFmpeg availability
    const ffmpegReady = await isFfmpegAvailable();
    if (!ffmpegReady) {
      throw new Error(
        'FFmpeg binaries (ffmpeg/ffprobe) not found in system PATH. ' +
        'DELT requires an environment with an FFmpeg-capable runtime to generate video previews. ' +
        'Gracefully marking preview status as failed.'
      );
    }

    // 4. Generate secure signed URL to download original file
    const { data: signedUrlData, error: signError } = await admin.storage
      .from('deal-files')
      .createSignedUrl(fileItem.path, 120); // 2 minutes expiry for processing

    if (signError || !signedUrlData?.signedUrl) {
      throw new Error(`Failed to generate signed url for original video: ${signError?.message}`);
    }

    const signedUrl = signedUrlData.signedUrl;

    // 5. Detect video duration using ffprobe
    console.log('[VIDEO_PREVIEW] Querying video duration with ffprobe...');
    const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${signedUrl}"`;
    const { stdout: ffprobeStdout } = await execPromise(ffprobeCmd);
    const duration = parseFloat(ffprobeStdout.trim());
    
    if (isNaN(duration) || duration <= 0) {
      throw new Error(`Failed to determine valid video duration: ${ffprobeStdout}`);
    }

    console.log(`[VIDEO_PREVIEW] Original video duration detected: ${duration}s`);
    console.log(`[VIDEO_PROCESSOR] Local processing status. dealId=${dealId} fileId=${fileId} duration=${duration}s success=true`);

    // 6. Determine preview segment rules
    let previewStart = 0;
    let previewDuration = duration;

    if (duration > 15) {
      // Pick random duration between 15 and min(20, duration)
      const maxDuration = Math.min(20, duration);
      previewDuration = 15 + Math.random() * (maxDuration - 15);
      // Pick random start position within valid bounds
      previewStart = Math.random() * (duration - previewDuration);
      
      // Round to 2 decimal places
      previewDuration = Math.round(previewDuration * 100) / 100;
      previewStart = Math.round(previewStart * 100) / 100;
    }

    console.log(`[VIDEO_PREVIEW] Selected rules: start=${previewStart}s, duration=${previewDuration}s`);

    // 7. Process preview using ffmpeg
    const tempDir = os.tmpdir();
    tempOutPath = path.join(tempDir, `preview_${dealId}_${fileId}_${Date.now()}.mp4`);
    
    // Build filtergraph
    const watermarkFilter = getWatermarkFilter();
    const filterGraph = `scale=-2:480,${watermarkFilter}`;

    // FFmpeg command to stream the segment, resize, Cap bitrate, apply outlined watermark, output H.264
    console.log('[VIDEO_PREVIEW] Executing FFmpeg processing...');
    const ffmpegCmd = `ffmpeg -y -ss ${previewStart} -t ${previewDuration} -i "${signedUrl}" -vf "${filterGraph}" -b:v 500k -maxrate 750k -bufsize 1000k -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 96k -map 0:v:0 -map 0:a? "${tempOutPath}"`;
    
    await execPromise(ffmpegCmd);

    if (!fs.existsSync(tempOutPath)) {
      throw new Error('FFmpeg completed execution but output preview file was not created.');
    }

    const previewStats = fs.statSync(tempOutPath);
    console.log(`[VIDEO_PREVIEW] Output preview file size: ${previewStats.size} bytes`);

    // 8. Upload preview to Supabase storage
    const versionNum = versionRecord.version || 1;
    const cleanPreviewName = fileItem.name.replace(/\.[^.]+$/, '_preview.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
    const previewPath = `previews/${dealId}/v${versionNum}/${Date.now()}_${cleanPreviewName}`;

    const previewBuffer = fs.readFileSync(tempOutPath);

    console.log(`[VIDEO_PREVIEW] Uploading preview copy to deal-files storage path=${previewPath}...`);
    const { error: uploadError } = await admin.storage
      .from('deal-files')
      .upload(previewPath, previewBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload preview to storage: ${uploadError.message}`);
    }

    // 9. Update file_version files metadata with successful state
    const filesWithReady = [...files];
    filesWithReady[fileIndex] = {
      ...fileItem,
      previewPath,
      previewType: 'video/mp4',
      previewStatus: 'ready',
      previewGeneratedAt: new Date().toISOString(),
      previewStart,
      previewDuration,
    };

    const { error: updateError } = await admin
      .from('file_versions')
      .update({ files: filesWithReady })
      .eq('id', fileVersionId);

    if (updateError) {
      throw new Error(`Failed to update DB metadata to ready: ${updateError.message}`);
    }

    console.log(`[VIDEO_PREVIEW] Generation complete and saved successfully for file=${fileId}!`);
    console.log(`[VIDEO_PROCESSOR] Local processing complete. dealId=${dealId} fileId=${fileId} success=true`);

  } catch (error: any) {
    console.error(`[VIDEO_PREVIEW] Error occurred:`, error);

    // Update status to failed in case of exceptions
    try {
      const { data: currentVersion } = await admin
        .from('file_versions')
        .select('*')
        .eq('id', fileVersionId)
        .maybeSingle();

      if (currentVersion) {
        const curFiles = Array.isArray(currentVersion.files) ? currentVersion.files : [];
        const fIdx = curFiles.findIndex((f: any) => f.id === fileId);
        if (fIdx !== -1) {
          const updatedFiles = [...curFiles];
          updatedFiles[fIdx] = {
            ...updatedFiles[fIdx],
            previewStatus: 'failed',
            previewGeneratedAt: new Date().toISOString(),
          };
          await admin
            .from('file_versions')
            .update({ files: updatedFiles })
            .eq('id', fileVersionId);
        }
      }
    } catch (dbErr) {
      console.error('[VIDEO_PREVIEW] Double fault: Failed to mark file status as failed in DB:', dbErr);
    }

  } finally {
    // Cleanup temporary file
    if (tempOutPath && fs.existsSync(tempOutPath)) {
      try {
        fs.unlinkSync(tempOutPath);
        console.log(`[VIDEO_PREVIEW] Cleaned up temp file: ${tempOutPath}`);
      } catch (cleanupErr) {
        console.error(`[VIDEO_PREVIEW] Failed to delete temp file ${tempOutPath}:`, cleanupErr);
      }
    }
  }
}
