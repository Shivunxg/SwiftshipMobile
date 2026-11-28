import React, { useMemo, useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface TrackingOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: 'COD' | 'PREPAID';
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverState: string;
  receiverPincode: string;
  pickupLocation: string;
  awbNumber: string;
  courierPartner: string;
  freightCharge: number;
  codAmount: number;
  orderAmount: number;
  weight: number;
  createdAt: string;
}

interface HistoryEvent {
  id: string;
  status: string;
  timestamp: string;
  reason?: string;
  location?: string;
}

const PENDING_PICKUP = new Set([
  'PENDING', 'PLACED', 'CREATED', 'ORDER_CREATED', 'PROCESSING',
  'AWAITING PICKUP', 'AWAITING_PICKUP', 'READY_FOR_PICKUP', 'BOOKED',
  'CONFIRMED', 'MANIFESTED', 'PICKUP_SCHEDULED', 'AWB_ASSIGNED',
]);

const IN_TRANSIT = new Set([
  'IN_TRANSIT', 'IN TRANSIT', 'SHIPPED', 'DISPATCHED',
  'OUT_FOR_DELIVERY', 'OUT FOR DELIVERY', 'PICKED_UP', 'PICKED UP',
]);

function getTrackingUrl(courierPartner?: string, awb?: string): string {
  const c = (courierPartner || '').toUpperCase();
  if (c.includes('AMAZON')) return 'https://track.amazon.in/';
  if (c.includes('INDIA')) return 'https://indiapost.gov.in/tracking.html';
  if (c.includes('EKART')) return 'https://www.ekartlogistics.com/';
  if (c.includes('DELHIVERY')) return awb ? `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}` : 'https://www.delhivery.com/tracking';
  if (c.includes('BLUEDART') || c.includes('BLUE_DART')) return 'https://www.bluedart.com/tracking';
  if (c.includes('MARUTI') || c.includes('DELCAPER')) return 'https://tracking.shreemaruti.com/';
  if (c.includes('BORZO')) return 'https://borzodelivery.com/in/track';
  return '';
}

function mapOrdersList(payload: unknown): TrackingOrder[] {
  const obj = (payload ?? {}) as Record<string, unknown>;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(obj.data) ? obj.data
    : Array.isArray(obj.content) ? obj.content : [];
  return (list as Record<string, unknown>[]).map((raw) => ({
    id: String(raw.id ?? raw.orderId ?? ''),
    orderNumber: String(raw.orderNumber ?? raw.channelOrderId ?? `ORD-${raw.id ?? ''}`),
    status: String(raw.status ?? raw.orderStatus ?? 'PENDING').toUpperCase(),
    paymentMethod: String(raw.paymentMethod ?? 'PREPAID').toUpperCase().includes('COD') ? 'COD' : 'PREPAID',
    receiverName: String(raw.receiverName ?? raw.customerName ?? 'Customer'),
    receiverPhone: String(raw.receiverPhone ?? raw.customerPhone ?? ''),
    receiverAddress: String(raw.receiverAddress ?? raw.address ?? ''),
    receiverCity: String(raw.receiverCity ?? raw.city ?? ''),
    receiverState: String(raw.receiverState ?? raw.state ?? ''),
    receiverPincode: String(raw.receiverPincode ?? raw.pincode ?? ''),
    pickupLocation: String(raw.pickupLocation ?? raw.warehouseName ?? 'Primary Warehouse'),
    awbNumber: String(raw.awbNumber ?? raw.awb ?? ''),
    courierPartner: String(raw.courierPartner ?? raw.courierName ?? ''),
    freightCharge: Number(raw.freightCharge ?? 0),
    codAmount: Number(raw.codAmount ?? 0),
    orderAmount: Number(raw.orderAmount ?? raw.totalAmount ?? 0),
    weight: Number(raw.weight ?? 0.5),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  }));
}

