// ==============================================================================
// DELT — Deal Card (email-safe renderer)
//
// Produces a self-contained HTML string with the same visual identity as the
// web Deal Card: ink surface, strong title, metadata grid, deal code footer.
// Uses only nested <table>s with inline styles and system font stacks — no
// React, no JS, no CSS features beyond what legacy clients tolerate.
//
// SECURITY: the renderer accepts ONLY pre-validated fields from the shared
// data layer. Values are HTML-escaped before interpolation. No tokens, OTPs,
// session data or internal IDs are ever accepted or emitted.
// ==============================================================================

import {
  dealCodeBars,
  getDealCardStatusMeta,
  formatCardDate,
  type DealCardData,
} from '@/lib/deal-card-data';

/** Minimal HTML escaping for email-safe interpolation. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Decorative barcode stripe — same deterministic pattern as the web card. */
function renderBars(dealCode: string): string {
  const bars = dealCodeBars(dealCode, 24);
  const cells = bars
    .map(
      (w, i) =>
        `<td style="width:2px;padding:0;"><div style="width:2px;height:${18 + ((i * 7) % 3) * 4}px;background:#F8FAFC;opacity:${(0.25 + (w / 4) * 0.6).toFixed(2)};line-height:0;font-size:0;">&nbsp;</div></td>`
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>${cells}</tr></table>`;
}

/**
 * Render the Deal Card as an email-safe HTML block.
 * `data` must come from `buildDealCardData` — nothing else is accepted.
 */
export function renderDealCardEmailHtml(data: DealCardData): string {
  const statusMeta = getDealCardStatusMeta(data.status);
  const dateLine = formatCardDate(data.createdAt) + (data.deadline ? ` · Due ${formatCardDate(data.deadline)}` : '');

  const cell = (label: string, value: string, color: string, mono = false) =>
    `<td valign="top" style="padding:0 12px 12px 0;">
      <div style="font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94A3B8;margin-bottom:3px;">${esc(label)}</div>
      <div style="font-size:14px;font-weight:600;color:${color};${mono ? 'font-family:monospace;' : ''}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;">${esc(value)}</div>
    </td>`;

  const metaCells: string[] = [cell('Creator', data.creatorName, '#F8FAFC')];
  if (data.clientName) metaCells.push(cell('Client', data.clientName, '#F8FAFC'));
  // Symbol + amount interpolate as adjacent spans in one cell — no gap.
  // Omitted entirely when the price is intentionally unknown (priceKnown:
  // false) — never render a fabricated ₹0.
  if (data.currencySymbol && data.amountLabel) {
    metaCells.push(cell('Value', `${data.currencySymbol}${data.amountLabel}`, '#60A5FA', true));
  }

  let progressRow = '';
  if (typeof data.progressPercent === 'number') {
    progressRow = `
    <tr>
      <td style="padding:2px 0 14px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td style="font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94A3B8;padding-bottom:4px;">Progress — ${data.completedMilestones}/${data.totalMilestones}</td>
        </tr></table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:rgba(148,163,184,0.18);border-radius:99px;">
          <tr><td style="height:3px;line-height:3px;font-size:0;" bgcolor="rgba(148,163,184,0.18)">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="height:3px;line-height:3px;font-size:0;width:${Math.max(2, Math.round((data.progressPercent / 100) * 220))}px;" bgcolor="#2563EB">&nbsp;</td>
            </tr></table>
          </td></tr>
        </table>
      </td>
    </tr>`;
  }

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
  <tr>
    <td style="background-color:#0F172A;border-radius:10px;border:1px solid #1E293B;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0F172A;">
        <!-- Header -->
        <tr>
          <td style="padding:20px 24px 0 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
              <td align="left" valign="middle">
                <span style="display:inline-block;background-color:#F8FAFC;color:#0F172A;font-size:11px;font-weight:700;letter-spacing:3px;padding:4px 7px;border-radius:3px;">DELT</span>
                <span style="font-size:9px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:#94A3B8;margin-left:10px;">Digital Deal</span>
              </td>
              <td align="right" valign="middle">
                <span style="display:inline-block;width:6px;height:6px;border-radius:99px;background-color:${statusMeta.accent};font-size:0;line-height:0;">&nbsp;</span>
                <span style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${statusMeta.accent};margin-left:6px;">${esc(statusMeta.label)}</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <!-- Title -->
        <tr>
          <td style="padding:18px 24px 0 24px;">
            <div style="font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:#F8FAFC;">${esc(data.title)}</div>
            ${data.scopeSummary ? `<div style="font-size:13px;line-height:1.55;color:#94A3B8;padding-top:8px;">${esc(data.scopeSummary)}</div>` : ''}
          </td>
        </tr>
        <!-- Meta grid -->
        <tr>
          <td style="padding:18px 24px 0 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${metaCells.join('')}</tr></table>
          </td>
        </tr>
        <!-- Progress -->
        ${progressRow}
        <!-- Divider -->
        <tr>
          <td style="padding:6px 24px 14px 24px;">
            <div style="border-top:1px dashed rgba(148,163,184,0.28);line-height:0;font-size:0;">&nbsp;</div>
          </td>
        </tr>
        <!-- Footer: deal code + bars -->
        <tr>
          <td style="padding:0 24px 18px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td align="left" valign="bottom">
                <div style="font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#94A3B8;margin-bottom:3px;">Deal</div>
                <div style="font-family:monospace;font-size:14px;font-weight:700;letter-spacing:2px;color:#F8FAFC;">${esc(data.dealCode)}</div>
                ${dateLine ? `<div style="font-size:10px;color:#94A3B8;padding-top:4px;">${esc(dateLine)}</div>` : ''}
              </td>
              <td align="right" valign="bottom">${renderBars(data.dealCode)}</td>
            </tr></table>
          </td>
        </tr>
        <!-- Technical band -->
        <tr>
          <td style="background-color:#111C33;border-top:1px solid rgba(148,163,184,0.16);padding:10px 24px;">
            <span style="font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#94A3B8;">DELT · Private Transaction</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}
