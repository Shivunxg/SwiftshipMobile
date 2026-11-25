// Module-level singleton to pass full shipment payload from create-shipment → courier-assignment
// Lives only in memory; no persistence needed.

export type PendingShipmentPayload = {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverState: string;
  receiverPincode: string;
  itemContents: string;
  weight: number;
  length: number | null;
  width: number | null;
  height: number | null;
  orderValue: number;
  paymentMethod: 'COD' | 'ONLINE';
  codAmount: number | null;
  pickupLocationId: number | null;
  fromPincode: string; // sender pincode
};

let _pending: PendingShipmentPayload | null = null;

export const setPendingShipment = (p: PendingShipmentPayload) => { _pending = p; };
export const getPendingShipment = (): PendingShipmentPayload | null => _pending;
export const clearPendingShipment = () => { _pending = null; };
