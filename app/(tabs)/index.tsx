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

const { width: SW } = Dimensions.get('window');

const STATUS_COLOR: Partial<Record<OrderStatus, string>> = {
  ORDER_CREATED:    Colors.accent,
  AWAITING_PICKUP:  Colors.accent,
  PICKED_UP:        Colors.warning,
  IN_TRANSIT:       Colors.warning,
  OUT_FOR_DELIVERY: Colors.purple,
  DELIVERED:        Colors.success,
  DELIVERY_FAILED:  Colors.error,
  NDR:              Colors.error,
  RTO_INITIATED:    Colors.error,
  RTO_IN_TRANSIT:   Colors.error,
  RTO_DELIVERED:    Colors.fg2,
  CANCELLED:        Colors.fg3,
};
const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  ORDER_CREATED:    'Created',
  AWAITING_PICKUP:  'Awaiting',
  PICKED_UP:        'Picked Up',
  IN_TRANSIT:       'In Transit',
  OUT_FOR_DELIVERY: 'Out for Del.',
  DELIVERED:        'Delivered',
  DELIVERY_FAILED:  'Failed',
  NDR:              'NDR',
  RTO_INITIATED:    'RTO Init.',
  RTO_IN_TRANSIT:   'RTO Transit',
  RTO_DELIVERED:    'RTO Done',
  CANCELLED:        'Cancelled',
};

// ── Bank prompt modal ─────────────────────────────────────────────────────────
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

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max  = Math.max(...values, 1);
  const BAR_H = 32;
  const barW  = Math.floor((SW - 80) / values.length) - 3;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: BAR_H }}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            width: barW,
            height: Math.max(3, Math.round((v / max) * BAR_H)),
            borderRadius: 3,
            backgroundColor: i === values.length - 1 ? color : `${color}44`,
          }}
        />
      ))}
    </View>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ value, label, color, onPress }: {
  value: number; label: string; color: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[s.tile, { borderTopColor: color }]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[s.tileVal, { color }]}>{value}</Text>
      <Text style={s.tileLbl}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Recent row ────────────────────────────────────────────────────────────────
