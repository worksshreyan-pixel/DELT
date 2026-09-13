// ==============================================================================
// DELT — Deal Card data layer tests (node:test, run via tsx)
// Covers: lib/deal-card-data.ts (mapping, statuses, progress, currency,
// priceKnown suppression, deterministic bars, date formatting) and
// lib/deal-url.ts (canonical client URL generation).
// ==============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDealCardData,
  getDealCardStatusMeta,
  dealCodeBars,
  formatCardDate,
  formatCardCurrency,
} from '../lib/deal-card-data';
import { getClientDealUrl, getCreatorDealUrl, generateDealCode } from '../lib/deal-url';

// ----------------------------------------------------------------- fixtures --

const BASE_DEAL = {
  dealCode: 'DLT-A7F39C21',
  title: 'Brand identity for Arka Tea',
  price: 45000,
  currency: 'INR' as 'INR' | 'USD' | 'EUR' | 'GBP',
  status: 'in_progress' as const,
  createdAt: '2026-09-01T10:00:00.000Z',
  deadline: '2026-10-01T10:00:00.000Z',
  description: 'Full brand system: logo, palette, packaging.',
  scope: ['Logo suite', 'Packaging system'],
};

const run = (over: Partial<typeof BASE_DEAL> = {}, params: Record<string, unknown> = {}) =>
  buildDealCardData({ deal: { ...BASE_DEAL, ...over }, ...params });

// ------------------------------------------------------------------- mapping --

describe('buildDealCardData — normal deal mapping', () => {
  test('maps every field from the deal record', () => {
    const d = run(
      {},
      { creatorName: 'Shreyan', clientName: 'Arka', deliverablesCount: 3 }
    );
    assert.equal(d.dealCode, 'DLT-A7F39C21');
    assert.equal(d.title, 'Brand identity for Arka Tea');
    assert.equal(d.creatorName, 'Shreyan');
    assert.equal(d.clientName, 'Arka');
    assert.equal(d.status, 'in_progress');
    assert.equal(d.deliverablesCount, 3);
    assert.equal(d.scopeSummary, 'Logo suite');
    assert.equal(d.createdAt, '2026-09-01T10:00:00.000Z');
    assert.equal(d.deadline, '2026-10-01T10:00:00.000Z');
  });

  test('falls back to generic names when caller omits them', () => {
    const d = run();
    assert.equal(d.creatorName, 'Creator');
    assert.equal(d.clientName, 'Client');
  });

  test('long deal codes are passed through verbatim (never truncated)', () => {
    const d = run({ dealCode: 'DLT-ABCDEFGHJKLMNPQRSTUVWXYZ23456789' });
    assert.equal(d.dealCode, 'DLT-ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
  });

  test('empty dealCode is tolerated (empty string, not a fake locator)', () => {
    const d = run({ dealCode: '' });
    assert.equal(d.dealCode, '');
  });
});

// ------------------------------------------------------------------ currency --

describe('buildDealCardData — currency formatting', () => {
  test('INR symbol and amount label', () => {
    const d = run();
    assert.equal(d.currencySymbol, '₹');
    assert.equal(d.amountLabel, '45,000');
  });

  test('USD uses $ and en-US grouping', () => {
    const d = run({ currency: 'USD' });
    assert.equal(d.currencySymbol, '$');
    assert.equal(d.amountLabel, '45,000');
  });

  test('EUR and GBP symbols map correctly', () => {
    assert.equal(run({ currency: 'EUR' }).currencySymbol, '€');
    assert.equal(run({ currency: 'GBP' }).currencySymbol, '£');
  });

  test('unknown currency falls back to the raw code as its symbol', () => {
    const d = run({ currency: 'AUD' as never });
    assert.equal(d.currencySymbol, 'AUD');
  });
});

// ------------------------------------------------------------------ progress --

describe('buildDealCardData — milestone progress', () => {
  test('progress present when milestones exist', () => {
    const d = run({}, {
      milestones: [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'in_progress' },
      ],
    });
    assert.equal(d.totalMilestones, 3);
    assert.equal(d.completedMilestones, 2);
    assert.equal(d.progressPercent, 67); // Math.round(2/3)
  });

  test('no milestones → progress fields are undefined, never fake 0%', () => {
    const d = run({}, { milestones: [] });
    assert.equal(d.progressPercent, undefined);
    assert.equal(d.completedMilestones, undefined);
    assert.equal(d.totalMilestones, undefined);
  });

  test('milestones omitted entirely behaves like no milestones', () => {
    const d = run();
    assert.equal(d.progressPercent, undefined);
  });

  test('all completed rounds to 100', () => {
    const d = run({}, { milestones: [{ status: 'completed' }, { status: 'completed' }] });
    assert.equal(d.progressPercent, 100);
  });
});

