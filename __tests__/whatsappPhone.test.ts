// Logic extracted from WhatsAppModal — normalize phone to E.164 digits (no +)
function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/^\+/, '').replace(/\D/g, '');
  return digits.startsWith('91') ? digits : `91${digits}`;
}

describe('normalizePhone', () => {
  it('handles +91 prefix', () => expect(normalizePhone('+917002201297')).toBe('917002201297'));
  it('handles 91 prefix without +', () => expect(normalizePhone('917002201297')).toBe('917002201297'));
  it('handles 10-digit number without country code', () => expect(normalizePhone('7002201297')).toBe('917002201297'));
  it('handles number with spaces', () => expect(normalizePhone('+91 700 220 1297')).toBe('917002201297'));
  it('handles number with dashes', () => expect(normalizePhone('+91-700-220-1297')).toBe('917002201297'));
  it('handles null', () => expect(normalizePhone(null)).toBe('91'));
  it('handles undefined', () => expect(normalizePhone(undefined)).toBe('91'));
  it('handles empty string', () => expect(normalizePhone('')).toBe('91'));
  it('does not double-prepend 91', () => {
    // The original bug: 91 + +917002201297 = 91+917002201297
    expect(normalizePhone('+917002201297')).not.toContain('+');
    expect(normalizePhone('+917002201297')).not.toContain('9191');
  });
  it('produces valid WhatsApp URL phone segment', () => {
    const phone = normalizePhone('+917002201297');
    const url = `whatsapp://send?phone=${phone}`;
    expect(url).toBe('whatsapp://send?phone=917002201297');
  });
});
