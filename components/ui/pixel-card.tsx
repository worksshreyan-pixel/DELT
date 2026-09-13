'use client';

// ==============================================================================
// DELT — PixelCard (React Bits, JS+CSS variant; TSX port + DELT transition mode)
//
// Source: reactbits.dev — <PixelCard /> (vanilla JS + <canvas>, no dependency).
//
// Two usage modes:
//
// 1. ORIGINAL React Bits behavior (children only): a canvas pixel-shimmer
//    blooms across the card on hover/focus and fades on leave, with the CSS
//    radial glow. Children stay static.
//
// 2. DELT transition mode (firstContent + secondContent): the card holds two
//    layers and a click/tap TOGGLES the sticky revealed state — content stays
//    on the revealed layer until toggled back. On capable pointers, hovering
//    previews the revealed layer (and leaving reverts) without touching the
//    sticky state. Each state change plays the pixel sweep: pixels bloom from
//    the center, the layer swaps underneath at the midpoint, pixels clear.
//    prefers-reduced-motion swaps layers instantly with no sweep.
//
// INTERACTION STATE MACHINE (transition mode) — one deterministic model:
//
//   ┌──────────┐ hover/focus (fine pointer only)  ┌───────────────┐
//   │   idle   │ ───────────────────────────────▶ │  previewing   │
//   └──────────┘ ◀─────────────────────────────── └───────────────┘
//       │  ▲         mouse leave / blur               │          ▲
//       │  └──────────────────────────────────────────┘          │
//       │ click / tap / Enter / Space (sticky toggle)            │ mouse
//       ▼                                                        │ leave
//   ┌─────────────────────┐  sticky revealed until toggled back ──┘
//   │      revealed       │ ◀── hover never previews over a sticky reveal
//   └─────────────────────┘
//
// Every event path (hover, focus, click, keyboard, touch, external `active`
// prop) funnels through ONE pure resolver (resolvePixelCardMode in
// lib/pixel-card-interaction.ts) and ONE reconciler. The reconciler dedupes:
// a sweep already heading to the requested face is never restarted, so rapid
// hover/click/leave sequences cannot double-animate or race. Animation
// cancellation (requestAnimationFrame + timers — this codebase has no GSAP)
// happens in runSwap/swapLayers before any new sequence starts.
// ==============================================================================

import * as React from 'react';
import {
  resolvePixelCardMode,
  type PixelCardInteractionMode,
} from '@/lib/pixel-card-interaction';
import './pixel-card.css';

// ------------------------------------------------------------------------------
// Pixel class — the React Bits canvas pixel shader. Visuals unchanged.
// ------------------------------------------------------------------------------

class Pixel {
  width = 0;
  height = 0;
  ctx: CanvasRenderingContext2D = null as unknown as CanvasRenderingContext2D;
  x = 0;
  y = 0;
  color = '';
  speed = 0;
  size = 0;
  sizeStep = 0;
  minSize = 0;
  maxSizeInteger = 0;
  maxSize = 0;
  delay = 0;
  counter = 0;
  counterStep = 0;
  isIdle = false;
  isReverse = false;
  isShimmer = false;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number,
    maxSizeInteger: number,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = maxSizeInteger;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }
    if (this.isShimmer) {
      this.shimmer();
    } else {
      this.size += this.sizeStep;
    }
    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.isIdle = true;
      return;
    } else {
      this.size -= 0.1;
    }
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }
    if (this.isReverse) {
      this.size -= this.speed;
    } else {
      this.size += this.speed;
    }
  }
}

function getEffectiveSpeed(value: string | number, reducedMotion: boolean) {
  const min = 0;
  const max = 100;
  const throttle = 0.001;
  const parsed = parseInt(String(value), 10);

  if (parsed <= min || reducedMotion) {
    return min;
  } else if (parsed >= max) {
    return max * throttle;
  } else {
    return parsed * throttle;
  }
}

const VARIANTS: Record<
  string,
  { activeColor?: string; gap: number; speed: number; colors: string; noFocus: boolean }
