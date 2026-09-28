// ============================================================================
// DELT — Authoritative Preview & Deliverable Review Gating Logic
// ============================================================================

export type EffectivePreviewState =
  | 'NO_PREVIEW'
  | 'DIRECT_PREVIEW_AVAILABLE'
  | 'GENERATED_PREVIEW_AVAILABLE'
  | 'MANUAL_PREVIEW_AVAILABLE'
  | 'EXTERNAL_PREVIEW_AVAILABLE';

export interface PreviewStateCheckInput {
  previewEnabled: boolean;
  previewMode?: 'AUTO' | 'MANUAL' | 'EXTERNAL' | 'NONE' | 'OPEN_ORIGINAL' | string;
  storageProvider?: string;
  files?: Array<{
    id?: string;
    path?: string;
    externalId?: string;
    previewPath?: string;
    previewType?: string;
    previewStatus?: string;
    previewProvider?: string;
    previewExternalId?: string;
    deletionStatus?: string;
    [key: string]: any;
  }>;
}

/**
 * Determines the authoritative effective preview state for a deliverable version.
 */
export function getEffectivePreviewState(input: PreviewStateCheckInput): EffectivePreviewState {
  if (!input.previewEnabled) {
    return 'NO_PREVIEW';
  }

  const mode = input.previewMode || (input.storageProvider === 'google_drive' ? 'EXTERNAL' : 'AUTO');
  const files = (input.files || []).filter((f) => f.deletionStatus !== 'deleted');

  if (files.length === 0) {
    return 'NO_PREVIEW';
  }

  if (mode === 'NONE') {
    return 'NO_PREVIEW';
  }

  if (mode === 'OPEN_ORIGINAL') {
    const hasOriginal = files.some((f) => Boolean(f.path || f.externalId || f.url));
    return hasOriginal ? 'DIRECT_PREVIEW_AVAILABLE' : 'NO_PREVIEW';
  }

  if (mode === 'AUTO') {
    const hasReadyAuto = files.some((f) => f.previewStatus === 'ready' && Boolean(f.previewPath || f.previewUrl));
    return hasReadyAuto ? 'GENERATED_PREVIEW_AVAILABLE' : 'NO_PREVIEW';
  }

  if (mode === 'MANUAL') {
    const hasReadyManual = files.some((f) => f.previewStatus === 'ready' && Boolean(f.previewPath || f.previewUrl));
    return hasReadyManual ? 'MANUAL_PREVIEW_AVAILABLE' : 'NO_PREVIEW';
  }

  if (mode === 'EXTERNAL') {
    const hasReadyExternal = files.some(
      (f) =>
        (f.previewStatus === 'ready' || !f.previewStatus) &&
        Boolean(f.previewExternalId || f.previewPath || f.externalId || f.url || f.previewProvider === 'google_drive')
    );
    return hasReadyExternal ? 'EXTERNAL_PREVIEW_AVAILABLE' : 'NO_PREVIEW';
  }

  // Fallback: check if any file has a ready preview
  const hasReady = files.some((f) => f.previewStatus === 'ready' && Boolean(f.previewPath || f.previewExternalId));
  if (hasReady) return 'GENERATED_PREVIEW_AVAILABLE';

  return 'NO_PREVIEW';
}

/**
 * Returns true iff the deliverable version has an actually usable preview.
 * Used to gate client-side deliverable review actions (Approve / Request Changes).
 */
export function isUsablePreviewAvailable(input: PreviewStateCheckInput): boolean {
  return getEffectivePreviewState(input) !== 'NO_PREVIEW';
}
