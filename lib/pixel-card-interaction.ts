// ==============================================================================
// DELT — PixelCard interaction model (pure, DOM-free, unit-testable)
//
// The single deterministic resolver behind <PixelCard /> transition mode.
// Every interaction path (hover, focus, click, touch, Enter/Space, external
// `active` prop) funnels through resolvePixelCardMode, so preview and sticky
// reveal are structurally incapable of racing: sticky reveal always wins,
// hover previews only when the pointer can hover, and any intent change
// simply re-resolves the one mode.
// ==============================================================================

/** The one observable interaction mode of the card. */
export type PixelCardInteractionMode = 'idle' | 'previewing' | 'revealed';

export interface PixelCardInteractionInput {
  /** Sticky revealed state (controlled by the parent via `active`). */
  active: boolean;
  /** Pointer is currently over the card. */
  hoverIntent: boolean;
  /** Card currently contains keyboard focus. */
  focusIntent: boolean;
  /** Pointer can hover AND is fine-grained — i.e. `(hover: hover) and (pointer: fine)`. */
  canHover: boolean;
}

/**
 * Resolve the card's interaction mode.
 *
 * Priority (fixed, deterministic):
 *   1. sticky reveal (`active`) — hover/focus never preview over it
 *   2. hover/focus preview — only when the pointer can hover
 *   3. idle (default face)
 *
 * `reducedMotion` intentionally does NOT change the mode: reduced motion only
 * changes HOW transitions are performed (instant swap instead of pixel sweep),
 * never WHICH face is shown.
 */
export function resolvePixelCardMode(input: PixelCardInteractionInput): PixelCardInteractionMode {
  if (input.active) return 'revealed';
  if ((input.hoverIntent || input.focusIntent) && input.canHover) return 'previewing';
  return 'idle';
}