function RecentRow({ order, onPress }: { order: any; onPress: () => void }) {
  const color = STATUS_COLOR[order.status as OrderStatus] ?? Colors.fg2;
  const label = STATUS_LABEL[order.status as OrderStatus] ?? order.status;
  return (
    <TouchableOpacity style={s.recentRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.recentBar, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.recentId}>{order.orderNumber}</Text>
        <Text style={s.recentDest} numberOfLines={1}>
          {order.receiverName}  ·  {order.receiverCity}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[s.recentBadge, { borderColor: `${color}44`, backgroundColor: `${color}12` }]}>
          <Text style={[s.recentBadgeTxt, { color }]}>{label}</Text>
        </View>
        <Text style={s.recentAmt}>₹{order.orderValue ?? order.codAmount ?? 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const { name, userId, walletBalance } = useAuth();
  const { data: orders, refetch, isRefetching } = useOrders();
  const { data: wallet } = useWallet(userId);
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
    new:       o.filter(x => x.status === 'ORDER_CREATED' || x.status === 'AWAITING_PICKUP').length,
    inTransit: o.filter(x => x.status === 'IN_TRANSIT' || x.status === 'PICKED_UP').length,
    ofd:       o.filter(x => x.status === 'OUT_FOR_DELIVERY').length,
    delivered: o.filter(x => x.status === 'DELIVERED').length,
    ndr:       o.filter(x => x.status === 'DELIVERY_FAILED' || x.status === 'NDR').length,
    rto:       o.filter(x => x.status.startsWith('RTO')).length,
    total:     o.length,
  };
  const bal          = wallet?.balance ?? walletBalance;
  const deliveryRate = counts.total > 0 ? Math.round((counts.delivered / counts.total) * 100) : 0;
  const recent       = o.slice(0, 5);
  const trend        = [counts.inTransit, counts.new, counts.ofd, counts.delivered, counts.ndr, counts.rto, counts.total];
  const today        = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

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
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good {getTimeOfDay()}</Text>
            <Text style={s.name}>{name}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.dateChip}>{today}</Text>
            <TouchableOpacity style={s.av} onPress={() => router.push('/account/details')}>
              <Text style={s.avTxt}>{name[0]?.toUpperCase() ?? '?'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet card */}
        <View style={s.walletCard}>
          <View style={s.walletLeft}>
            <Text style={s.walletLbl}>Wallet Balance</Text>
            <Text style={s.walletBal}>₹{bal.toLocaleString('en-IN')}</Text>
            <View style={s.rateChip}>
              <Text style={s.rateChipTxt}>{deliveryRate}% delivery rate</Text>
            </View>
          </View>
          <View style={s.walletRight}>
            <Sparkline values={trend} color={Colors.success} />
            <Text style={s.sparkLbl}>7-day activity</Text>
          </View>
        </View>

        {/* NDR alert */}
        {counts.ndr > 0 && (
          <TouchableOpacity style={s.alertBanner} onPress={() => router.push('/(tabs)/orders')} activeOpacity={0.8}>
            <View style={s.alertDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>{counts.ndr} Delivery {counts.ndr === 1 ? 'Failure' : 'Failures'} Need Attention</Text>
              <Text style={s.alertSub}>Tap to review NDR orders and re-attempt</Text>
            </View>
            <Text style={s.alertChev}>›</Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <Text style={s.sectionHead}>Shipment Overview</Text>
        <View style={s.tileGrid}>
          <StatTile value={counts.new}       label="New"        color={Colors.accent}  onPress={() => router.push('/(tabs)/orders')} />
          <StatTile value={counts.inTransit} label="In Transit" color={Colors.warning} onPress={() => router.push('/(tabs)/orders')} />
          <StatTile value={counts.ofd}       label="Out for Del." color={Colors.purple} onPress={() => router.push('/(tabs)/orders')} />
          <StatTile value={counts.delivered} label="Delivered"  color={Colors.success} onPress={() => router.push('/(tabs)/orders')} />
          <StatTile value={counts.ndr}       label="NDR"        color={Colors.error}   onPress={() => router.push('/(tabs)/orders')} />
          <StatTile value={counts.rto}       label="RTO"        color={Colors.fg2}     onPress={() => router.push('/(tabs)/orders')} />
        </View>

        {/* Quick actions */}
        <Text style={s.sectionHead}>Quick Actions</Text>
        <View style={s.qaRow}>
          <TouchableOpacity style={s.qaPrimary} activeOpacity={0.85} onPress={() => router.push('/create-shipment')}>
            <Text style={s.qaPrimaryTxt}>+ Create Shipment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qaSecondary} onPress={() => router.push('/(tabs)/orders')}>
            <Text style={s.qaSecTxt}>All Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qaSecondary} onPress={() => router.push('/(tabs)/wallet')}>
            <Text style={s.qaSecTxt}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Recent orders */}
        {recent.length > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionHead}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={s.recentCard}>
              {recent.map(order => (
                <RecentRow key={order.id} order={order} onPress={() => router.push(`/order/${order.id}`)} />
              ))}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const TILE_W = (SW - 48) / 3;

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  greeting:       { fontSize: 12, color: Colors.fg2, marginBottom: 2 },
  name:           { fontSize: 20, fontWeight: '700', color: Colors.fg },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateChip:       { fontSize: 11, color: Colors.fg2, backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  av:             { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avTxt:          { color: '#fff', fontWeight: '800', fontSize: 15 },

  walletCard:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.accent, borderRadius: 20, padding: 18, gap: 16 },
  walletLeft:     { flex: 1 },
  walletLbl:      { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 6 },
  walletBal:      { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 10 },
  rateChip:       { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  rateChipTxt:    { fontSize: 11, fontWeight: '600', color: '#fff' },
  walletRight:    { alignItems: 'flex-end', gap: 6 },
  sparkLbl:       { fontSize: 10, color: 'rgba(255,255,255,0.5)' },

  alertBanner:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFF5F5', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FECACa' },
  alertDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  alertTitle:     { fontSize: 13, fontWeight: '600', color: Colors.error, marginBottom: 2 },
  alertSub:       { fontSize: 11, color: Colors.fg2 },
  alertChev:      { fontSize: 20, color: Colors.error },

  sectionHead:    { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 16, marginBottom: 10, marginTop: 6 },
  sectionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 },
  seeAll:         { fontSize: 12, color: Colors.accent, fontWeight: '600' },

  tileGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  tile:           { width: TILE_W, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tileVal:        { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  tileLbl:        { fontSize: 11, color: Colors.fg2, fontWeight: '500' },

  qaRow:          { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  qaPrimary:      { flex: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.accent, borderRadius: 14, padding: 14 },
  qaPrimaryTxt:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  qaSecondary:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.border },
  qaSecTxt:       { fontSize: 12, color: Colors.fg2, fontWeight: '600' },

  recentCard:     { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  recentRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recentBar:      { width: 3, height: 40, borderRadius: 2 },
  recentId:       { fontSize: 12, fontWeight: '700', color: Colors.fg, marginBottom: 3 },
  recentDest:     { fontSize: 11, color: Colors.fg2 },
  recentBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  recentBadgeTxt: { fontSize: 10, fontWeight: '700' },
  recentAmt:      { fontSize: 12, fontWeight: '600', color: Colors.fg },
});

const bs = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:           { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 20 },
  iconCircle:     { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF3CD', borderWidth: 2, borderColor: '#FFC107', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconTxt:        { fontSize: 32, fontWeight: '900', color: '#D97706' },
  title:          { fontSize: 20, fontWeight: '800', color: '#0D0D1A', textAlign: 'center', marginBottom: 12 },
  body:           { fontSize: 14, color: '#6B6B8A', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  primaryBtn:     { width: '100%', backgroundColor: '#0D0D1A', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  primaryBtnTxt:  { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  secondaryBtn:   { padding: 10 },
  secondaryBtnTxt:{ color: '#6B6B8A', fontSize: 14 },
});
