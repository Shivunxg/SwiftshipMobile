import type { Order, OrderStatus } from '../lib/types';

// Replicate the filter logic from useOrders hooks so we can test without React context
const isCOD = (o: Order) => o.paymentMethod === 'COD';
const isNDR = (o: Order) => o.status === 'DELIVERY_FAILED' || o.status === 'NDR';
const isRTO = (o: Order) => o.status?.startsWith('RTO') ?? false;

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ORD-001',
    orderNumber: 'WIX-10001',
    merchantId: 1,
    receiverName: 'Test Customer',
    receiverPhone: '9876543210',
    receiverEmail: null,
    receiverAddress: '123 Main St',
    receiverAddressDetail: null,
    receiverPincode: '400001',
    receiverCity: 'Mumbai',
    receiverState: 'Maharashtra',
    receiverCountry: 'IN',
    senderName: 'Sender',
    senderPhone: null,
    senderCity: 'Mumbai',
    senderState: 'Maharashtra',
    senderPincode: '400001',
    weight: 0.5,
    length: null, width: null, height: null,
    quantity: 1,
    itemContents: 'Test Item',
    packageType: null,
    paymentMethod: 'PREPAID',
    paymentStatus: 'PAID',
    orderValue: 500,
    currency: 'INR',
    codAmount: null,
    codCollected: null,
    codRemitted: null,
    ndrReason: null, ndrDate: null,
    rtoReason: null, rtoInitiatedDate: null, rtoDeliveredDate: null,
    awbNumber: 'AWB123',
    courierPartner: 'Delhivery',
    freightCharge: 50,
    channelCode: null, serviceType: null, pickupLocationId: null,
    status: 'IN_TRANSIT',
    date: '2026-11-26',
    createdAt: '2026-11-26T10:00:00Z',
    lastStatusUpdateAt: null, shippedAt: null, pickedUpAt: null,
    deliveredAt: null, cancelledAt: null, expectedDeliveryDate: null, placedAt: null,
    reverse: false,
    ...overrides,
  };
}

describe('COD filter', () => {
  it('includes COD orders', () => expect(isCOD(makeOrder({ paymentMethod: 'COD', codAmount: 500 }))).toBe(true));
  it('excludes PREPAID orders', () => expect(isCOD(makeOrder({ paymentMethod: 'PREPAID' }))).toBe(false));
});

describe('NDR filter', () => {
  it('includes DELIVERY_FAILED', () => expect(isNDR(makeOrder({ status: 'DELIVERY_FAILED' }))).toBe(true));
  it('includes NDR status', () => expect(isNDR(makeOrder({ status: 'NDR' }))).toBe(true));
  it('excludes IN_TRANSIT', () => expect(isNDR(makeOrder({ status: 'IN_TRANSIT' }))).toBe(false));
  it('excludes DELIVERED', () => expect(isNDR(makeOrder({ status: 'DELIVERED' }))).toBe(false));
  it('excludes PROCESSING', () => expect(isNDR(makeOrder({ status: 'PROCESSING' }))).toBe(false));
});

describe('RTO filter', () => {
  it('includes RTO_INITIATED', () => expect(isRTO(makeOrder({ status: 'RTO_INITIATED' }))).toBe(true));
  it('includes RTO_IN_TRANSIT', () => expect(isRTO(makeOrder({ status: 'RTO_IN_TRANSIT' }))).toBe(true));
  it('includes RTO_DELIVERED', () => expect(isRTO(makeOrder({ status: 'RTO_DELIVERED' }))).toBe(true));
  it('excludes NDR', () => expect(isRTO(makeOrder({ status: 'NDR' }))).toBe(false));
  it('excludes CANCELLED', () => expect(isRTO(makeOrder({ status: 'CANCELLED' }))).toBe(false));
  it('excludes DELIVERED', () => expect(isRTO(makeOrder({ status: 'DELIVERED' }))).toBe(false));
});

describe('combined order list filtering', () => {
  const orders: Order[] = [
    makeOrder({ id: '1', paymentMethod: 'COD', codAmount: 300 }),
    makeOrder({ id: '2', paymentMethod: 'PREPAID', status: 'DELIVERED' }),
    makeOrder({ id: '3', status: 'NDR', paymentMethod: 'COD' }),
    makeOrder({ id: '4', status: 'RTO_INITIATED', paymentMethod: 'PREPAID' }),
    makeOrder({ id: '5', paymentMethod: 'COD', status: 'DELIVERY_FAILED' }),
  ];

  it('COD returns only COD orders', () => {
    const result = orders.filter(isCOD);
    expect(result.map(o => o.id)).toEqual(['1', '3', '5']);
  });

  it('NDR returns failed deliveries', () => {
    const result = orders.filter(isNDR);
    expect(result.map(o => o.id)).toEqual(['3', '5']);
  });

  it('RTO returns RTO orders only', () => {
    const result = orders.filter(isRTO);
    expect(result.map(o => o.id)).toEqual(['4']);
  });
});
