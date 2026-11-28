import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useOrders, useWallet, useCodReconciliation } from '../../hooks/useOrders';
import { useAuth } from '../../lib/auth-store';
import type { OrderStatus } from '../../lib/types';
import { fmtINR } from '../../lib/format';

const { width: SW } = Dimensions.get('window');

const STATUS_COLOR: Partial<Record<OrderStatus, string>> = {
  PROCESSING:        Colors.accent,
  READY_FOR_DISPATCH: Colors.accent,
  PICKED_UP:         Colors.warning,
  IN_TRANSIT:        Colors.warning,
  OUT_FOR_DELIVERY:  Colors.purple,
  DELIVERED:         Colors.success,
  DELIVERY_FAILED:   Colors.error,
  NDR:               Colors.error,
  RTO_INITIATED:     Colors.error,
  RTO_IN_TRANSIT:    Colors.error,
  RTO_DELIVERED:     Colors.fg2,
  CANCELLED:         Colors.fg3,
};

const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PROCESSING:        'Processing',
  READY_FOR_DISPATCH: 'Ready for Dispatch',
  PICKED_UP:         'Picked Up',
  IN_TRANSIT:        'In Transit',
  OUT_FOR_DELIVERY:  'Out for Delivery',
  DELIVERED:         'Delivered',
  DELIVERY_FAILED:   'Failed',
  NDR:               'NDR',
  RTO_INITIATED:     'RTO Initiated',
  RTO_IN_TRANSIT:    'RTO In Transit',
  RTO_DELIVERED:     'RTO Delivered',
  CANCELLED:         'Cancelled',
};

