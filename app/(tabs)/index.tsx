import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Dimensions, Modal, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useOrders, useWallet } from '../../hooks/useOrders';
import { useAuth } from '../../lib/auth-store';
import { api } from '../../lib/api';
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

function BankPromptModal({ visible, onAddBank, onLater }: {
  visible: boolean; onAddBank: () => void; onLater: () => void;
}) {
  const scale   = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[bs.overlay, { opacity }]}>
        <Animated.View style={[bs.card, { transform: [{ scale }] }]}>
          <View style={bs.iconCircle}>
            <Text style={bs.iconTxt}>!</Text>
          </View>
          <Text style={bs.title}>Bank Account Required</Text>
          <Text style={bs.body}>
            To receive COD settlements and wallet withdrawals, please link your bank account.{'\n\n'}
            Without this, payouts cannot be processed to you.
          </Text>
          <TouchableOpacity style={bs.primaryBtn} onPress={onAddBank} activeOpacity={0.85}>
            <Text style={bs.primaryBtnTxt}>ADD BANK ACCOUNT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={bs.secondaryBtn} onPress={onLater}>
            <Text style={bs.secondaryBtnTxt}>Remind me later</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function MetricCard({ value, label, color, sublabel, onPress }: {
  value: string | number; label: string; color: string; sublabel?: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[s.metricCard, { borderLeftColor: color, borderLeftWidth: 3 }]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[s.metricVal, { color }]}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
      {sublabel ? <Text style={s.metricSub}>{sublabel}</Text> : null}
    </TouchableOpacity>
  );
}

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

  // Keep Zustand wallet balance in sync so Account screen stays fresh
  useEffect(() => {
    if (wallet?.balance !== undefined) {
      useAuth.setState({ walletBalance: wallet.balance });
    }
  }, [wallet?.balance]);
  const [showBankPrompt, setShowBankPrompt] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api.get(`/api/merchant/bank-details/${userId}`)
      .then(r => {
        if (cancelled) return;
        const d = r.data;
        const hasBank = d?.accountNumber && String(d.accountNumber).length > 4;
        if (!hasBank) setShowBankPrompt(true);
      })
      .catch(() => { if (!cancelled) setShowBankPrompt(true); });
    return () => { cancelled = true; };
  }, [userId]);

  const o = orders ?? [];
  const counts = {
    new:       o.filter(x => x.status === 'PROCESSING' || x.status === 'READY_FOR_DISPATCH').length,
    inTransit: o.filter(x => x.status === 'IN_TRANSIT' || x.status === 'PICKED_UP').length,
    ofd:       o.filter(x => x.status === 'OUT_FOR_DELIVERY').length,
    delivered: o.filter(x => x.status === 'DELIVERED').length,
    ndr:       o.filter(x => x.status === 'DELIVERY_FAILED' || x.status === 'NDR').length,
    rto:       o.filter(x => x.status?.startsWith('RTO') ?? false).length,
    total:     o.length,
  };
  const bal          = wallet?.balance ?? walletBalance;
  const deliveryRate = counts.total > 0 ? Math.round((counts.delivered / counts.total) * 100) : 0;
  const recent       = o.slice(0, 6);

  const greeting = getGreeting();
  const firstName = name.split(' ')[0] ?? name;

  return (
    <SafeAreaView style={s.safe}>
      <BankPromptModal
        visible={showBankPrompt}
        onAddBank={() => { setShowBankPrompt(false); router.push('/account/bank'); }}
        onLater={() => setShowBankPrompt(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={Colors.accent} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Top header */}
        <View style={s.topBar}>
          <View>
            <Text style={s.greetTxt}>{greeting},</Text>
            <Text style={s.nameTxt}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity style={s.avatar} onPress={() => router.push('/account/details')}>
            <Text style={s.avatarTxt}>{name[0]?.toUpperCase() ?? '?'}</Text>
          </TouchableOpacity>
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

        {/* Wallet + delivery card */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroLbl}>Wallet Balance</Text>
              <Text style={s.heroBal}>₹{fmtINR(bal)}</Text>
            </View>
            <View style={s.heroRateBox}>
              <Text style={s.heroRateNum}>{deliveryRate}%</Text>
              <Text style={s.heroRateLbl}>Delivery Rate</Text>
            </View>
          </View>
          <View style={s.heroStatsRow}>
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{counts.total}</Text>
              <Text style={s.heroStatLbl}>Total</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={[s.heroStatNum, { color: Colors.warning }]}>{counts.inTransit}</Text>
              <Text style={s.heroStatLbl}>In Transit</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={[s.heroStatNum, { color: Colors.success }]}>{counts.delivered}</Text>
              <Text style={s.heroStatLbl}>Delivered</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={[s.heroStatNum, { color: Colors.error }]}>{counts.ndr}</Text>
              <Text style={s.heroStatLbl}>NDR</Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={s.qaBtns}>
          <TouchableOpacity style={s.qaPrimBtn} onPress={() => router.push('/create-shipment')} activeOpacity={0.85}>
            <Text style={s.qaPrimTxt}>+ New Shipment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qaSecBtn} onPress={() => router.push('/(tabs)/orders')} activeOpacity={0.85}>
            <Text style={s.qaSecTxt}>All Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qaSecBtn} onPress={() => router.push('/manage-couriers')} activeOpacity={0.85}>
            <Text style={s.qaSecTxt}>Couriers</Text>
          </TouchableOpacity>
        </View>

        {/* Status metrics grid — 2-column */}
        <View style={s.sectionRow}>
          <Text style={s.sectionHead}>Shipment Overview</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
            <Text style={s.seeAll}>View all →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.metricsGrid}>
          <MetricCard value={counts.new}       label="New Orders"   color={Colors.accent}  onPress={() => router.push('/(tabs)/orders')} />
          <MetricCard value={counts.inTransit} label="In Transit"   color={Colors.warning} onPress={() => router.push('/(tabs)/orders')} />
          <MetricCard value={counts.ofd}       label="Out for Del." color={Colors.purple}  onPress={() => router.push('/(tabs)/orders')} />
          <MetricCard value={counts.delivered} label="Delivered"    color={Colors.success} onPress={() => router.push('/(tabs)/orders')} />
          <MetricCard value={counts.ndr}       label="NDR / Failed" color={Colors.error}   onPress={() => router.push('/(tabs)/orders')} />
          <MetricCard value={counts.rto}       label="RTO"          color={Colors.fg2}     onPress={() => router.push('/(tabs)/orders')} />
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },

  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  greetTxt:       { fontSize: 13, color: Colors.fg2, marginBottom: 2 },
  nameTxt:        { fontSize: 22, fontWeight: '800', color: Colors.fg },
  avatar:         { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
  avatarTxt:      { color: '#fff', fontWeight: '800', fontSize: 17 },

  alertBanner:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 14, backgroundColor: '#FFF5F5', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#FECaCa' },
  alertIconBox:   { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.errorDim, alignItems: 'center', justifyContent: 'center' },
  alertTitle:     { fontSize: 13, fontWeight: '700', color: Colors.error, marginBottom: 2 },
  alertSub:       { fontSize: 11, color: Colors.fg2 },
  alertChev:      { fontSize: 22, color: Colors.error },

  heroCard:       { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1A2744', borderRadius: 22, padding: 20, shadowColor: '#1A2744', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroLbl:        { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  heroBal:        { fontSize: 30, fontWeight: '800', color: '#fff' },
  heroRateBox:    { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12, alignItems: 'center' },
  heroRateNum:    { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroRateLbl:    { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  heroStatsRow:   { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 },
  heroStat:       { flex: 1, alignItems: 'center' },
  heroStatNum:    { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroStatLbl:    { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  heroStatDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

  qaBtns:         { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  qaPrimBtn:      { flex: 2, backgroundColor: Colors.accent, borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  qaPrimTxt:      { color: '#fff', fontSize: 14, fontWeight: '700' },
  qaSecBtn:       { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  qaSecTxt:       { fontSize: 13, color: Colors.fg2, fontWeight: '600' },

  sectionHead:    { fontSize: 13, fontWeight: '700', color: Colors.fg, letterSpacing: -0.1 },
  sectionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  seeAll:         { fontSize: 13, color: Colors.accent, fontWeight: '600' },

  metricsGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  metricCard:     { width: (SW - 42) / 2, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border },
  metricVal:      { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  metricLabel:    { fontSize: 11, color: Colors.fg2, fontWeight: '500' },
  metricSub:      { fontSize: 10, color: Colors.fg3, marginTop: 2 },

  errorBanner:    { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.errorDim, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${Colors.error}30`, alignItems: 'center' },
  errorBannerTxt: { fontSize: 13, color: Colors.error, fontWeight: '600' },

  recentCard:     { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  recentRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recentDot:      { width: 4, height: 42, borderRadius: 2 },
  recentInfo:     { flex: 1 },
  recentNum:      { fontSize: 13, fontWeight: '700', color: Colors.fg, marginBottom: 3 },
  recentTo:       { fontSize: 11, color: Colors.fg2 },
  recentRight:    { alignItems: 'flex-end', gap: 5 },
  recentBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  recentBadgeTxt: { fontSize: 10, fontWeight: '700' },
  recentAmt:      { fontSize: 12, fontWeight: '700', color: Colors.fg },
});

const bs = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:           { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center' },
  iconCircle:     { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF3CD', borderWidth: 2, borderColor: '#FFC107', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconTxt:        { fontSize: 32, fontWeight: '900', color: '#D97706' },
  title:          { fontSize: 20, fontWeight: '800', color: '#0D0D1A', textAlign: 'center', marginBottom: 12 },
  body:           { fontSize: 14, color: '#6B6B8A', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  primaryBtn:     { width: '100%', backgroundColor: '#0D0D1A', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  primaryBtnTxt:  { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  secondaryBtn:   { padding: 10 },
  secondaryBtnTxt:{ color: '#6B6B8A', fontSize: 14 },
});
