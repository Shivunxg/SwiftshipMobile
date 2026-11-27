import type { Order, Payout, PayoutDetail, WeightDiscrepancy, Wallet, Transaction, Pickup, AuthResponse } from './types';

// Normalize any truthy value to a safe string
const str  = (v: unknown, fallback = ''): string  => (v != null ? String(v) : fallback);
const num  = (v: unknown, fallback = 0): number   => (typeof v === 'number' ? v : fallback);
const bool = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : fallback);
const nullable = <T>(v: T | null | undefined): T | null => (v ?? null);

// Status normalization — backend may rename these over time
export function normalizeOrderStatus(raw: string | null | undefined): Order['status'] {
  const s = (raw ?? '').toUpperCase();
  const map: Record<string, Order['status']> = {
    PROCESSING:            'PROCESSING',
    READY_FOR_DISPATCH:    'READY_FOR_DISPATCH',
    PICKED_UP:             'PICKED_UP',
    IN_TRANSIT:            'IN_TRANSIT',
    OUT_FOR_DELIVERY:      'OUT_FOR_DELIVERY',
    DELIVERED:             'DELIVERED',
    DELIVERY_FAILED:       'DELIVERY_FAILED',
    NDR:                   'DELIVERY_FAILED', // treat legacy NDR as DELIVERY_FAILED
    RTO_INITIATED:         'RTO_INITIATED',
    RTO_IN_TRANSIT:        'RTO_IN_TRANSIT',
    RTO_DELIVERED:         'RTO_DELIVERED',
    CANCELLED:             'CANCELLED',
    CANCELLED_BY_MERCHANT: 'CANCELLED_BY_MERCHANT',
    CANCELLED_BY_ADMIN:    'CANCELLED_BY_ADMIN',
  };
  return map[s] ?? 'PROCESSING';
}

export function normalizePaymentMethod(raw: string | null | undefined): 'COD' | 'PREPAID' {
  const s = (raw ?? '').toUpperCase();
  if (s === 'COD') return 'COD';
  return 'PREPAID'; // ONLINE, PREPAID, or anything else → PREPAID
}

export function mapOrder(raw: any): Order {
  return {
    id:                   str(raw.id ?? raw.orderId),
    orderNumber:          str(raw.orderNumber ?? raw.id),
    merchantId:           num(raw.merchantId ?? raw.tenantId),

    receiverName:         str(raw.receiverName ?? raw.receiver?.name),
    receiverPhone:        str(raw.receiverPhone ?? raw.receiver?.phone),
    receiverEmail:        nullable(raw.receiverEmail ?? raw.receiver?.email),
    receiverAddress:      nullable(raw.receiverAddress ?? raw.receiver?.address),
    receiverAddressDetail:nullable(raw.receiverAddressDetail),
    receiverPincode:      nullable(str(raw.receiverPincode ?? raw.receiver?.pincode) || null),
    receiverCity:         nullable(raw.receiverCity ?? raw.receiver?.city),
    receiverState:        nullable(raw.receiverState ?? raw.receiver?.state),
    receiverCountry:      nullable(raw.receiverCountry ?? 'IN'),

    senderName:           nullable(raw.senderName ?? raw.sender?.name),
    senderPhone:          nullable(raw.senderPhone ?? raw.sender?.phone),
    senderCity:           nullable(raw.senderCity ?? raw.sender?.city),
    senderState:          nullable(raw.senderState ?? raw.sender?.state),
    senderPincode:        nullable(raw.senderPincode ?? raw.sender?.pincode),

    weight:               nullable(raw.weight != null ? num(raw.weight) : null),
    length:               nullable(raw.length != null ? num(raw.length) : null),
    width:                nullable(raw.width  != null ? num(raw.width)  : null),
    height:               nullable(raw.height != null ? num(raw.height) : null),
    quantity:             nullable(raw.quantity != null ? num(raw.quantity) : null),
    itemContents:         nullable(raw.itemContents ?? raw.description),
    packageType:          nullable(raw.packageType),

    paymentMethod:        normalizePaymentMethod(raw.paymentMethod),
    paymentStatus:        nullable(raw.paymentStatus),
    orderValue:           nullable(raw.orderValue != null ? num(raw.orderValue) : null),
    currency:             nullable(raw.currency ?? 'INR'),

    codAmount:            nullable(raw.codAmount != null ? num(raw.codAmount) : null),
    codCollected:         nullable(raw.codCollected != null ? bool(raw.codCollected) : null),
    codRemitted:          nullable(raw.codRemitted != null ? bool(raw.codRemitted) : null),

    ndrReason:            nullable(raw.ndrReason ?? raw.failureReason),
    ndrDate:              nullable(raw.ndrDate),
    rtoReason:            nullable(raw.rtoReason),
    rtoInitiatedDate:     nullable(raw.rtoInitiatedDate),
    rtoDeliveredDate:     nullable(raw.rtoDeliveredDate),

    awbNumber:            nullable(raw.awbNumber ?? raw.trackingNumber),
    courierPartner:       nullable(raw.courierPartner ?? raw.courierName),
    freightCharge:        nullable(raw.freightCharge ?? raw.freight ?? raw.freightAmount),
    channelCode:          nullable(raw.channelCode),
    serviceType:          nullable(raw.serviceType),
    pickupLocationId:     nullable(raw.pickupLocationId != null ? num(raw.pickupLocationId) : null),

    status:               normalizeOrderStatus(raw.status),
    date:                 nullable(raw.date ?? raw.createdAt),
    createdAt:            nullable(raw.createdAt),
    lastStatusUpdateAt:   nullable(raw.lastStatusUpdateAt ?? raw.updatedAt),
    shippedAt:            nullable(raw.shippedAt),
    pickedUpAt:           nullable(raw.pickedUpAt),
    deliveredAt:          nullable(raw.deliveredAt),
    cancelledAt:          nullable(raw.cancelledAt),
    expectedDeliveryDate: nullable(raw.expectedDeliveryDate ?? raw.edd),
    placedAt:             nullable(raw.placedAt ?? raw.createdAt),

    reverse:              bool(raw.reverse ?? raw.isReverse),
  };
}

