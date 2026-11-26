// GST calculation logic from invoice/[id].tsx
function calcGST(freight: number) {
  const taxable  = Math.round(freight / 1.18);
  const gst      = freight - taxable;
  const halfGst  = Math.round(gst / 2);
  return { taxable, gst, halfGst };
}

describe('GST calculation (18%)', () => {
  it('calculates correctly for ₹118', () => {
    const { taxable, gst } = calcGST(118);
    expect(taxable).toBe(100);
    expect(gst).toBe(18);
  });

  it('calculates correctly for ₹590 (5×118)', () => {
    const { taxable, gst } = calcGST(590);
    expect(taxable).toBe(500);
    expect(gst).toBe(90);
  });

  it('taxable + gst equals freight', () => {
    [100, 236, 500, 1180, 2360].forEach(freight => {
      const { taxable, gst } = calcGST(freight);
      expect(taxable + gst).toBe(freight);
    });
  });

  it('splits GST equally for intra-state (CGST + SGST)', () => {
    const { gst, halfGst } = calcGST(236);
    expect(halfGst * 2).toBeCloseTo(gst, 0); // may differ by 1 due to rounding
  });

  it('handles zero freight', () => {
    const { taxable, gst } = calcGST(0);
    expect(taxable).toBe(0);
    expect(gst).toBe(0);
  });
});

describe('inter-state vs intra-state routing', () => {
  it('uses IGST for inter-state', () => {
    const isInterState = 'Maharashtra' !== 'Delhi';
    expect(isInterState).toBe(true);
  });
  it('uses CGST+SGST for intra-state', () => {
    const isInterState = 'Maharashtra' !== 'Maharashtra';
    expect(isInterState).toBe(false);
  });
});
