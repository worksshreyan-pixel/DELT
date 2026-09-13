'use client';

// ==============================================================================
// DELT — Deal Card (web)
//
// A premium "digital deal pass": DELTissued visual identity object for a deal.
// One component, three variants driven by props:
//   • workspace — lives beside the Overview content: pointer tilt + glare,
//     hover preview, click/tap sticky pixel reveal.
//   • share     — the same reveal interaction (hover preview + sticky toggle),
//     without the workspace-only tilt/glare layer — lighter motion for the
//     Share dialog surface.
//   • embedded  — fully static presentation: no canvas/pixel engine, no tilt,
//     no pointer or keyboard interaction — safe wherever browser-only
//     behavior cannot be relied on (email-adjacent/SSR contexts).
//
// THE WHOLE CARD is a pixel-reveal object (React Bits <PixelCard />, canvas
// shader — no dependency): resting = the full card; hovering previews the
// revealed state (sweep → big deal code → sweep back on leave), and a
// CLICK/TAP toggles the revealed state STICKY — the card stays on the big
// deal-code face until tapped again. Keyboard focus mirrors hover; touch
// devices toggle on tap only; reduced motion swaps states instantly.
//
// The footer QR encodes the canonical client deal URL (/deal/{deal_code}) via
// the existing getClientDealUrl architecture. It is a locator, not an
// authentication mechanism: scanning it reaches the standard OTP/session flow.
// The revealed QR uses the same URL, so scanning and tapping reach the same
// canonical page — only more prominent on hover.
//
// Small standalone pixel-text elements use React Bits <PixelCard /> (vanilla
// JS/CSS — no new dependency), rendered where a pixel hover-texture belongs
// (e.g., canvas/textarea overlays, headings).
//
// Data rules: every field comes from lib/deal-card-data.ts mapping of the real
// deal record. No UUIDs, tokens, emails or payment internals are rendered.
// ==============================================================================

import * as React from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import PixelCard from '@/components/ui/pixel-card';
import { getClientDealUrl } from '@/lib/deal-url';
import { cn } from '@/lib/utils';
import {
  buildDealCardData,
  getDealCardStatusMeta,
  formatCardDate,
  type DealCardData,
} from '@/lib/deal-card-data';
import type { Deal, Milestone } from '@/lib/types';

export type DealCardVariant = 'workspace' | 'share' | 'embedded';

export interface DealCardProps {
  /** Existing DELT deal record — the card never fetches. */
  deal: Pick<
    Deal,
    'dealCode' | 'title' | 'price' | 'currency' | 'status' | 'createdAt' | 'deadline' | 'description' | 'scope'
  >;
  creatorName?: string;
  clientName?: string;
  deliverablesCount?: number;
  milestones?: Array<Pick<Milestone, 'status'>>;
  variant?: DealCardVariant;
  className?: string;
}

// Ink palette — deliberately does not inherit the light-theme background.
const INK = {
  surface: '#0F172A',
  deep: '#0B1120',
  band: '#111C33',
  line: 'rgba(148, 163, 184, 0.16)',
  lineStrong: 'rgba(148, 163, 184, 0.28)',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textFaint: 'rgba(148, 163, 184, 0.55)',
  cobalt: '#2563EB',
};

const TILT_SPRING = { stiffness: 180, damping: 22, mass: 0.6 };