> = {
  default: {
    activeColor: undefined,
    gap: 5,
    speed: 35,
    colors: '#f8fafc,#f1f5f9,#cbd5e1',
    noFocus: false,
  },
  blue: {
    activeColor: '#e0f2fe',
    gap: 10,
    speed: 25,
    colors: '#e0f2fe,#7dd3fc,#0ea5e9',
    noFocus: false,
  },
  yellow: {
    activeColor: '#fef08a',
    gap: 3,
    speed: 20,
    colors: '#fef08a,#fde047,#eab308',
    noFocus: false,
  },
  pink: {
    activeColor: '#fecdd3',
    gap: 6,
    speed: 80,
    colors: '#fecdd3,#fda4af,#e11d48',
    noFocus: true,
  },
};

export interface PixelCardProps {
  variant?: keyof typeof VARIANTS;
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Static content (original React Bits usage). */
  children?: React.ReactNode;
  /** Resting layer for the transition mode; falls back to children. */
  firstContent?: React.ReactNode;
  /** Revealed layer — its presence enables the sticky click/tap transition. */
  secondContent?: React.ReactNode;
  /** Sticky revealed state, controlled by the parent (click/tap toggles it). */
  active?: boolean;
  /** Called on click/tap/Enter/Space when in transition mode. */
  onToggle?: () => void;
  /** Full sweep duration in ms (bloom → swap → clear). Default 700. */
  transitionDuration?: number;
  /** Slow, smooth cross-fade between the two faces, in ms. Default 900. */
  fadeDuration?: number;
  /** Max pixel cell size in px (chunky mosaic vs fine shimmer). Default 2. */
  pixelSize?: number;
  /** Accessible name for the interactive container. */
  ariaLabel?: string;
}