export function mapPayout(raw: any): Payout {
  return {
    id:           num(raw.id),
    amount:       num(raw.amount ?? raw.netPayout),
    orderId:      str(raw.orderId),
    status:       raw.status ?? 'PENDING',
    deliveryDate: nullable(raw.deliveryDate),
    payoutDate:   nullable(raw.payoutDate ?? raw.releasedAt),
    createdAt:    str(raw.createdAt),
  };
}

export function mapPayoutDetail(raw: any): PayoutDetail {
  return {
    id:               num(raw.id),
    orderId:          str(raw.orderId),
    orderNumber:      str(raw.orderNumber ?? raw.orderId),
    receiverName:     str(raw.receiverName),
    receiverCity:     str(raw.receiverCity),
    awbNumber:        nullable(raw.awbNumber ?? raw.trackingNumber),
    courierPartner:   nullable(raw.courierPartner ?? raw.courierName),
    codAmount:        num(raw.codAmount),
    freightCharge:    num(raw.freightCharge ?? raw.freight),
    codHandlingCharge:num(raw.codHandlingCharge ?? raw.codCharge),
    reverseCharge:    num(raw.reverseCharge),
    weightCharge:     num(raw.weightCharge),
    netPayout:        num(raw.netPayout ?? raw.amount),
    status:           raw.status ?? 'PENDING',
    expectedDate:     nullable(raw.expectedDate ?? raw.payoutDate),
    releasedAt:       nullable(raw.releasedAt),
    createdAt:        str(raw.createdAt),
    batchId:          nullable(raw.batchId),
    remark:           nullable(raw.remark ?? raw.remarks),
  };
}

export function mapWeightDiscrepancy(raw: any): WeightDiscrepancy {
  return {
    id:               num(raw.id),
    orderId:          str(raw.orderId),
    orderNumber:      str(raw.orderNumber ?? raw.orderId),
    awbNumber:        nullable(raw.awbNumber ?? raw.trackingNumber),
    courierName:      nullable(raw.courierName ?? raw.courierPartner),
    declaredWeight:   num(raw.declaredWeight),
    chargedWeight:    num(raw.chargedWeight ?? raw.billedWeight),
    diffAmount:       num(raw.diffAmount ?? raw.difference),
    status:           raw.status ?? 'PENDING',
    createdAt:        str(raw.createdAt),
    resolvedAt:       nullable(raw.resolvedAt),
    merchantRemarks:  nullable(raw.merchantRemarks ?? raw.remarks),
    adminRemarks:     nullable(raw.adminRemarks),
  };
}

export function mapTransaction(raw: any): Transaction {
  return {
    id:          str(raw.id),
    type:        raw.type === 'DEBIT' ? 'DEBIT' : 'CREDIT',
    amount:      num(raw.amount),
    description: str(raw.description ?? raw.remarks),
    date:        str(raw.date ?? raw.createdAt),
    createdAt:   str(raw.createdAt ?? raw.date),
  };
}

export function mapWallet(raw: any): Wallet {
  return {
    balance:      num(raw.balance ?? raw.walletBalance),
    creditLimit:  num(raw.creditLimit),
    companyName:  str(raw.companyName),
    transactions: Array.isArray(raw.transactions)
      ? raw.transactions.map(mapTransaction)
      : [],
  };
}

export function mapPickup(raw: any): Pickup {
  return {
    id:             num(raw.id),
    pickupAddress:  str(raw.pickupAddress ?? raw.address),
    contactPerson:  str(raw.contactPerson ?? raw.name),
    phoneNumber:    str(raw.phoneNumber ?? raw.phone),
    city:           str(raw.city),
    pincode:        str(raw.pincode),
    preferredTime:  str(raw.preferredTime ?? raw.time),
    totalPackages:  num(raw.totalPackages ?? raw.packageCount),
    totalWeight:    num(raw.totalWeight),
    status:         raw.status ?? 'PENDING',
    tenantId:       num(raw.tenantId ?? raw.merchantId),
  };
}

// Status helpers — use these everywhere instead of hardcoded string checks
export const isNDR     = (s: string | null | undefined) =>
  s === 'DELIVERY_FAILED' || s === 'NDR';

export const isRTO     = (s: string | null | undefined) =>
  (s ?? '').startsWith('RTO');

export const isCOD     = (pm: string | null | undefined) =>
  pm === 'COD';

export const isActive  = (s: string | null | undefined) =>
  !['DELIVERED', 'CANCELLED', 'CANCELLED_BY_MERCHANT', 'CANCELLED_BY_ADMIN', 'RTO_DELIVERED'].includes(s ?? '');
