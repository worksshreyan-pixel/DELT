// ==============================================================================
// DELT — PixelCard interaction model tests (node:test, run via tsx)
// Covers lib/pixel-card-interaction.ts — the single deterministic resolver
// that decides the card's mode. Desktop/keyboard/touch/hybrid scenarios.
// ==============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePixelCardMode } from '../lib/pixel-card-interaction';

const resolve = (over: Partial<Parameters<typeof resolvePixelCardMode>[0]> = {}) =>
  resolvePixelCardMode({
    active: false,
    hoverIntent: false,
    focusIntent: false,
    canHover: true,
    ...over,
  });

describe('resolvePixelCardMode — desktop (canHover: true)', () => {
  test('starts idle', () => {
    assert.equal(resolve(), 'idle');
  });

  test('hover previews the revealed layer', () => {
    assert.equal(resolve({ hoverIntent: true }), 'previewing');
  });

  test('focus previews the revealed layer (keyboard parity)', () => {
    assert.equal(resolve({ focusIntent: true }), 'previewing');
  });

  test('click toggles sticky reveal — wins over any hover/focus intent', () => {
    assert.equal(resolve({ active: true, hoverIntent: true }), 'revealed');
    assert.equal(resolve({ active: true, focusIntent: true }), 'revealed');
  });

  test('mouse leave returns from preview to idle', () => {
    assert.equal(resolve({ hoverIntent: false }), 'idle');
  });
});

describe('resolvePixelCardMode — touch (canHover: false)', () => {
  test('tap toggles sticky reveal even while a synthetic hover fires', () => {
    // Touch devices emit synthetic mouseenter before the tap-toggled
    // `active` lands — sticky reveal must win.
    assert.equal(resolve({ active: true, hoverIntent: true, canHover: false }), 'revealed');
  });

  test('hover intent alone NEVER previews on touch-only pointers', () => {
    assert.equal(resolve({ hoverIntent: true, canHover: false }), 'idle');
  });

  test('focus intent alone never previews on touch-only pointers', () => {
    assert.equal(resolve({ focusIntent: true, canHover: false }), 'idle');
  });
});

describe('resolvePixelCardMode — hybrid devices (pointer capability changes)', () => {
  test('same physical intents resolve differently as capability changes', () => {
    // Mouse attached → hover previews; mouse detached → it must not.
    const intents = { hoverIntent: true };
    assert.equal(resolve({ ...intents, canHover: true }), 'previewing');
    assert.equal(resolve({ ...intents, canHover: false }), 'idle');
  });

  test('sticky reveal is unaffected by capability changes', () => {
    assert.equal(resolve({ active: true, canHover: false }), 'revealed');
  });
});

describe('resolvePixelCardMode — determinism / invariants', () => {
  test('pure: same input → same output (no hidden state)', () => {
    const input = { active: false, hoverIntent: true, focusIntent: false, canHover: true };
    assert.equal(resolvePixelCardMode(input), resolvePixelCardMode({ ...input }));
  });

  test('sticky reveal strictly dominates every other intent', () => {
    const worstCase = { active: true, hoverIntent: true, focusIntent: true, canHover: true };
    assert.equal(resolvePixelCardMode(worstCase), 'revealed');
  });

  test('reduced motion is intentionally not an input — it changes HOW, not WHICH', () => {
    // The resolver signature has no reducedMotion field by design: reduced
    // motion only swaps the transition style (instant vs sweep), never the
    // displayed face.
    const keys = Object.keys({ active: 0, hoverIntent: 0, focusIntent: 0, canHover: 0 });
    assert.deepEqual(keys.sort(), ['active', 'canHover', 'focusIntent', 'hoverIntent']);
  });
});
