export type OrderStatus =
  | 'PROCESSING' | 'READY_FOR_DISPATCH' | 'PICKED_UP'
  | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  | 'DELIVERY_FAILED' | 'NDR' | 'RTO_INITIATED' | 'RTO_IN_TRANSIT' | 'RTO_DELIVERED'
  | 'CANCELLED' | 'CANCELLED_BY_MERCHANT' | 'CANCELLED_BY_ADMIN';

export interface Order {
  id: string;
  orderNumber: string;
  merchantId: number;

  // Receiver (customer)
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string | null;
  receiverAddress: string | null;
  receiverAddressDetail: string | null;
  receiverPincode: string | null;
  receiverCity: string | null;
  receiverState: string | null;
  receiverCountry: string | null;

  // Sender (warehouse/pickup)
  senderName: string | null;
  senderPhone: string | null;
  senderCity: string | null;
  senderState: string | null;
  senderPincode: string | null;

  // Package
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  quantity: number | null;
  itemContents: string | null;
  packageType: string | null;

  // Payment
  paymentMethod: 'COD' | 'PREPAID';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | null;
  orderValue: number | null;
  currency: string | null;

  // COD
  codAmount: number | null;
  codCollected: boolean | null;
  codRemitted: boolean | null;

  // NDR / RTO
  ndrReason: string | null;
  ndrDate: string | null;
  rtoReason: string | null;
  rtoInitiatedDate: string | null;
  rtoDeliveredDate: string | null;

  // Shipment
  awbNumber: string | null;
  courierPartner: string | null;
  freightCharge: number | null;
  channelCode: string | null;
  serviceType: string | null;
  pickupLocationId: number | null;

  // Status & timestamps
  status: OrderStatus;
  date: string | null;
  createdAt: string | null;
  lastStatusUpdateAt: string | null;
  shippedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  expectedDeliveryDate: string | null;
  placedAt: string | null;

  reverse: boolean;
}

export interface Wallet {
  balance: number;
  creditLimit: number;
  companyName: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface Pickup {
  id: number;
  pickupAddress: string;
  contactPerson: string;
  phoneNumber: string;
  city: string;
  pincode: string;
  preferredTime: string;
  totalPackages: number;
  totalWeight: number;
  status: 'PENDING' | 'SCHEDULED' | 'PICKED_UP';
  tenantId: number;
}

export interface Payout {
  id: number;
  amount: number;
  orderId: string;
  status: 'PENDING' | 'CASH_COLLECTED' | 'PROCESSED';
  deliveryDate: string | null;
  payoutDate: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  userId: number;
  tenantId: number;
  name: string;
  companyName: string;
  walletBalance: number;
}

export interface WeightDiscrepancy {
  id: number;
  orderId: string;
  orderNumber: string;
  awbNumber: string | null;
  courierName: string | null;
  declaredWeight: number;
  chargedWeight: number;
  diffAmount: number;
  status: 'PENDING' | 'DISPUTED' | 'ACCEPTED' | 'RESOLVED';
  createdAt: string;
  resolvedAt: string | null;
  merchantRemarks: string | null;
  adminRemarks: string | null;
}

export interface WarehouseLocation {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  verificationStatus?: string;
  source?: 'server' | 'local';
}

export interface BankDetails {
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  accountHolderName?: string;
}

export interface MerchantCourier {
  id: string;
  name: string;
  code: string;
  serviceMode: string;
  enabled: boolean;
}

export interface MerchantProfile {
  companyName?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

export interface PayoutDetail {
  id: number;
  orderId: string;
  orderNumber: string;
  receiverName: string;
  receiverCity: string;
  awbNumber: string | null;
  courierPartner: string | null;
  codAmount: number;
  freightCharge: number;
  codHandlingCharge: number;
  reverseCharge: number;
  weightCharge: number;
  netPayout: number;
  status: 'PENDING' | 'CASH_COLLECTED' | 'PROCESSED';
  expectedDate: string | null;
  releasedAt: string | null;
  createdAt: string;
  batchId: string | null;
  remark: string | null;
}