// ------------------------------------------------- priceKnown (email price) --

describe('buildDealCardData — priceKnown suppression (email ₹0 fix)', () => {
  test('a real price renders normally', () => {
    const d = run();
    assert.equal(d.currencySymbol, '₹');
    assert.equal(d.amountLabel, '45,000');
  });

  test('priceKnown: false omits the Value fields entirely', () => {
    const d = run({}, { priceKnown: false });
    assert.equal(d.currencySymbol, undefined);
    assert.equal(d.amountLabel, undefined);
  });

  test('a REAL zero price still renders (never hidden by suppression)', () => {
    const d = run({ price: 0 }, { priceKnown: true });
    assert.equal(d.amountLabel, '0');
  });

  test('status/date fields survive price suppression', () => {
    const d = run({}, { priceKnown: false });
    assert.equal(d.status, 'in_progress');
    assert.equal(d.title, 'Brand identity for Arka Tea');
  });
});

// ----------------------------------------------------------------- statuses --

describe('status meta', () => {
  test('every known status has a label and accent', () => {
    for (const s of ['draft', 'sent', 'viewed', 'negotiating', 'agreed', 'in_progress', 'payment_pending', 'paid', 'delivered', 'completed', 'closed', 'cancelled']) {
      const meta = getDealCardStatusMeta(s);
      assert.ok(meta.label.length > 0, `label for ${s}`);
      assert.ok(meta.accent.startsWith('#'), `accent for ${s}`);
    }
  });

  test('unknown status falls back to draft meta', () => {
    const meta = getDealCardStatusMeta('not_a_status');
    assert.equal(meta.label, 'Draft');
  });
});

// -------------------------------------------------------- deterministic bars --

describe('dealCodeBars — deterministic decorative pattern', () => {
  test('same code → same bars, always', () => {
    assert.deepEqual(dealCodeBars('DLT-A7F39C21'), dealCodeBars('DLT-A7F39C21'));
  });

  test('different codes → different bars', () => {
    assert.notDeepEqual(dealCodeBars('DLT-A7F39C21'), dealCodeBars('DLT-B7F39C21'));
  });

  test('bar widths stay within 1–4px and count is honored', () => {
    const bars = dealCodeBars('DLT-A7F39C21', 30);
    assert.equal(bars.length, 30);
    for (const w of bars) assert.ok(w >= 1 && w <= 4);
  });

  test('empty code falls back to a stable seed (never throws)', () => {
    assert.deepEqual(dealCodeBars(''), dealCodeBars(''));
  });
});

// -------------------------------------------------------------------- dates --

describe('formatCardDate / formatCardCurrency', () => {
  test('formats ISO dates as en-IN day-month-year', () => {
    assert.equal(formatCardDate('2026-09-01T10:00:00.000Z'), '1 Sept 2026');
  });

  test('invalid dates return empty string (no NaN leakage)', () => {
    assert.equal(formatCardDate('not-a-date'), '');
    assert.equal(formatCardDate(undefined), '');
  });

  test('formatCardCurrency delegates to the shared formatter', () => {
    assert.equal(formatCardCurrency(45000, 'INR'), '₹45,000');
  });
});

// --------------------------------------------------------------- deal URLs --

describe('deal-url — canonical client URL generation', () => {
  const originalUrl = process.env.NEXT_PUBLIC_APP_URL;

  test('encodes the deal code into the canonical client path', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://delt.example.com';
    assert.equal(
      getClientDealUrl('DLT-A7F39C21'),
      'https://delt.example.com/deal/DLT-A7F39C21'
    );
    assert.equal(
      getCreatorDealUrl('DLT-A7F39C21'),
      'https://delt.example.com/deals/DLT-A7F39C21'
    );
  });

  test('strips trailing slashes from the configured base', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://delt.example.com/';
    assert.equal(
      getClientDealUrl('DLT-A7F39C21'),
      'https://delt.example.com/deal/DLT-A7F39C21'
    );
  });

  test('URI-encodes unsafe characters in the code', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://delt.example.com';
    assert.equal(getClientDealUrl('DLT A/B'), 'https://delt.example.com/deal/DLT%20A%2FB');
  });

  test('generateDealCode excludes confusing characters', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateDealCode();
      assert.ok(code.startsWith('DLT-'));
      assert.doesNotMatch(code.slice(4), /[I1O0]/);
    }
  });

  test('URL helpers never append query parameters', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://delt.example.com';
    assert.ok(!getClientDealUrl('DLT-A7F39C21').includes('?'));
  });

  test('restores the environment after mutation', () => {
    process.env.NEXT_PUBLIC_APP_URL = originalUrl;
  });
});