export function DealCard({
  deal,
  creatorName,
  clientName,
  deliverablesCount,
  milestones,
  variant = 'workspace',
  className,
}: DealCardProps) {
  const reduceMotion = useReducedMotion();
  const interactive = variant === 'workspace' && !reduceMotion;

  // Motion profile per variant (each variant is intentional):
  //   workspace → full interaction (tilt + glare + pixel reveal)
  //   share     → pixel reveal without the workspace-only tilt/glare layer
  //   embedded  → static (handled by the early return below)
  const enablePixelReveal = variant !== 'embedded' && !reduceMotion;

  const data: DealCardData = React.useMemo(
    () => buildDealCardData({ deal, creatorName, clientName, deliverablesCount, milestones }),
    [deal, creatorName, clientName, deliverablesCount, milestones]
  );

  const statusMeta = getDealCardStatusMeta(data.status);

  // Canonical client URL — encoded in the QRs. Deterministic per deal; contains
  // only the public deal_code locator.
  const dealUrl = React.useMemo(
    () => (data.dealCode ? getClientDealUrl(data.dealCode) : ''),
    [data.dealCode]
  );

  // --- Pointer tilt (workspace variant only, fine pointers, reduced-motion safe)
  const rx = useSpring(0, TILT_SPRING);
  const ry = useSpring(0, TILT_SPRING);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(240px circle at ${gx}% ${gy}%, rgba(148,163,184,0.10), transparent 65%)`;

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      ry.set((px - 0.5) * 4); // ±2°
      rx.set((0.5 - py) * 4);
      gx.set(px * 100);
      gy.set(py * 100);
    },
    [interactive, rx, ry, gx, gy]
  );

  const handlePointerLeave = React.useCallback(() => {
    rx.set(0);
    ry.set(0);
    gx.set(50);
    gy.set(50);
  }, [rx, ry, gx, gy]);

  const hasMilestones = typeof data.progressPercent === 'number';

  // Container-style responsiveness: track the card's own width so the meta
  // grid reacts to where the card actually sits (workspace column, share
  // dialog, mobile stack). One boolean, flipped only when the threshold is
  // crossed — never per-frame. (Tailwind 3.3 lacks container queries.)
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const [wide, setWide] = React.useState(false);
  React.useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const measure = () => setWide(el.offsetWidth >= 380);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── The full resting card — this entire surface pixelates away on hover. ──
  const cardSurface = (
    <div className="relative h-full w-full bg-[#0F172A] text-[#F8FAFC]">
      {/* Fine engineering grid — rewards looking closely, stays quiet */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `linear-gradient(${INK.line} 1px, transparent 1px), linear-gradient(90deg, ${INK.line} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(120% 90% at 85% 0%, black 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(120% 90% at 85% 0%, black 25%, transparent 75%)',
        }}
      />
      {/* Pointer glare (workspace only) */}
      {interactive && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: glare }}
        />
      )}

      <div className="relative p-5 sm:p-6">
        {/* ── Header: DELT mark + status ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 items-center rounded-[4px] bg-[#F8FAFC] px-1.5 text-[11px] font-bold tracking-[0.18em] text-[#0F172A]">
              DELT
            </span>
            <span
              className="text-[10px] font-medium uppercase leading-none tracking-[0.28em]"
              style={{ color: INK.textFaint }}
            >
              Digital Deal
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
              style={{ backgroundColor: statusMeta.accent }}
            />
            <span
              className="text-[10px] font-semibold uppercase leading-none tracking-[0.2em] transition-colors duration-300"
              style={{ color: statusMeta.accent }}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* ── Title block ────────────────────────────────────────────────── */}
        <div className="mt-5">
          <h3
            className="font-display text-[26px] font-semibold leading-[1.08] tracking-tight sm:text-[30px]"
            style={{ color: INK.text }}
          >
            {data.title}
          </h3>
          {data.scopeSummary && (
            <p
              className="mt-2 max-w-[42ch] text-[13px] leading-relaxed"
              style={{ color: INK.textSecondary }}
            >
              {data.scopeSummary}
            </p>
          )}
        </div>

        {/* ── Info grid — optically balanced 2/4 columns ────────────────────
            Responsive to the CARD's own measured width, not the viewport
            (Tailwind 3.3 has no container queries). <380px card: 2 columns.
            ≥380px card: four equal minmax(0,1fr) tracks; labels step down to
            8.5px/0.14em so DELIVERABLES always fits its quarter track. */}
        <dl
          className={cn(
            'mt-6 grid gap-x-4 gap-y-5 pr-1',
            wide ? 'grid-cols-4 gap-x-3' : 'grid-cols-2'
          )}
        >
          <Meta label="Creator" value={data.creatorName} wide={wide} />
          <Meta label="Client" value={data.clientName} wide={wide} />
          {/* Symbol and digits share one baseline as a single value. */}
          <Meta
            label="Value"
            value={data.amountLabel}
            accent
            leadingSymbol={data.currencySymbol}
            wide={wide}
          />
          <Meta
            label="Deliverables"
            value={data.deliverablesCount != null ? String(data.deliverablesCount).padStart(2, '0') : undefined}
            wide={wide}
          />
        </dl>

        {/* ── Progress — only when milestones exist ──────────────────────── */}
        {hasMilestones && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <span
                className="text-[10px] font-medium uppercase leading-none tracking-[0.2em]"
                style={{ color: INK.textFaint }}
              >
                Progress
              </span>
              <span className="font-mono text-xs leading-none" style={{ color: INK.textSecondary }}>
                {data.completedMilestones}/{data.totalMilestones}
              </span>
            </div>
            <div
              className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full"
              style={{ backgroundColor: 'rgba(148, 163, 184, 0.18)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: INK.cobalt }}
                initial={{ width: 0 }}
                animate={{ width: `${data.progressPercent}%` }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Perforated divider with ticket cutouts ───────────────────────────
          The wrapper spans the FULL card width; cutouts use top:0 +
          -translate-y-1/2 on the zero-height wrapper whose top edge IS the
          divider line — centers sit exactly on the dashes. */}
      <div className="relative h-px" aria-hidden>
        <div
          className="absolute top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            left: 0,
            borderColor: 'rgba(148, 163, 184, 0.28)',
            backgroundColor: 'var(--card, #FFFFFF)',
            boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.10)',
          }}
        />
        <div
          className="absolute top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            left: '100%',
            borderColor: 'rgba(148, 163, 184, 0.28)',
            backgroundColor: 'var(--card, #FFFFFF)',
            boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.10)',
          }}
        />
        <div
          className="absolute top-0 right-6 left-6 border-t border-dashed"
          style={{ borderColor: INK.lineStrong }}
        />
      </div>

      <div className="relative p-5 pt-4 sm:p-6 sm:pt-4">
        {/* ── Footer: deal code + QR ──────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div
              className="text-[9px] font-medium uppercase leading-none tracking-[0.3em]"
              style={{ color: INK.textFaint }}
            >
              Deal
            </div>
            <div
              className="mt-1 whitespace-nowrap font-mono text-[15px] font-semibold leading-none tracking-[0.1em] sm:text-[13px]"
              style={{ color: INK.text }}
            >
              {data.dealCode}
            </div>
            <div className="mt-1.5 text-[10px] leading-none" style={{ color: INK.textFaint }}>
              {formatCardDate(data.createdAt)}
              {data.deadline ? ` · Due ${formatCardDate(data.deadline)}` : ''}
            </div>
          </div>

          {/* QR encodes the canonical client deal URL — a locator, not a
              credential. Deterministic per deal. Non-interactive by design:
              the CARD is the interaction surface, so the QR must not be a
              focusable link nested inside the card's role="button". Visual
              position and appearance are unchanged. */}
          {dealUrl && (
            <div className="group relative shrink-0 rounded-md bg-[#F8FAFC] p-1.5">
              <QRCodeSVG
                value={dealUrl}
                size={52}
                level="M"
                bgColor="#F8FAFC"
                fgColor="#0F172A"
                marginSize={0}
              />
              {/* Scan hint — appears on hover, never animates the pattern */}
              <span
                className="pointer-events-none absolute -top-7 right-0 whitespace-nowrap rounded-md border border-[#1E293B] bg-[#0B1120] px-2 py-1 text-[9px] font-medium tracking-[0.14em] text-[#94A3B8] opacity-0 uppercase transition-opacity duration-150 group-hover:opacity-100"
                aria-hidden
              >
                Scan to open deal
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom technical band */}
      <div
        className="flex items-center justify-between border-t px-5 py-2.5 sm:px-6"
        style={{ borderColor: INK.line, backgroundColor: INK.band }}
      >
        <span className="text-[9px] font-medium uppercase tracking-[0.3em]" style={{ color: INK.textFaint }}>
          DELT · Private Transaction
        </span>
        <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color: INK.textFaint }}>
          {data.dealCode.replace(/[^A-Z0-9]/g, '')}
        </span>
      </div>
    </div>
  );

  // ── QR block on the revealed face. Non-interactive (the card itself is the
  //     interaction surface — no nested link inside role="button"), and it
  //     encodes EXACTLY the canonical client deal URL — the same value the
  //     footer QR encodes, with no extra query parameters. ──
  const qrBlock = dealUrl ? (
    <div className="relative shrink-0 rounded-lg bg-[#F8FAFC] p-2">
      <QRCodeSVG
        value={dealUrl}
        size={104}
        level="M"
        bgColor="#F8FAFC"
        fgColor="#0F172A"
        marginSize={0}
      />
      <span
        className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#1E293B] bg-[#0B1120] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#94A3B8] opacity-0 transition-opacity duration-150 hover:opacity-100 focus-within:opacity-100"
        aria-hidden
      >
        Scan to open deal
      </span>
    </div>
  ) : null;

  // ── Revealed face — the deal identity credential: big code + date + QR. ────
  // The code font scales with the CARD's own width (container-type: inline-size
  // + cqi units): 12-char codes fill the line without ever wrapping or
  // overflowing, at every card width. Fallback text-[28px] applies where cqi
  // is unsupported.
  const revealedSurface = (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-6 bg-[#0B1120] px-6 text-center"
      style={{ containerType: 'inline-size' }}
    >
      <span
        className="text-[12px] font-medium uppercase leading-none tracking-[0.38em]"
        style={{ color: INK.cobalt }}
      >
        Deal
      </span>
      <span
        className="break-all font-mono text-[28px] font-bold leading-tight tracking-[0.06em]"
        style={{ color: INK.text, fontSize: 'clamp(24px, 10.5cqi, 44px)' }}
      >
        {data.dealCode}
      </span>
      <div className="text-[12px] leading-none" style={{ color: INK.textFaint }}>
        {formatCardDate(data.createdAt)}
        {data.deadline ? ` · Due ${formatCardDate(data.deadline)}` : ''}
      </div>
      {qrBlock}
    </div>
  );

  // Sticky revealed state — a click/tap flips the card and it STAYS flipped
  // until the next click/tap, on every device.
  const [revealed, setRevealed] = React.useState(false);

  // Embedded: fully static — no canvas/pixel engine, no tilt, no pointer or
  // keyboard interaction. Renders the resting card only.
  if (variant === 'embedded') {
    return (
      <div className={cn('relative select-none', className)}>
        <div className="relative overflow-hidden rounded-xl border border-slate-800">
          {cardSurface}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn('relative select-none', className)}
      style={{ perspective: 1200 }}
      initial={variant === 'workspace' && !reduceMotion ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
    >
      <motion.div
        ref={surfaceRef}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative overflow-hidden rounded-xl border border-slate-800"
      >
        {!enablePixelReveal ? (
          // Reduced motion (workspace/share): instant state swap, no pixel
          // sweep. Click still toggles so the interaction is never lost.
          <div
            onClick={() => setRevealed((r) => !r)}
            role="button"
            aria-label={`Deal ${data.dealCode} — activate to show the deal code`}
            className="h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/60"
          >
            {revealed ? revealedSurface : cardSurface}
          </div>
        ) : (
          <PixelCard
            className="h-full w-full cursor-pointer"
            variant="blue"
            gap={14}
            speed={60}
            colors={`${INK.cobalt},#3B82F6,#1E40AF`}
            pixelSize={9}
            transitionDuration={700}
            ariaLabel={`Deal ${data.dealCode} — activate to flip to the deal code`}
            active={revealed}
            onToggle={() => setRevealed((r) => !r)}
            firstContent={cardSurface}
            secondContent={revealedSurface}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

function Meta({
  label,
  value,
  accent,
  leadingSymbol,
  wide,
}: {
  label: string;
  value?: string;
  accent?: boolean;
  /** Currency symbol rendered inline on the same baseline as the value. */
  leadingSymbol?: string;
  /** Card is ≥380px wide — labels compress to fit the quarter track. */
  wide: boolean;
}) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt
        className={cn(
          'truncate text-[9px] font-medium uppercase leading-none',
          wide ? 'tracking-[0.14em] text-[8.5px]' : 'tracking-[0.22em]'
        )}
        style={{ color: INK.textFaint }}
      >
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1.5 flex items-baseline text-sm font-semibold leading-none',
          accent && 'font-mono tracking-normal'
        )}
        style={{ color: accent ? INK.cobalt : INK.text }}
        title={leadingSymbol ? `${leadingSymbol}${value}` : value}
      >
        {/* Currency symbol: identical font size/weight/baseline as the digits,
            zero gap — one typographic unit (₹5,000), not icon + number. */}
        {leadingSymbol && <span aria-hidden className="text-sm font-semibold">{leadingSymbol}</span>}
        <span className="min-w-0 truncate">{value}</span>
      </dd>
    </div>
  );
}
