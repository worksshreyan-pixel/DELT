import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createAdminClient } from '@/lib/supabase/admin';
import { computePreviewSegment } from './preview-rules';

const execPromise = promisify(exec);

/**
 * Checks if a real FFmpeg-capable runtime is available.
 */
export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    const { stdout: versionOut } = await execPromise('ffmpeg -version');
    console.log(`[VIDEO_PREVIEW_DIAGNOSTIC] FFmpeg is available:\n${versionOut.split('\n')[0]}`);
    try {
      const whichCmd = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
      const { stdout: whichOut } = await execPromise(whichCmd);
      console.log(`[VIDEO_PREVIEW_DIAGNOSTIC] FFmpeg binary location: ${whichOut.trim()}`);
    } catch (e) {
      console.warn(`[VIDEO_PREVIEW_DIAGNOSTIC] Could not locate FFmpeg binary path:`, e);
    }
    return true;
  } catch (error) {
    console.warn('[VIDEO_PREVIEW_DIAGNOSTIC] FFmpeg check failed. Video processing is unavailable in this environment.');
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
    return `:fontfile='${localFontName}'`;
  }
  return '';
}

/**
 * Sanitizes URLs or command outputs containing sensitive tokens.
 */
export function sanitizeString(str: string): string {
  if (!str) return str;
  return str.replace(/([?&]token=)[a-zA-Z0-9._-]+/g, '$1[REDACTED]');
}

/**
 * Creates the staggered tiled grid of hollow (outlined) watermarks.
 */