export default function PixelCard({
  variant = 'default',
  gap = undefined,
  speed = undefined,
  colors = undefined,
  noFocus = undefined,
  className = '',
  style,
  children,
  firstContent,
  secondContent,
  active = false,
  onToggle,
  transitionDuration = 700,
  fadeDuration = 900,
  pixelSize = 2,
  ariaLabel,
}: PixelCardProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const activeLayerRef = React.useRef<HTMLDivElement | null>(null);
  const defaultLayerRef = React.useRef<HTMLDivElement | null>(null);
  const pixelsRef = React.useRef<Pixel[]>([]);
  const animationRef = React.useRef<number | null>(null);
  const swapTimerRef = React.useRef<number | null>(null);
  const timePreviousRef = React.useRef<number>(performance.now());
  const lastSizeRef = React.useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const fadeTimerRef = React.useRef<number | null>(null);
  const activeRef = React.useRef(active);

  // Interaction state — refs only, so interaction events never trigger
  // unnecessary React re-renders (the DOM is updated imperatively, exactly as
  // the original implementation did).
  const interactionRef = React.useRef<{
    mode: PixelCardInteractionMode;
    /** Face any in-flight sweep is heading toward (dedupe key). */
    sweepTarget: boolean | null;
  } | null>(null);
  const hoverIntentRef = React.useRef(false);
  const focusIntentRef = React.useRef(false);
  const canHoverRef = React.useRef(false);
  const reducedMotionRef = React.useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Reactive pointer-capability detection: matchMedia with change listeners
  // and cleanup, so hybrid devices (e.g. a laptop whose mouse is attached or
  // removed) never stay locked into the wrong interaction mode. `canHover` is
  // what gates hover/focus preview — touch-only devices never preview.
  const [canHover, setCanHover] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(reducedMotionRef.current);
  React.useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const sync = () => {
      canHoverRef.current = hoverQuery.matches;
      reducedMotionRef.current = motionQuery.matches;
      setCanHover(hoverQuery.matches);
      setReducedMotion(motionQuery.matches);
    };

    sync();
    if (typeof hoverQuery.addEventListener === 'function') {
      hoverQuery.addEventListener('change', sync);
      motionQuery.addEventListener('change', sync);
    } else {
      // Legacy Safari (<14) fallback API.
      hoverQuery.addListener(sync);
      motionQuery.addListener(sync);
    }

    return () => {
      if (typeof hoverQuery.removeEventListener === 'function') {
        hoverQuery.removeEventListener('change', sync);
        motionQuery.removeEventListener('change', sync);
      } else {
        hoverQuery.removeListener(sync);
        motionQuery.removeListener(sync);
      }
    };
  }, []);

  const variantCfg = VARIANTS[variant] ?? VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const transitionMode = secondContent != null;

  React.useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const initPixels = React.useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx || !width || !height) return;

    // Skip redundant re-inits: ResizeObserver can fire for size changes the
    // bitmap doesn't care about (and guards against any measure→resize ping).
    if (width === lastSizeRef.current.w && height === lastSizeRef.current.h) return;
    lastSizeRef.current = { w: width, h: height };

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    canvasRef.current.style.width = `${width}px`;
    canvasRef.current.style.height = `${height}px`;

    const colorsArray = finalColors.split(',');
    const pxs: Pixel[] = [];
    const step = parseInt(String(finalGap), 10) || 5;
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        const color = colorsArray[Math.floor(Math.random() * colorsArray.length)];
        const dx = x - width / 2;
        const dy = y - height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delay = reducedMotionRef.current ? 0 : distance;
        pxs.push(
          new Pixel(
            canvasRef.current,
            ctx,
            x,
            y,
            color,
            getEffectiveSpeed(finalSpeed, reducedMotionRef.current),
            delay,
            pixelSize,
          ),
        );
      }
    }
    pixelsRef.current = pxs;
  }, [finalColors, finalGap, finalSpeed, pixelSize]);

  const doAnimate = React.useCallback((fnName: 'appear' | 'disappear') => {
    animationRef.current = requestAnimationFrame(() => doAnimate(fnName));
    const timeNow = performance.now();
    const timePassed = timeNow - timePreviousRef.current;
    const timeInterval = 1000 / 60;

    if (timePassed < timeInterval) return;
    timePreviousRef.current = timeNow - (timePassed % timeInterval);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let allIdle = true;
    for (let i = 0; i < pixelsRef.current.length; i++) {
      const pixel = pixelsRef.current[i];
      pixel[fnName]();
      if (!pixel.isIdle) {
        allIdle = false;
      }
    }
    if (allIdle && animationRef.current != null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const handleAnimation = React.useCallback(
    (name: 'appear' | 'disappear') => {
      if (animationRef.current != null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      animationRef.current = requestAnimationFrame(() => doAnimate(name));
    },
    [doAnimate]
  );

  /** Swap the visible layer — instantly, or as a slow cross-fade. The fade
   *  runs while the pixel mosaic is up and keeps going after it clears, so the
   *  face change reads as a deliberate dissolve rather than a hard cut. */
  const swapLayers = React.useCallback(
    (showSecond: boolean, animate: boolean) => {
      const activeEl = activeLayerRef.current;
      const defaultEl = defaultLayerRef.current;
      if (!activeEl || !defaultEl) return;

      if (fadeTimerRef.current != null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }

      if (!animate || reducedMotionRef.current) {
        activeEl.style.transition = '';
        defaultEl.style.transition = '';
        activeEl.style.opacity = showSecond ? '1' : '0';
        defaultEl.style.opacity = '1';
        activeEl.style.display = showSecond ? 'block' : 'none';
        // The hidden face must be fully inert: visibility:hidden removes it
        // from the keyboard tab order AND the accessibility tree, in every
        // browser, without touching the pixel animation (the layers are
        // absolutely positioned beneath the canvas).
        activeEl.style.visibility = showSecond ? 'visible' : 'hidden';
        defaultEl.style.visibility = showSecond ? 'hidden' : 'visible';
        activeEl.setAttribute('aria-hidden', showSecond ? 'false' : 'true');
        defaultEl.setAttribute('aria-hidden', showSecond ? 'true' : 'false');
        return;
      }

      // The DEFAULT layer never leaves the flow — it is what sizes the
      // container (canvas and active layer are both absolute). Hiding it
      // would collapse the card to zero height mid-transition. It only
      // fades to 0 underneath the opaque revealed face.
      activeEl.setAttribute('aria-hidden', showSecond ? 'false' : 'true');
      defaultEl.setAttribute('aria-hidden', showSecond ? 'true' : 'false');

      if (showSecond) {
        activeEl.style.display = 'block';
        activeEl.style.visibility = 'visible';
        activeEl.style.transition = `opacity ${fadeDuration}ms ease`;
        defaultEl.style.transition = `opacity ${fadeDuration}ms ease, visibility 0ms ${fadeDuration}ms`;
        void activeEl.offsetHeight; // flush so the transition actually runs
        activeEl.style.opacity = '1';
        defaultEl.style.opacity = '0';
        // `visibility 0ms <fadeDuration>ms` flips visibility exactly at the
        // END of the dissolve: the outgoing face stays in the tree only for
        // the fade itself and becomes inert the moment it completes.
        defaultEl.style.visibility = 'hidden';
        fadeTimerRef.current = window.setTimeout(() => {
          defaultEl.style.transition = '';
          activeEl.style.transition = '';
          fadeTimerRef.current = null;
        }, fadeDuration);
      } else {
        defaultEl.style.transition = `opacity ${fadeDuration}ms ease`;
        activeEl.style.transition = `opacity ${fadeDuration}ms ease, visibility 0ms ${fadeDuration}ms`;
        void defaultEl.offsetHeight;
        defaultEl.style.opacity = '1';
        defaultEl.style.visibility = 'visible';
        activeEl.style.opacity = '0';
        activeEl.style.visibility = 'hidden';
        fadeTimerRef.current = window.setTimeout(() => {
          activeEl.style.display = 'none';
          defaultEl.style.transition = '';
          activeEl.style.transition = '';
          fadeTimerRef.current = null;
        }, fadeDuration);
      }
    },
    [fadeDuration]
  );

  // Two-phase sweep: bloom → swap layer at the midpoint → clear. Cancels any
  // stale sweep timers before starting, so overlapping requests can never
  // produce double animations.
  const runSwap = React.useCallback(
    (showSecond: boolean) => {
      if (swapTimerRef.current != null) {
        window.clearTimeout(swapTimerRef.current);
        swapTimerRef.current = null;
      }
      if (reducedMotionRef.current) {
        swapLayers(showSecond, false);
        return;
      }
      initPixels();
      handleAnimation('appear');
      swapTimerRef.current = window.setTimeout(() => {
        swapLayers(showSecond, true);
        handleAnimation('disappear');
        swapTimerRef.current = null;
      }, transitionDuration * 0.55);
    },
    [handleAnimation, initPixels, reducedMotionRef, swapLayers, transitionDuration]
  );

  /** Deterministically adopt the face for `mode`.
   *
   *  This is the ONLY place that decides which face is shown. It dedupes
   *  (a sweep already heading to the requested face is never restarted),
   *  performs the initial mount sync without animation, and routes reduced
   *  motion to instant swaps. */
  const reconcile = React.useCallback(
    (mode: PixelCardInteractionMode) => {
      const showSecond = mode !== 'idle';
      const prev = interactionRef.current;

      if (prev == null) {
        // First sync (mount / remount, e.g. while sticky-active): adopt the
        // current face instantly — no animation, matching the original
        // "no fade on mount" contract.
        interactionRef.current = { mode, sweepTarget: showSecond };
        swapLayers(showSecond, false);
        return;
      }

      if (prev.sweepTarget === showSecond) {
        // Already heading to (or settled on) this exact face — restarting the
        // sweep would be a double animation. Just bookkeep the mode.
        prev.mode = mode;
        return;
      }

      interactionRef.current = {
        mode,
        sweepTarget: reducedMotionRef.current ? null : showSecond,
      };
      if (reducedMotionRef.current) {
        swapLayers(showSecond, false);
      } else {
        runSwap(showSecond);
      }
    },
    [runSwap, swapLayers]
  );

  /** Single funnel for every interaction event: resolve the mode from the
   *  current intents, then reconcile. No event-specific state anywhere. */
  const applyInteraction = React.useCallback(() => {
    if (!transitionMode) return;
    reconcile(
      resolvePixelCardMode({
        active: activeRef.current,
        hoverIntent: hoverIntentRef.current,
        focusIntent: focusIntentRef.current,
        canHover: canHoverRef.current,
      })
    );
  }, [transitionMode, reconcile]);

  // Controlled `active` prop — same funnel as clicks/taps/keys.
  React.useEffect(() => {
    applyInteraction();
  }, [active, transitionMode, applyInteraction]);

  // Pointer-capability changes re-resolve the current intents (hybrid
  // devices: attaching/removing a mouse flips preview eligibility live).
  React.useEffect(() => {
    applyInteraction();
  }, [canHover, applyInteraction]);

  React.useEffect(() => {
    initPixels();
    const observer = new ResizeObserver(() => {
      initPixels();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
      if (animationRef.current != null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (swapTimerRef.current != null) {
        window.clearTimeout(swapTimerRef.current);
        swapTimerRef.current = null;
      }
      if (fadeTimerRef.current != null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [initPixels]);

  // ── Event handlers — thin wrappers over the single interaction funnel ────

  const handleMouseEnter = () => {
    if (transitionMode) {
      // Register preview intent only when entering a NON-sticky card — the
      // original semantics: a hover that begins over a sticky-revealed card
      // is not a preview request, so toggling the reveal off afterwards
      // returns to the default face instead of lingering as a preview.
      if (!activeRef.current) {
        hoverIntentRef.current = true;
        applyInteraction();
      }
    } else {
      handleAnimation('appear');
    }
  };

  const handleMouseLeave = () => {
    if (transitionMode) {
      hoverIntentRef.current = false;
      applyInteraction();
    } else {
      handleAnimation('disappear');
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (transitionMode) {
      // Same gate as hover: focus beginning on a sticky-revealed card is not
      // a preview request.
      if (!activeRef.current) {
        focusIntentRef.current = true;
        applyInteraction();
      }
    } else {
      handleAnimation('appear');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (transitionMode) {
      focusIntentRef.current = false;
      applyInteraction();
    } else {
      handleAnimation('disappear');
    }
  };

  const handleClick = () => {
    if (transitionMode) onToggle?.();
  };

  // Enter/Space toggle the SAME sticky state as mouse/touch: they call the
  // same onToggle, so the parent's active prop flows back through the same
  // reconciler — no separate state logic, no double firing (e.repeat guarded,
  // preventDefault stops Space from scrolling the page).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!transitionMode) return;
    if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) {
        onToggle?.();
      }
    }
  };

  const defaultLayer = firstContent ?? children;
  // Render-time read of the reconciler state. React only patches aria-hidden
  // when this value CHANGES between renders (it never does — the ref starts
  // null/false), so the imperative updates below always win. The real state
  // lives in interactionRef.
  const shownFace = interactionRef.current != null && interactionRef.current.mode !== 'idle';

  return (
    <div
      ref={containerRef}
      className={`pixel-card ${className}`}
      style={style}
      aria-label={ariaLabel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={finalNoFocus ? undefined : handleFocus}
      onBlur={finalNoFocus ? undefined : handleBlur}
      onClick={transitionMode ? handleClick : undefined}
      onKeyDown={transitionMode ? handleKeyDown : undefined}
      tabIndex={finalNoFocus ? -1 : 0}
      role={transitionMode ? 'button' : undefined}
    >
      <canvas className="pixel-canvas" ref={canvasRef} aria-hidden />
      {defaultLayer != null && (
        <div className="pixel-card__default" ref={defaultLayerRef} aria-hidden={shownFace}>
          {defaultLayer}
        </div>
      )}
      {transitionMode && (
        <div className="pixel-card__active" ref={activeLayerRef} aria-hidden={!shownFace}>
          {secondContent}
        </div>
      )}
    </div>
  );
}