function RecentOrderRow({ order, onPress }: { order: any; onPress: () => void }) {
  const color = STATUS_COLOR[order.status as OrderStatus] ?? Colors.fg2;
  const label = STATUS_LABEL[order.status as OrderStatus] ?? (order.status ?? '').replace(/_/g, ' ');
  const amount = order.codAmount ?? order.orderValue ?? 0;
  return (
    <TouchableOpacity style={s.recentRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.recentDot, { backgroundColor: color }]} />
      <View style={s.recentInfo}>
        <Text style={s.recentNum} numberOfLines={1}>#{order.orderNumber}</Text>
        <Text style={s.recentTo} numberOfLines={1}>{order.receiverName}  ·  {order.receiverCity}</Text>
      </View>
      <View style={s.recentRight}>
        <View style={[s.recentBadge, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
          <Text style={[s.recentBadgeTxt, { color }]}>{label}</Text>
        </View>
        {amount > 0 ? <Text style={s.recentAmt}>₹{fmtINR(amount)}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { name, userId, walletBalance } = useAuth();
  const { data: orders, refetch, isRefetching, isError: ordersError } = useOrders();
  const { data: wallet } = useWallet(userId);
  const { data: codItems } = useCodReconciliation();

  useEffect(() => {
    if (wallet?.balance !== undefined) {
      useAuth.setState({ walletBalance: wallet.balance });
    }
  }, [wallet?.balance]);

  const o = orders ?? [];
  const counts = {
    new:       o.filter(x => x.status === 'PROCESSING' || x.status === 'READY_FOR_DISPATCH').length,
    inTransit: o.filter(x => x.status === 'IN_TRANSIT' || x.status === 'PICKED_UP').length,
    delivered: o.filter(x => x.status === 'DELIVERED').length,
    ndr:       o.filter(x => x.status === 'DELIVERY_FAILED' || x.status === 'NDR').length,
    rto:       o.filter(x => x.status?.startsWith('RTO') ?? false).length,
    total:     o.length,
  };
  const bal    = wallet?.balance ?? walletBalance;
  const codDue = (codItems ?? []).filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0);
  const recent = o.slice(0, 6);

  return (
    <SafeAreaView style={s.safe}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={Colors.accent} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={s.topBar}>
          <View>
            <Text style={s.greetTxt}>{name} · Admin</Text>
            <Text style={s.nameTxt}>Shipment Overview</Text>
          </View>
          <View style={s.topActions}>
            <TouchableOpacity style={s.qaSecBtn} onPress={() => router.push('/account/sub-store')} activeOpacity={0.85}>
              <Text style={s.qaSecTxt}>🏪 Channels</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.qaPrimBtn} onPress={() => router.push('/create-shipment')} activeOpacity={0.85}>
              <Text style={s.qaPrimTxt}>+ Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* API error banner */}
        {ordersError && (
          <TouchableOpacity style={s.errorBanner} onPress={() => { refetch(); }} activeOpacity={0.8}>
            <Text style={s.errorBannerTxt}>Could not load orders — tap to retry</Text>
          </TouchableOpacity>
        )}

        {/* NDR alert */}
        {counts.ndr > 0 && (
          <TouchableOpacity style={s.alertBanner} onPress={() => router.push('/(tabs)/orders')} activeOpacity={0.8}>
            <View style={s.alertIconBox}><Text style={{ fontSize: 16 }}>⚠️</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>{counts.ndr} Delivery {counts.ndr === 1 ? 'Failure' : 'Failures'} Need Attention</Text>
              <Text style={s.alertSub}>Tap to review NDR orders and re-attempt delivery</Text>
            </View>
            <Text style={s.alertChev}>›</Text>
          </TouchableOpacity>
        )}

        {/* Stat cards grid */}
        <View style={s.metricsGrid}>
          <TouchableOpacity style={s.statCard} onPress={() => router.push('/(tabs)/orders')} activeOpacity={0.75}>
            <Text style={s.statLbl}>Total Orders</Text>
            <Text style={[s.statVal, { color: Colors.accent }]}>{counts.total}</Text>
            <Text style={s.statHint}>View orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => router.push('/(tabs)/orders')} activeOpacity={0.75}>
            <Text style={s.statLbl}>Pending Pickup</Text>
            <Text style={[s.statVal, { color: Colors.warning }]}>{counts.new}</Text>
            <Text style={s.statHint}>Awaiting pickup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => router.push('/(tabs)/orders')} activeOpacity={0.75}>
            <Text style={s.statLbl}>In Transit</Text>
            <Text style={[s.statVal, { color: Colors.accent }]}>{counts.inTransit}</Text>
            <Text style={s.statHint}>Currently moving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => router.push('/(tabs)/orders')} activeOpacity={0.75}>
            <Text style={s.statLbl}>NDR &amp; RTO Alerts</Text>
            <Text style={[s.statVal, { color: Colors.error }]}>{counts.ndr + counts.rto}</Text>
            <Text style={s.statHint}>Needs attention</Text>
          </TouchableOpacity>
          {/* Wallet — full width */}
          <TouchableOpacity style={[s.statCard, s.statCardFull]} onPress={() => router.push('/(tabs)/wallet')} activeOpacity={0.75}>
            <View style={s.walletRow}>
              <View>
                <Text style={s.statLbl}>Wallet Balance</Text>
                <Text style={[s.statVal, { color: Colors.fg, fontVariant: ['tabular-nums'] }]}>₹{fmtINR(bal)}</Text>
                <Text style={[s.statHint, { color: Colors.success }]}>{codDue > 0 ? `COD Due: ₹${fmtINR(codDue)}` : 'Tap to view wallet'}</Text>
              </View>
              <TouchableOpacity style={s.codBtn} onPress={() => router.push('/pending-payouts')} activeOpacity={0.8}>
                <Text style={s.codBtnTxt}>COD Reconciliation</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent orders */}
        {recent.length > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionHead}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={s.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.recentCard}>
              {recent.map(order => (
                <RecentOrderRow
                  key={order.id}
                  order={order}
                  onPress={() => router.push(`/order/${order.id}`)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },

  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 8 },
  greetTxt:       { fontSize: 11, color: Colors.fg2, marginBottom: 2 },
  nameTxt:        { fontSize: 22, fontWeight: '800', color: Colors.fg, letterSpacing: -0.3 },
  topActions:     { flexDirection: 'row', gap: 6, marginTop: 4, flexShrink: 0 },

  alertBanner:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 10, backgroundColor: '#FFF5F5', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  alertIconBox:   { width: 34, height: 34, borderRadius: 9, backgroundColor: Colors.errorDim, alignItems: 'center', justifyContent: 'center' },
  alertTitle:     { fontSize: 12, fontWeight: '700', color: Colors.error, marginBottom: 1 },
  alertSub:       { fontSize: 10, color: Colors.fg2 },
  alertChev:      { fontSize: 20, color: Colors.error },

  qaPrimBtn:      { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  qaPrimTxt:      { color: '#fff', fontSize: 12, fontWeight: '700' },
  qaSecBtn:       { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  qaSecTxt:       { fontSize: 12, color: Colors.fg2, fontWeight: '600' },

  metricsGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  statCard:       { width: (SW - 40) / 2, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.border },
  statCardFull:   { width: SW - 32 },
  statLbl:        { fontSize: 10, color: Colors.fg2, fontWeight: '500' },
  statVal:        { fontSize: 24, fontWeight: '800', marginTop: 2 },
  statHint:       { fontSize: 10, color: Colors.accent, marginTop: 2, fontWeight: '500' },
  walletRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  codBtn:         { backgroundColor: Colors.bg, borderRadius: 9, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 7, flexShrink: 0 },
  codBtnTxt:      { fontSize: 10, fontWeight: '600', color: Colors.fg2 },

  sectionHead:    { fontSize: 13, fontWeight: '700', color: Colors.fg, letterSpacing: -0.1 },
  sectionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  seeAll:         { fontSize: 13, color: Colors.accent, fontWeight: '600' },

  errorBanner:    { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.errorDim, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${Colors.error}30`, alignItems: 'center' },
  errorBannerTxt: { fontSize: 13, color: Colors.error, fontWeight: '600' },

  recentCard:     { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  recentRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recentDot:      { width: 4, height: 36, borderRadius: 2 },
  recentInfo:     { flex: 1 },
  recentNum:      { fontSize: 12, fontWeight: '700', color: Colors.fg, marginBottom: 2 },
  recentTo:       { fontSize: 10, color: Colors.fg2 },
  recentRight:    { alignItems: 'flex-end', gap: 4 },
  recentBadge:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  recentBadgeTxt: { fontSize: 9, fontWeight: '700' },
  recentAmt:      { fontSize: 11, fontWeight: '700', color: Colors.fg },
});

