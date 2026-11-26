import { fmtINR, fmtDate, fmtDateLong } from '../lib/format';

describe('fmtINR', () => {
  it('formats zero', () => expect(fmtINR(0)).toBe('0'));
  it('formats null as 0', () => expect(fmtINR(null)).toBe('0'));
  it('formats undefined as 0', () => expect(fmtINR(undefined)).toBe('0'));
  it('formats sub-1000', () => expect(fmtINR(500)).toBe('500'));
  it('formats exactly 1000', () => expect(fmtINR(1000)).toBe('1,000'));
  it('formats 10000 with Indian grouping', () => expect(fmtINR(10000)).toBe('10,000'));
  it('formats 100000 (1 lakh)', () => expect(fmtINR(100000)).toBe('1,00,000'));
  it('formats 1000000 (10 lakh)', () => expect(fmtINR(1000000)).toBe('10,00,000'));
  it('formats 10000000 (1 crore)', () => expect(fmtINR(10000000)).toBe('1,00,00,000'));
  it('formats 1234567', () => expect(fmtINR(1234567)).toBe('12,34,567'));
  it('formats negative', () => expect(fmtINR(-1500)).toBe('-1,500'));
  it('rounds decimals', () => expect(fmtINR(99.9)).toBe('100'));
  it('rounds down', () => expect(fmtINR(99.4)).toBe('99'));
  it('formats large COD amount', () => expect(fmtINR(75000)).toBe('75,000'));
  it('formats wallet balance 2500', () => expect(fmtINR(2500)).toBe('2,500'));
});

describe('fmtDate', () => {
  it('returns empty for null', () => expect(fmtDate(null)).toBe(''));
  it('returns empty for undefined', () => expect(fmtDate(undefined)).toBe(''));
  it('returns empty for empty string', () => expect(fmtDate('')).toBe(''));
  it('returns empty for invalid date string', () => expect(fmtDate('not-a-date')).toBe(''));
  it('formats ISO date string', () => expect(fmtDate('2026-11-26')).toMatch(/26 Nov '26/));
  it('formats Date object', () => {
    const d = new Date(2026, 0, 15); // Jan 15 2026
    expect(fmtDate(d)).toBe("15 Jan '26");
  });
  it('handles all 12 months', () => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    months.forEach((m, i) => {
      const d = new Date(2026, i, 1);
      expect(fmtDate(d)).toContain(m);
    });
  });
  it('formats single-digit day without padding', () => {
    const d = new Date(2026, 0, 5);
    expect(fmtDate(d)).toBe("5 Jan '26");
  });
  it('shows 2-digit year', () => {
    expect(fmtDate('2030-06-15')).toContain("'30");
  });
});

describe('fmtDateLong', () => {
  it('formats weekday and date', () => {
    // 2026-11-26 is a Thursday
    const d = new Date(2026, 10, 26);
    expect(fmtDateLong(d)).toBe('Thu, 26 Nov');
  });
  it('contains day abbreviation', () => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    days.forEach((day, i) => {
      const base = new Date(2026, 10, 1); // Nov 1, 2026 = Sun
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      expect(fmtDateLong(d)).toContain(days[d.getDay()]);
    });
  });
});