export default function TrackingScreen() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'ALL' | 'PENDING_PICKUP' | 'IN_TRANSIT' | 'DELIVERED'>('ALL');
  const [selectedId, setSelectedId] = useState('');

  const ordersQuery = useQuery<TrackingOrder[]>({
    queryKey: ['tracking-orders'],
    queryFn: async () => {
      const res = await api.get('/api/orders');
      return mapOrdersList(res.data);
    },
  });

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const pendingPickupCount = useMemo(() => orders.filter((o) => PENDING_PICKUP.has(o.status)).length, [orders]);
  const inTransitCount = useMemo(() => orders.filter((o) => IN_TRANSIT.has(o.status)).length, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab === 'PENDING_PICKUP' && !PENDING_PICKUP.has(o.status)) return false;
      if (tab === 'IN_TRANSIT' && !IN_TRANSIT.has(o.status)) return false;
      if (tab === 'DELIVERED' && o.status !== 'DELIVERED' && o.status !== 'COMPLETED') return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.awbNumber.toLowerCase().includes(q) ||
        o.receiverName.toLowerCase().includes(q) ||
        o.receiverCity.toLowerCase().includes(q)
      );
    });
  }, [orders, tab, search]);

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? filtered[0],
    [orders, filtered, selectedId]
  );

  const historyQuery = useQuery<HistoryEvent[]>({
    queryKey: ['order-status-history', activeOrder?.id],
    enabled: Boolean(activeOrder?.id),
    queryFn: async () => {
      const res = await api.get(`/api/orders/${activeOrder?.id}/status-history`);
      const arr = Array.isArray(res.data) ? res.data : (res.data?.data ?? []) as Record<string, unknown>[];
      return (arr as Record<string, unknown>[]).map((item, idx) => ({
        id: String(item.id ?? idx),
        status: String(item.status ?? item.eventType ?? 'UPDATED'),
        timestamp: String(item.timestamp ?? item.createdAt ?? ''),
        reason: String(item.reason ?? item.remark ?? ''),
        location: String(item.location ?? item.city ?? ''),
      }));
    },
  });

  const portalUrl = activeOrder ? getTrackingUrl(activeOrder.courierPartner, activeOrder.awbNumber) : '';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={ordersQuery.isFetching}
          onRefresh={() => { void ordersQuery.refetch(); void historyQuery.refetch(); }}
        />
      }
    >
      <Text style={styles.title}>Track Orders</Text>
      <Text style={styles.sub}>Live shipment progress and courier scan timeline</Text>

      <View style={styles.kpiRow}>
        <TouchableOpacity style={styles.kpiCard} onPress={() => setTab('PENDING_PICKUP')}>
          <Text style={styles.kpiLabel}>Pending Pickup</Text>
          <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{pendingPickupCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard} onPress={() => setTab('IN_TRANSIT')}>
          <Text style={styles.kpiLabel}>In Transit</Text>
          <Text style={[styles.kpiVal, { color: '#3B82F6' }]}>{inTransitCount}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search Order #, AWB, receiver, city..."
      />

      <View style={styles.tabs}>
        {(['ALL', 'PENDING_PICKUP', 'IN_TRANSIT', 'DELIVERED'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'ALL' ? 'All' : t === 'PENDING_PICKUP' ? 'Pending Pickup' : t === 'IN_TRANSIT' ? 'In Transit' : 'Delivered'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeOrder ? (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderNo}>{activeOrder.orderNumber}</Text>
              <Text style={styles.meta}>{activeOrder.receiverName} · {activeOrder.receiverCity || 'Destination'}</Text>
              <Text style={styles.meta}>AWB: {activeOrder.awbNumber || 'Pending'} · {activeOrder.courierPartner || 'Unassigned'}</Text>
            </View>
            <Text style={styles.status}>{activeOrder.status}</Text>
          </View>

          {portalUrl ? (
            <TouchableOpacity style={styles.portalBtn} onPress={() => void Linking.openURL(portalUrl)}>
              <Text style={styles.portalBtnText}>Open Carrier Tracking Portal</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.timeline}>
            {(historyQuery.data && historyQuery.data.length > 0
              ? historyQuery.data
              : [{ id: 'current', status: activeOrder.status, timestamp: activeOrder.createdAt, reason: 'Booked in SwiftShip' }]
            ).map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventStatus}>{ev.status}</Text>
                  <Text style={styles.eventTime}>{ev.timestamp || '—'}</Text>
                  {ev.reason ? <Text style={styles.eventReason}>{ev.reason}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.listCard}>
        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.listRow, activeOrder?.id === item.id && styles.listRowSelected]}
            onPress={() => setSelectedId(item.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.listOrder}>{item.orderNumber}</Text>
              <Text style={styles.listMeta}>{item.receiverName} · {item.awbNumber || 'No AWB'}</Text>
            </View>
            <Text style={styles.listStatus}>{item.status}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280' },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 14 },
  kpiLabel: { fontSize: 12, color: '#6B7280' },
  kpiVal: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  search: { height: 44, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, fontSize: 14 },
  tabs: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tabBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  tabBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  orderNo: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  status: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
  portalBtn: { backgroundColor: '#F5F6FA', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 10, alignItems: 'center' },
  portalBtnText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  timeline: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, gap: 10 },
  eventRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginTop: 5 },
  eventStatus: { fontSize: 12, fontWeight: '700', color: '#111827' },
  eventTime: { fontSize: 11, color: '#6B7280' },
  eventReason: { fontSize: 11, color: '#374151', marginTop: 2 },
  listCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  listRowSelected: { backgroundColor: '#EFF6FF' },
  listOrder: { fontSize: 13, fontWeight: '700', color: '#111827' },
  listMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  listStatus: { fontSize: 11, fontWeight: '600', color: '#3B82F6' },
});