function getWatermarkFilter(isDark: boolean): string {
  const text = 'DELT PREVIEW';
  const fontSize = 18;
  const stepX = 220;
  const stepY = 120;

  const fontPath = getFontPath();
  const localFontName = 'delt_temp_font.ttf';
  const localFontPath = path.join(process.cwd(), localFontName);

  if (fontPath && !fs.existsSync(localFontPath) && fs.existsSync(fontPath)) {
    try {
      fs.copyFileSync(fontPath, localFontPath);
      console.log(`[VIDEO_PREVIEW] Copied system font to local path: ${localFontPath}`);
    } catch (err) {
      console.warn('[VIDEO_PREVIEW] Failed to copy font file to local directory:', err);
    }
  }

  const hasLocalFont = fs.existsSync(localFontPath);
  const drawtextFilters: string[] = [];

  const fontColor = isDark ? '0xFFFFFF@0.0' : '0x464646@0.0';
  const borderColor = isDark ? '0xDDDDDD@0.35' : '0x464646@0.35';

  for (let y = 30; y < 480; y += stepY) {
    const isEven = Math.round(y / stepY) % 2 === 0;
    const xOffset = isEven ? 0 : Math.round(stepX / 2);
    for (let x = 30; x < 854; x += stepX) {
      const escapedText = text.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\\\:');
      
      const drawtextParams = [
        `text='${escapedText}'`,
        `fontcolor=${fontColor}`,
        'borderw=1.5',
        `bordercolor=${borderColor}`,
        `fontsize=${fontSize}`
      ];

      if (hasLocalFont) {
        drawtextParams.push(`fontfile='${localFontName}'`);
      }

      drawtextParams.push(`x=${x + xOffset}`, `y=${y}`);
      drawtextFilters.push(`drawtext=${drawtextParams.join(':')}`);
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
  const startTime = Date.now();

  try {
    console.log(`[VIDEO_PREVIEW_START] dealId=${dealId} fileId=${fileId} fileVersionId=${fileVersionId}`);

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

    if (fileItem.previewStatus === 'ready' && fileItem.previewPath) {
      console.log(`[VIDEO_PREVIEW] Preview already exists for file=${fileId}. Skipping.`);
      return;
    }

    const filesWithProcessing = [...files];
    filesWithProcessing[fileIndex] = {
      ...fileItem,
      previewStatus: 'processing',
    };

    await admin
      .from('file_versions')
      .update({ files: filesWithProcessing })
      .eq('id', fileVersionId);

    const processorUrl = process.env.VIDEO_PROCESSOR_URL;
    const secret = process.env.VIDEO_PROCESSOR_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    console.log(`[VIDEO_PROCESSOR_CONFIG] environment=${isProduction ? 'production' : 'development'} processorUrl_configured=${!!processorUrl} secret_configured=${!!secret}`);

    if (processorUrl) {
      if (!secret) {
        console.error(`[VIDEO_PROCESSOR] Configuration error: VIDEO_PROCESSOR_SECRET is missing. Cannot delegate request securely.`);
        throw new Error('[VIDEO_PROCESSOR] Configuration error: VIDEO_PROCESSOR_SECRET is missing.');
      }

      console.log(`[VIDEO_PROCESSOR] Using external processor. url=${sanitizeString(processorUrl)}`);

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[VIDEO_PROCESSOR] Forwarding request. requestId=${requestId} dealId=${dealId} fileId=${fileId} processorUrl=${sanitizeString(processorUrl)}`);

      try {
        const response = await fetch(`${processorUrl.replace(/\/$/, '')}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secret}`
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

        console.log(`[VIDEO_PROCESSOR] Successfully delegated preview generation. requestId=${requestId} dealId=${dealId} fileId=${fileId} processorUrl=${sanitizeString(processorUrl)} success=true`);
        return;
      } catch (err: any) {
        console.error(`[VIDEO_PROCESSOR] Failed to call Render processor. requestId=${requestId} dealId=${dealId} fileId=${fileId} error=`, sanitizeString(err.message || String(err)));
        throw err;
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.error(`[VIDEO_PROCESSOR] Configuration error: VIDEO_PROCESSOR_URL is missing in production.`);
        throw new Error('[VIDEO_PROCESSOR] Configuration error: VIDEO_PROCESSOR_URL is missing in production.');
      }
      console.log(`[VIDEO_PROCESSOR] configured=false. VIDEO_PROCESSOR_URL is not set. Falling back to local FFmpeg.`);
    }

    const ffmpegReady = await isFfmpegAvailable();
    if (!ffmpegReady) {
      throw new Error(
        'FFmpeg binaries (ffmpeg/ffprobe) not found in system PATH. ' +
        'DELT requires an environment with an FFmpeg-capable runtime to generate video previews. ' +
        'Gracefully marking preview status as failed.'
      );
    }

    console.log(`[VIDEO_DOWNLOAD_START] dealId=${dealId} fileId=${fileId} path=${fileItem.path}`);
    const { data: signedUrlData, error: signError } = await admin.storage
      .from('deal-files')
      .createSignedUrl(fileItem.path, 120);

    if (signError || !signedUrlData?.signedUrl) {
      throw new Error(`Failed to generate signed url for original video: ${signError?.message}`);
    }

    const signedUrl = signedUrlData.signedUrl;
    console.log(`[VIDEO_DOWNLOAD_COMPLETE] dealId=${dealId} fileId=${fileId} elapsed=${Date.now() - startTime}ms`);

    console.log('[VIDEO_PREVIEW] Querying video duration with ffprobe...');
    const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${signedUrl}"`;
    let duration = 0;
    try {
      const { stdout: ffprobeStdout } = await execPromise(ffprobeCmd);
      duration = parseFloat(ffprobeStdout.trim());
    } catch (ffprobeErr: any) {
      throw new Error(`ffprobe failed: ${sanitizeString(ffprobeErr.message || String(ffprobeErr))}`);
    }
    
    if (isNaN(duration) || duration <= 0) {
      throw new Error(`Failed to determine valid video duration.`);
    }

    console.log(`[VIDEO_PREVIEW] Original video duration detected: ${duration}s`);

    let previewStart = 0;
    let previewDuration = duration;

    // Apply preview duration and start-time logic using shared helper
    const { previewStart: computedStart, previewDuration: computedDuration } = computePreviewSegment(duration);
    previewStart = computedStart;
    previewDuration = computedDuration;

    console.log(`[VIDEO_PREVIEW] Selected rules: start=${previewStart}s, duration=${previewDuration}s`);

    // Dynamic contrast luminance analysis
    console.log('[VIDEO_PREVIEW] Detecting average video luminance...');
    let isDark = false;
    const middleTime = duration > 2 ? Math.floor(duration / 2) : 0;
    const tempPixelPath = path.join(os.tmpdir(), `pixel_${dealId}_${fileId}_${Date.now()}.raw`);
    const detectCmd = `ffmpeg -y -ss ${middleTime} -i "${signedUrl}" -map 0:v:0 -vf "scale=1:1" -f rawvideo -pix_fmt gray -frames:v 1 "${tempPixelPath}"`;
    try {
      await execPromise(detectCmd);
      if (fs.existsSync(tempPixelPath)) {
        const buffer = fs.readFileSync(tempPixelPath);
        if (buffer.length > 0) {
          const luminance = buffer[0];
          isDark = luminance < 127;
          console.log(`[VIDEO_PREVIEW_DIAGNOSTIC] Detected average video luminance byte: ${luminance} (isDark=${isDark})`);
        }
      }
    } catch (detectErr: any) {
      console.warn('[VIDEO_PREVIEW_DIAGNOSTIC] Video luminance detection failed, falling back to light background (dark watermark):', detectErr.message);
    } finally {
      if (fs.existsSync(tempPixelPath)) {
        try { fs.unlinkSync(tempPixelPath); } catch {}
      }
    }

    const tempDir = os.tmpdir();
    tempOutPath = path.join(tempDir, `preview_${dealId}_${fileId}_${Date.now()}.mp4`);
    
    const watermarkFilter = getWatermarkFilter(isDark);
    const filterGraph = `scale=-2:480,${watermarkFilter}`;

    console.log('[VIDEO_PREVIEW] Executing FFmpeg processing...');
    const ffmpegCmd = `ffmpeg -y -ss ${previewStart} -t ${previewDuration} -i "${signedUrl}" -vf "${filterGraph}" -b:v 500k -maxrate 750k -bufsize 1000k -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 96k -map 0:v:0 -map 0:a? "${tempOutPath}"`;
    
    console.log(`[VIDEO_FFMPEG_START] dealId=${dealId} fileId=${fileId} command=${sanitizeString(ffmpegCmd)}`);
    const ffmpegStartTime = Date.now();
    try {
      const { stdout, stderr } = await execPromise(ffmpegCmd);
      const elapsed = Date.now() - ffmpegStartTime;
      console.log(`[VIDEO_FFMPEG_EXIT] dealId=${dealId} fileId=${fileId} code=0 signal=null elapsed=${elapsed}ms`);
      console.log(`[VIDEO_FFMPEG_SUCCESS] dealId=${dealId} fileId=${fileId}`);
      if (stdout) console.log(`[VIDEO_FFMPEG_STDOUT] stdout:\n${sanitizeString(stdout)}`);
      if (stderr) console.log(`[VIDEO_FFMPEG_STDERR] stderr:\n${sanitizeString(stderr)}`);
    } catch (ffmpegErr: any) {
      const elapsed = Date.now() - ffmpegStartTime;
      const code = ffmpegErr.code !== undefined ? ffmpegErr.code : null;
      const signal = ffmpegErr.signal || null;
      console.log(`[VIDEO_FFMPEG_EXIT] dealId=${dealId} fileId=${fileId} code=${code} signal=${signal} elapsed=${elapsed}ms`);
      if (ffmpegErr.stdout) console.log(`[VIDEO_FFMPEG_STDOUT] stdout:\n${sanitizeString(ffmpegErr.stdout)}`);
      if (ffmpegErr.stderr) console.log(`[VIDEO_FFMPEG_STDERR] stderr:\n${sanitizeString(ffmpegErr.stderr)}`);
      throw new Error(`ffmpeg processing failed: code=${code} signal=${signal} error=${sanitizeString(ffmpegErr.message || String(ffmpegErr))}`);
    }

    if (!fs.existsSync(tempOutPath)) {
      throw new Error('FFmpeg completed execution but output preview file was not created.');
    }

    const previewStats = fs.statSync(tempOutPath);
    console.log(`[VIDEO_PREVIEW] Output preview file size: ${previewStats.size} bytes`);

    console.log(`[VIDEO_PREVIEW_UPLOAD] dealId=${dealId} fileId=${fileId} size=${previewStats.size} bytes`);
    const versionNum = versionRecord.version || 1;
    const cleanPreviewName = fileItem.name.replace(/\.[^.]+$/, '_preview.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
    const previewPath = `previews/${dealId}/v${versionNum}/${Date.now()}_${cleanPreviewName}`;

    const previewBuffer = fs.readFileSync(tempOutPath);

    const { error: uploadError } = await admin.storage
      .from('deal-files')
      .upload(previewPath, previewBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload preview to storage: ${uploadError.message}`);
    }

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

    console.log(`[VIDEO_PREVIEW_COMPLETE] dealId=${dealId} fileId=${fileId} path=${previewPath} elapsed=${Date.now() - startTime}ms`);

  } catch (error: any) {
    const errorMsg = sanitizeString(error.message || String(error));
    console.error(`[VIDEO_PREVIEW_ERROR] dealId=${dealId} fileId=${fileId} error=${errorMsg}`);

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
