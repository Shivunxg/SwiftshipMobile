import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useApproveOrder } from '../hooks/useOrders';
import type { Order, OrderStatus } from '../lib/types';

interface Props { order: Order; onContact: (order: Order) => void; }

const STATUS_META: Record<string, { label: string; color: string }> = {
  ORDER_CREATED:   { label: 'Created',          color: Colors.accent  },
  AWAITING_PICKUP: { label: 'Awaiting Pickup',  color: Colors.accent  },
  PICKED_UP:       { label: 'Picked Up',        color: Colors.warning },
  IN_TRANSIT:      { label: 'In Transit',       color: Colors.warning },
  OUT_FOR_DELIVERY:{ label: 'Out for Delivery', color: Colors.purple  },
  DELIVERED:       { label: 'Delivered',        color: Colors.success },
  DELIVERY_FAILED: { label: 'Failed',           color: Colors.error   },
  NDR:             { label: 'NDR',              color: Colors.error   },
  RTO_INITIATED:   { label: 'RTO Initiated',    color: Colors.error   },
  RTO_IN_TRANSIT:  { label: 'RTO In Transit',   color: Colors.error   },
  RTO_DELIVERED:   { label: 'RTO Delivered',    color: Colors.fg2     },
  CANCELLED:       { label: 'Cancelled',        color: Colors.fg3     },
};
const getMeta = (status: OrderStatus) =>
  STATUS_META[status] ?? { label: status, color: Colors.fg2 };

export function OrderCard({ order, onContact }: Props) {
  const router      = useRouter();
  const approveMut  = useApproveOrder();
  const meta        = getMeta(order.status);
  const amount      = order.codAmount ?? order.orderValue ?? 0;
  const isCOD       = order.paymentMethod === 'COD';
  const isNDR       = order.status === 'DELIVERY_FAILED' || order.status === 'NDR';
  const isPending   = order.status === 'ORDER_CREATED';

  const handleApprove = () => Alert.alert(
    'Approve Order',
    `Approve order ${order.orderNumber}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => approveMut.mutate(order.id) },
    ]
  );

  const dateStr = (() => {
    const raw = order.createdAt ?? order.placedAt ?? order.date;
    if (!raw) return '';
    return new Date(raw).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  })();

  return (
    <TouchableOpacity
      style={[s.card, isNDR && s.cardNDR]}
      onPress={() => router.push(`/order/${order.id}`)}
      activeOpacity={0.75}
    >
      {/* Left accent bar */}
      <View style={[s.bar, { backgroundColor: meta.color }]} />

      <View style={s.body}>
        {/* Row 1 — ID + status */}
        <View style={s.row1}>
          <View style={{ flex: 1 }}>
            <Text style={s.orderNum}>{order.orderNumber}</Text>
            {order.awbNumber ? <Text style={s.awb}>{order.awbNumber}</Text> : null}
          </View>
          <View style={[s.badge, { backgroundColor: `${meta.color}15`, borderColor: `${meta.color}40` }]}>
            <View style={[s.dot, { backgroundColor: meta.color }]} />
            <Text style={[s.badgeTxt, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* Row 2 — item + amount */}
        <View style={s.row2}>
          <Text style={s.itemName} numberOfLines={1}>{order.itemContents ?? 'Shipment'}</Text>
          <View style={s.amtRow}>
            {isCOD && <View style={s.codTag}><Text style={s.codTxt}>COD</Text></View>}
            <Text style={s.amt}>₹{amount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Row 3 — destination */}
        <View style={s.row3}>
          <Text style={s.destTxt} numberOfLines={1}>
            {order.receiverName}  ·  {order.receiverCity}{order.receiverState ? `, ${order.receiverState}` : ''}
          </Text>
          {order.courierPartner ? <Text style={s.courier}>{order.courierPartner}</Text> : null}
        </View>

        {/* NDR reason */}
        {isNDR && order.ndrReason ? (
          <View style={s.ndrRow}>
            <Text style={s.ndrTxt}>{order.ndrReason}</Text>
          </View>
        ) : null}

        {/* Row 4 — date + actions */}
        <View style={s.row4}>
          <Text style={s.date}>{dateStr}</Text>
          <View style={s.actions}>
            {isPending ? (
              <TouchableOpacity
                style={[s.actionBtn, { borderColor: Colors.success, backgroundColor: Colors.successDim }]}
                onPress={handleApprove}
                disabled={approveMut.isPending}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[s.actionTxt, { color: Colors.success }]}>
                  {approveMut.isPending ? '...' : 'Approve Order'}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[s.actionBtn, { borderColor: Colors.success }]}
                  onPress={() => onContact(order)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[s.actionTxt, { color: Colors.success }]}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, { borderColor: Colors.accent }]}
                  onPress={() => Linking.openURL(`tel:+91${order.receiverPhone}`)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[s.actionTxt, { color: Colors.accent }]}>Call</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:     { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardNDR:  { borderColor: '#FECaCa' },
  bar:      { width: 4 },
  body:     { flex: 1, padding: 13, gap: 8 },
  row1:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNum: { fontSize: 13, fontWeight: '700', color: Colors.fg, marginBottom: 2 },
  awb:      { fontSize: 10, color: Colors.fg3, fontFamily: 'monospace' },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  dot:      { width: 5, height: 5, borderRadius: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  row2:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.fg, marginRight: 8 },
  amtRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amt:      { fontSize: 15, fontWeight: '800', color: Colors.fg },
  codTag:   { backgroundColor: Colors.warningDim, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: `${Colors.warning}30` },
  codTxt:   { fontSize: 10, fontWeight: '700', color: Colors.warning },
  row3:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  destTxt:  { flex: 1, fontSize: 11, color: Colors.fg2 },
  courier:  { fontSize: 10, color: Colors.fg3, fontWeight: '600', marginLeft: 8 },
  ndrRow:   { backgroundColor: '#FFF5F5', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#FECaCa' },
  ndrTxt:   { fontSize: 11, color: Colors.error },
  row4:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  date:     { fontSize: 10, color: Colors.fg3 },
  actions:  { flexDirection: 'row', gap: 8 },
  actionBtn:{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  actionTxt:{ fontSize: 11, fontWeight: '600' },
});
