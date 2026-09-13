// ==============================================================================
// DELT — Deal Card email renderer tests (node:test, run via tsx)
// Covers: lib/deal-card-email.ts — table-based email HTML, HTML escaping,
// Value-cell suppression when the price is intentionally unknown, progress
// bar rendering, status meta, and the deterministic decorative bars.
// ==============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderDealCardEmailHtml } from '../lib/deal-card-email';
import { buildDealCardData } from '../lib/deal-card-data';

const build = (over: Record<string, unknown> = {}) =>
  buildDealCardData({
    deal: {
      dealCode: 'DLT-A7F39C21',
      title: 'Brand identity for Arka Tea',
      price: 45000,
      currency: 'INR' as const,
      status: 'in_progress' as const,
      createdAt: '2026-09-01T10:00:00.000Z',
      deadline: undefined,
      description: '',
      scope: [],
      ...over,
    },
    creatorName: 'Shreyan',
    clientName: 'Arka',
  });

describe('renderDealCardEmailHtml — structure', () => {
  const html = renderDealCardEmailHtml(build());

  test('renders a self-contained table block with the ink surface', () => {
    assert.ok(html.includes('background-color:#0F172A'));
    assert.ok(html.includes('<table role="presentation"'));
  });

  test('renders title, deal code and creator', () => {
    assert.ok(html.includes('Brand identity for Arka Tea'));
    assert.ok(html.includes('DLT-A7F39C21'));
    assert.ok(html.includes('Shreyan'));
  });

  test('renders the Value cell with symbol + amount for a real price', () => {
    assert.ok(html.includes('>Value<'));
    assert.ok(html.includes('₹45,000'));
  });

  test('renders the status label from shared meta (uppercased by client CSS)', () => {
    assert.ok(html.includes('In Progress'));
  });

  test('renders the technical band', () => {
    assert.ok(html.includes('DELT · Private Transaction'));
  });
});

describe('renderDealCardEmailHtml — progress', () => {
  test('progress bar present with milestone counts when milestones exist', () => {
    const data = build();
    const html = renderDealCardEmailHtml({
      ...data,
      progressPercent: 67,
      completedMilestones: 2,
      totalMilestones: 3,
    });
    assert.ok(html.includes('Progress — 2/3'));
  });

  test('no progress section when there are no milestones', () => {
    const html = renderDealCardEmailHtml(build());
    assert.ok(!html.includes('Progress —'));
  });
});

describe('renderDealCardEmailHtml — unknown price handling', () => {
  test('priceKnown: false omits the Value cell — no fabricated ₹0', () => {
    const html = renderDealCardEmailHtml(buildDealCardData({
      deal: {
        dealCode: 'DLT-A7F39C21',
        title: 'Brand identity for Arka Tea',
        price: 0,
        currency: 'INR' as const,
        status: 'sent' as const,
        createdAt: '2026-09-01T10:00:00.000Z',
        deadline: undefined,
        description: '',
        scope: [],
      },
      creatorName: 'Shreyan',
      clientName: 'Arka',
      priceKnown: false,
    }));
    assert.ok(!html.includes('>Value<'));
    assert.ok(!html.includes('₹0<'));
  });

  test('a REAL zero price still renders as ₹0 (explicit, not suppressed)', () => {
    const html = renderDealCardEmailHtml(build({ price: 0 }));
    assert.ok(html.includes('₹0'));
    assert.ok(html.includes('>Value<'));
  });
});

describe('renderDealCardEmailHtml — HTML escaping (XSS)', () => {
  test('escapes HTML-significant characters in user-controlled fields', () => {
    const html = renderDealCardEmailHtml(build({
      title: '<script>alert("x")</script>',
      description: "Robert'); DROP TABLE Students;-- <b>bold</b> & 'quoted' \"double\"",
    }));
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('&quot;'));
    assert.ok(html.includes('&#39;'));
    assert.ok(html.includes('&amp;'));
  });

  test('escapes the deal code and names too', () => {
    const html = renderDealCardEmailHtml(
      build({ dealCode: 'DLT-<img>' }),
      );
    // The literal tag must never appear; the escaped form must.
    assert.ok(!html.includes('<img>'));
    assert.ok(html.includes('DLT-&lt;img&gt;'));
  });
});

describe('renderDealCardEmailHtml — dates', () => {
  test('renders created date; appends due date only when present', () => {
    const withDue = renderDealCardEmailHtml(build({ deadline: '2026-10-01T10:00:00.000Z' }));
    const withoutDue = renderDealCardEmailHtml(build());
    assert.ok(withDue.includes('Due'));
    assert.ok(!withoutDue.includes('Due'));
  });
});
