// lib/preview-rules.js
// Shared helper for video preview segment calculation. Dependency‑free JavaScript.

/**
 * Computes the preview start time and duration for a source video.
 *
 * Rules (as defined in the task):
 *   • If source video duration <= 10 seconds, preview uses the full video.
 *   • If source video duration > 10 seconds, preview duration is exactly 10 seconds
 *     and the start time is a random value in [0, duration - 10].
 *   • The start time is rounded to two decimal places.
 *
 * @param {number} duration - Total duration of the source video in seconds.
 * @returns {{ previewStart: number, previewDuration: number }}
 */
function computePreviewSegment(duration) {
  let previewStart = 0;
  let previewDuration = duration;
  if (duration <= 10) {
    previewDuration = duration;
    previewStart = 0;
  } else {
    previewDuration = 10;
    previewStart = Math.random() * (duration - 10);
    // Round to 2 decimal places as required.
    previewStart = Math.round(previewStart * 100) / 100;
  }
  return { previewStart, previewDuration };
}

module.exports = { computePreviewSegment };
