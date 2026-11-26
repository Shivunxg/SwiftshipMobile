import type { Payout } from '../lib/types';

// Logic extracted from pending-payouts-grouped.tsx
function addDays(iso: string | null | undefined, days: number): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(d: Date | null): string {
  if (!d) return 'pending';
  try { return d.toISOString().slice(0, 10); } catch (e) { return 'pending'; }
}

function groupPayouts(payouts: Payout[]) {
  const groups: Record<string, Payout[]> = {};
  payouts.forEach(p => {
    const key = isoDate(addDays(p.createdAt, 7));
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  return groups;
}

function makePayout(overrides: Partial<Payout> = {}): Payout {
  return {
    id: 1,
    amount: 500,
    orderId: 'ORD-001',
    status: 'PENDING',
    deliveryDate: null,
    payoutDate: null,
    createdAt: '2026-11-19T10:00:00Z',
    ...overrides,
  };
}

describe('addDays', () => {
  it('adds 7 days correctly', () => {
    const result = addDays('2026-11-19', 7);
    expect(result?.toISOString().slice(0, 10)).toBe('2026-11-26');
  });
  it('returns null for null input', () => expect(addDays(null, 7)).toBeNull());
  it('returns null for undefined', () => expect(addDays(undefined, 7)).toBeNull());
  it('returns null for invalid date', () => expect(addDays('not-a-date', 7)).toBeNull());
  it('crosses month boundary', () => {
    const result = addDays('2026-11-28', 7);
    expect(result?.toISOString().slice(0, 10)).toBe('2026-12-05');
  });
  it('crosses year boundary', () => {
    const result = addDays('2026-12-28', 7);
    expect(result?.toISOString().slice(0, 10)).toBe('2027-01-04');
  });
});

describe('isoDate', () => {
  it('returns pending for null', () => expect(isoDate(null)).toBe('pending'));
  it('returns YYYY-MM-DD format', () => {
    expect(isoDate(new Date('2026-11-26'))).toBe('2026-11-26');
  });
});

describe('groupPayouts', () => {
  it('groups payouts created on same day into one batch', () => {
    const payouts = [
      makePayout({ id: 1, createdAt: '2026-11-19T08:00:00Z' }),
      makePayout({ id: 2, createdAt: '2026-11-19T14:00:00Z' }),
    ];
    const groups = groupPayouts(payouts);
    expect(Object.keys(groups)).toHaveLength(1);
    expect(groups['2026-11-26']).toHaveLength(2);
  });

  it('separates payouts from different days into different batches', () => {
    const payouts = [
      makePayout({ id: 1, createdAt: '2026-11-19T10:00:00Z' }),
      makePayout({ id: 2, createdAt: '2026-11-20T10:00:00Z' }),
    ];
    const groups = groupPayouts(payouts);
    expect(Object.keys(groups)).toHaveLength(2);
    expect(groups['2026-11-26']).toHaveLength(1);
    expect(groups['2026-11-27']).toHaveLength(1);
  });

  it('groups null createdAt under pending', () => {
    const payouts = [makePayout({ id: 1, createdAt: null as any })];
    const groups = groupPayouts(payouts);
    expect(groups['pending']).toHaveLength(1);
  });

  it('calculates batch total correctly', () => {
    const payouts = [
      makePayout({ id: 1, amount: 300, createdAt: '2026-11-19T10:00:00Z' }),
      makePayout({ id: 2, amount: 700, createdAt: '2026-11-19T10:00:00Z' }),
    ];
    const groups = groupPayouts(payouts);
    const total = groups['2026-11-26'].reduce((s, p) => s + p.amount, 0);
    expect(total).toBe(1000);
  });

  it('returns empty object for empty input', () => {
    expect(groupPayouts([])).toEqual({});
  });

  it('counts pending payouts in a batch', () => {
    const payouts = [
      makePayout({ id: 1, status: 'PENDING', createdAt: '2026-11-19T10:00:00Z' }),
      makePayout({ id: 2, status: 'PROCESSED', createdAt: '2026-11-19T10:00:00Z' }),
    ];
    const batch = groupPayouts(payouts)['2026-11-26'];
    const pendingCount = batch.filter(p => p.status === 'PENDING').length;
    expect(pendingCount).toBe(1);
  });
});
