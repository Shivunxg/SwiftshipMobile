import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { fmtINR, fmtDate } from '../lib/format';
import { usePayouts, useReleasePayoutMutation } from '../hooks/useOrders';
import type { Payout } from '../lib/types';

type ViewMode = 'list' | 'batched';

function addDays(iso: string | null | undefined, days: number): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(d: Date | null): string {
  if (!d) return 'pending';
  try { return d.toISOString().slice(0, 10); } catch (e) { return 'pending'; }
}

function StatusPill({ status }: { status: Payout['status'] }) {
  const isReleased = status === 'PROCESSED' || status === 'CASH_COLLECTED';
  const label = status === 'PROCESSED' ? 'Processed' : status === 'CASH_COLLECTED' ? 'Cash Collected' : 'Pending';
  return (
    <View style={[pill.wrap, isReleased ? pill.released : pill.pending]}>
      <Text style={[pill.txt, isReleased ? pill.relTxt : pill.penTxt]}>
        {label}
      </Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  released: { backgroundColor: Colors.successDim },
  pending:  { backgroundColor: Colors.warningDim },
  txt:      { fontSize: 10, fontWeight: '700' },
  relTxt:   { color: Colors.success },
  penTxt:   { color: Colors.warning },
});

function PayoutRow({ item, onRelease, onDetail }: {
  item: Payout; onRelease: (p: Payout) => void; onDetail: (p: Payout) => void;
}) {
  const expectedDate = isoDate(addDays(item.createdAt, 7));
  return (
    <TouchableOpacity style={pr.row} onPress={() => onDetail(item)} activeOpacity={0.75}>
      <View style={pr.left}>
        <View style={pr.iconBox}>
          <Text style={pr.iconTxt}>₹</Text>
        </View>
      </View>
      <View style={pr.mid}>
        <Text style={pr.orderId}>Order #{item.orderId}</Text>
        <Text style={pr.meta}>Expected: {fmtDate(expectedDate)}</Text>
      </View>
      <View style={pr.right}>
        <Text style={pr.amount}>₹{fmtINR(item.amount)}</Text>
        <StatusPill status={item.status} />
        {item.status === 'PENDING' && (
          <TouchableOpacity style={pr.releaseBtn} onPress={() => onRelease(item)}>
            <Text style={pr.releaseTxt}>Release</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const pr = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, backgroundColor: Colors.surface },
  left:       { flexShrink: 0 },
  iconBox:    { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  iconTxt:    { fontSize: 16, fontWeight: '700', color: Colors.accent },
  mid:        { flex: 1, gap: 4 },
  orderId:    { fontSize: 13, fontWeight: '600', color: Colors.fg },
  meta:       { fontSize: 11, color: Colors.fg2 },
  right:      { alignItems: 'flex-end', gap: 4 },
  amount:     { fontSize: 15, fontWeight: '700', color: Colors.fg },
  releaseBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: `${Colors.accent}30` },
  releaseTxt: { fontSize: 10, fontWeight: '700', color: Colors.accent },
});

function BatchedView({ payouts, onRelease, onDetail }: {
  payouts: Payout[]; onRelease: (p: Payout) => void; onDetail: (p: Payout) => void;
}) {
  const groups = useMemo(() => {
    const g: Record<string, Payout[]> = {};
    payouts.forEach(p => {
      const key = isoDate(addDays(p.createdAt, 7));
      if (!g[key]) g[key] = [];
      g[key].push(p);
    });
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [payouts]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      {groups.map(([date, items]) => {
        const total = items.reduce((s, p) => s + p.amount, 0);
        const isToday = date === isoDate(new Date());
        return (
          <View key={date} style={bv.group}>
            <View style={bv.groupHeader}>
              <View>
                <Text style={bv.dateLabel}>{date === 'pending' ? 'No Date' : fmtDate(date)}</Text>
                <Text style={bv.dateCount}>{items.length} payout{items.length !== 1 ? 's' : ''}</Text>
              </View>
              <View style={bv.groupRight}>
                <Text style={bv.groupTotal}>₹{fmtINR(total)}</Text>
                {isToday && <View style={bv.todayBadge}><Text style={bv.todayTxt}>Today</Text></View>}
              </View>
            </View>
            <View style={bv.card}>
              {items.map((item, i) => (
                <View key={item.id}>
                  <PayoutRow item={item} onRelease={onRelease} onDetail={onDetail} />
                  {i < items.length - 1 && <View style={bv.sep} />}
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const bv = StyleSheet.create({
  group:       { marginHorizontal: 16, marginBottom: 16 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dateLabel:   { fontSize: 14, fontWeight: '700', color: Colors.fg },
  dateCount:   { fontSize: 11, color: Colors.fg2, marginTop: 2 },
  groupRight:  { alignItems: 'flex-end', gap: 4 },
  groupTotal:  { fontSize: 16, fontWeight: '700', color: Colors.accent },
  todayBadge:  { backgroundColor: Colors.accentDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  todayTxt:    { fontSize: 10, fontWeight: '700', color: Colors.accent },
  card:        { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  sep:         { height: 1, backgroundColor: Colors.border },
});

export default function PendingPayoutsScreen() {
  const router = useRouter();
  const { data: payouts, isLoading, refetch, isRefetching } = usePayouts();
  const releaseMut = useReleasePayoutMutation();
  const [mode, setMode] = useState<ViewMode>('list');

  const all = payouts ?? [];
  const pending  = all.filter(p => p.status === 'PENDING');
  const released = all.filter(p => p.status === 'PROCESSED' || p.status === 'CASH_COLLECTED');
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);

  const confirmRelease = (p: Payout) => Alert.alert(
    'Release Payout',
    `Release ₹${fmtINR(p.amount)} for Order #${p.orderId}?\n\nFunds will be credited to your bank account within 1–2 business days.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', onPress: () => releaseMut.mutate(p.id) },
    ]
  );

  const goToDetail = (p: Payout) => router.push(`/payout/${p.id}` as any);

  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Pending Payouts</Text>
      </View>

      {/* Summary strip */}
      <View style={s.summaryStrip}>
        <View style={s.sumItem}>
          <Text style={[s.sumVal, { color: Colors.warning }]}>₹{fmtINR(totalPending)}</Text>
          <Text style={s.sumLbl}>Pending</Text>
        </View>
        <View style={s.sumDiv} />
        <View style={s.sumItem}>
          <Text style={[s.sumVal, { color: Colors.fg }]}>{pending.length}</Text>
          <Text style={s.sumLbl}>Orders</Text>
        </View>
        <View style={s.sumDiv} />
        <View style={s.sumItem}>
          <Text style={[s.sumVal, { color: Colors.success }]}>{released.length}</Text>
          <Text style={s.sumLbl}>Released</Text>
        </View>
      </View>

      {/* View mode toggle */}
      <View style={s.modeRow}>
        {(['list', 'batched'] as ViewMode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[s.modeChip, mode === m && s.modeChipOn]}
            onPress={() => setMode(m)}
            activeOpacity={0.7}
          >
            <Text style={[s.modeTxt, mode === m && s.modeTxtOn]}>
              {m === 'list' ? 'All Payouts' : 'By Settlement Date'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'batched' ? (
        <BatchedView payouts={all} onRelease={confirmRelease} onDetail={goToDetail} />
      ) : (
        <FlatList
          data={all}
          keyExtractor={p => String(p.id)}
          renderItem={({ item }) => <PayoutRow item={item} onRelease={confirmRelease} onDetail={goToDetail} />}
          onRefresh={() => { refetch(); }}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
          contentContainerStyle={all.length === 0 ? { flex: 1, alignItems: 'center', justifyContent: 'center' } : { paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>✓</Text>
              <Text style={s.emptyTitle}>No Pending Payouts</Text>
              <Text style={s.emptySub}>All COD settlements have been released</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30 },
  title:       { fontSize: 17, fontWeight: '700', color: Colors.fg },

  summaryStrip:{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 14, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14 },
  sumItem:     { flex: 1, alignItems: 'center', gap: 3 },
  sumVal:      { fontSize: 20, fontWeight: '800' },
  sumLbl:      { fontSize: 10, color: Colors.fg2, fontWeight: '500' },
  sumDiv:      { width: 1, height: 36, backgroundColor: Colors.border },

  modeRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  modeChip:    { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  modeChipOn:  { backgroundColor: Colors.accent, borderColor: Colors.accent },
  modeTxt:     { fontSize: 12, fontWeight: '600', color: Colors.fg2 },
  modeTxtOn:   { color: '#fff' },

  empty:       { alignItems: 'center', padding: 48 },
  emptyIcon:   { fontSize: 40, color: Colors.success, marginBottom: 14 },
  emptyTitle:  { fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 6 },
  emptySub:    { fontSize: 13, color: Colors.fg2, textAlign: 'center' },
});
