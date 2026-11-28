import type { MerchantProfile, Order, WarehouseLocation } from './types';

export type DocumentPrintMode = 'clubbed' | 'label' | 'invoice';

function escapeHtml(input?: string): string {
  return (input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatInr(amount: number): string {
  return `₹${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
}

function renderSingleDocumentBlock(
  order: Order,
  companyName: string,
  mode: DocumentPrintMode,
  sellerProfile?: Partial<MerchantProfile> | null,
  warehouses: WarehouseLocation[] = []
): string {
  const showLabel = mode === 'label' || mode === 'clubbed';
  const showInvoice = mode === 'invoice' || mode === 'clubbed';
  const isCod = order.paymentMethod === 'COD';
  const base = order.orderAmount / 1.18;
  const totalTax = order.orderAmount - base;
  const cgst = totalTax / 2;
  const sgst = totalTax - cgst;
  const barcode = escapeHtml(order.awbNumber || order.orderNumber || 'SWIFTSHIP');

  const matchedWh =
    warehouses.find((w) => w.name.toLowerCase() === (order.pickupLocation || '').toLowerCase()) ??
    warehouses.find((w) => w.isDefault) ??
    warehouses[0] ??
    null;

  const sellerName = sellerProfile?.companyName || companyName || order.pickupLocation || 'SwiftShip Merchant';
  const sellerGstin = sellerProfile?.gstNumber || '';
  const sellerAddress =
    [
      matchedWh?.address || sellerProfile?.address,
      matchedWh?.city || sellerProfile?.city,
      matchedWh?.state || sellerProfile?.state,
      matchedWh?.pincode || sellerProfile?.pincode,
    ]
      .filter(Boolean)
      .join(', ') || order.pickupLocation || 'Registered Pickup Warehouse';

  const sellerState = (matchedWh?.state || sellerProfile?.state || '').trim().toLowerCase();
  const receiverState = (order.receiverState || '').trim().toLowerCase();
  const isInterState = Boolean(sellerState && receiverState && sellerState !== receiverState);

  const itemsHtml =
    order.items && order.items.length > 0
      ? order.items
          .map(
            (it) =>
              `<div class="row"><span>${escapeHtml(it.name)} × ${it.quantity}</span><span>${formatInr(
                (it.price * it.quantity) / 1.18
              )}</span></div>`
          )
          .join('')
      : `<div class="row"><span>${escapeHtml(order.itemName || 'Parcel')} × ${
          order.itemQuantity || 1
        }</span><span>${formatInr(base)}</span></div>`;

  return `
    <div class="card">
      ${
        showLabel
          ? `<div class="header">
              <div>
                <div class="courier">${escapeHtml(order.courierPartner || 'SwiftShip Express')}</div>
                <div class="muted">Order: <strong>${escapeHtml(order.orderNumber)}</strong></div>
              </div>
              <div class="right">
                <div class="mode">${isCod ? 'COD' : 'PREPAID'}</div>
                ${isCod ? `<div class="cod">Collect ${formatInr(order.codAmount || order.orderAmount)}</div>` : ''}
              </div>
            </div>

            <div class="two-col">
              <div>
                <div class="label">DELIVER TO</div>
                <div class="name">${escapeHtml(order.receiverName)}</div>
                <div class="addr">${escapeHtml(
                  [order.receiverAddress, order.receiverCity, order.receiverState, order.receiverPincode]
                    .filter(Boolean)
                    .join(', ')
                )}</div>
                <div class="mono">Ph: ${escapeHtml(order.receiverPhone || '—')}</div>
              </div>
              <div class="ship-from">
                <div class="label">SHIP FROM (RETURN)</div>
                <div class="name">${escapeHtml(sellerName)}</div>
                <div class="addr">${escapeHtml(sellerAddress)}</div>
              </div>
            </div>

            <div class="barcode-box">
              <div class="barcode-bars">|||| ||| || |||| | ||| |||| ||| ||</div>
              <div class="barcode-text">${barcode}</div>
            </div>

            <div class="meta">
              <span>Weight: <strong>${order.weight} kg</strong></span>
              <span>Qty: <strong>${order.itemQuantity || 1}</strong></span>
              <span>Hub: <strong>${escapeHtml(order.pickupLocation || sellerName)}</strong></span>
            </div>`
          : ''
      }

      ${
        showInvoice
          ? `<div class="${showLabel ? 'invoice dashed' : 'invoice'}">
              <div class="row"><strong>TAX INVOICE · INV-${escapeHtml(order.orderNumber)}</strong><span>${escapeHtml(
              sellerName
            )}</span></div>
              <div class="muted" style="margin-bottom:6px;">${
                sellerGstin ? `GSTIN: ${escapeHtml(sellerGstin)}` : 'GSTIN: Not Provided'
              } · Place of Supply: ${escapeHtml(order.receiverState || order.receiverCity || 'India')}</div>
              ${
                !showLabel
                  ? `<div style="margin-bottom:8px;"><strong>Billed To:</strong> ${escapeHtml(
                      order.receiverName
                    )} · ${escapeHtml(
                      [order.receiverAddress, order.receiverCity, order.receiverState, order.receiverPincode]
                        .filter(Boolean)
                        .join(', ')
                    )}</div>`
                  : ''
              }
              ${itemsHtml}
              <div class="row muted"><span>Taxable Subtotal</span><span>${formatInr(base)}</span></div>
              ${
                isInterState
                  ? `<div class="row muted"><span>IGST (18%)</span><span>${formatInr(totalTax)}</span></div>`
                  : `<div class="row muted"><span>CGST (9%)</span><span>${formatInr(cgst)}</span></div>
                     <div class="row muted"><span>SGST (9%)</span><span>${formatInr(sgst)}</span></div>`
              }
              <div class="row total"><span>Grand Total</span><span>${formatInr(order.orderAmount)}</span></div>
              <div class="row muted" style="margin-top:6px;"><span>Computer-generated GST Invoice</span><span>For ${escapeHtml(
                sellerName
              )}</span></div>
            </div>`
          : ''
      }
    </div>
  `;
}

export function buildLabelsHtml(
  orders: Order[],
  companyName: string,
  modeOrIncludeInvoice: boolean | DocumentPrintMode = 'clubbed',
  sellerProfile?: Partial<MerchantProfile> | null,
  warehouses: WarehouseLocation[] = []
): string {
  const mode: DocumentPrintMode =
    typeof modeOrIncludeInvoice === 'boolean'
      ? modeOrIncludeInvoice
        ? 'clubbed'
        : 'label'
      : modeOrIncludeInvoice;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #111827; padding: 16px; }
      .card { border: 2px solid #111827; border-radius: 8px; padding: 14px; margin-bottom: 16px; page-break-inside: avoid; }
      .header { display: flex; justify-content: space-between; border-bottom: 1px solid #111827; padding-bottom: 8px; margin-bottom: 10px; }
      .courier { font-weight: 700; font-size: 13px; text-transform: uppercase; }
      .mode { font-weight: 700; font-size: 14px; text-align: right; }
      .cod { font-weight: 700; font-size: 12px; }
      .two-col { display: flex; justify-content: space-between; gap: 12px; }
      .ship-from { border-left: 1px solid #E5E7EB; padding-left: 10px; max-width: 45%; }
      .label { font-size: 10px; color: #6B7280; font-weight: 600; }
      .name { font-size: 13px; font-weight: 700; margin-top: 2px; }
      .addr { font-size: 11px; margin-top: 2px; color: #374151; }
      .mono { font-family: monospace; font-size: 11px; margin-top: 2px; }
      .muted { font-size: 11px; color: #6B7280; }
      .barcode-box { border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; padding: 10px 0; margin: 10px 0; text-align: center; }
      .barcode-bars { font-family: monospace; font-size: 20px; letter-spacing: 2px; font-weight: 700; }
      .barcode-text { font-family: monospace; font-size: 12px; font-weight: 700; letter-spacing: 3px; margin-top: 4px; }
      .meta { display: flex; justify-content: space-between; font-size: 11px; }
      .invoice { font-size: 11px; }
      .invoice.dashed { border-top: 1px dashed #111827; margin-top: 10px; padding-top: 8px; }
      .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
      .total { font-weight: 700; border-top: 1px solid #E5E7EB; padding-top: 4px; margin-top: 4px; font-size: 12px; }
    </style>
  </head>
  <body>
    ${orders.map((o) => renderSingleDocumentBlock(o, companyName, mode, sellerProfile, warehouses)).join('')}
  </body>
</html>`;
}
