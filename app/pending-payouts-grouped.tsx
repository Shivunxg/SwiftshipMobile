import React, { useState, useMemo } from 'react';
import {
  View, Text, SectionList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { fmtINR, fmtDate } from '../lib/format';
import { usePayouts, useReleasePayoutMutation } from '../hooks/useOrders';
import type { Payout } from '../lib/types';

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

function todayIso(): string {
  try { return new Date().toISOString().slice(0, 10); } catch (e) { return ''; }
}

function StatusPill({ status }: { status: Payout['status'] }) {
  const isReleased = status === 'PROCESSED' || status === 'CASH_COLLECTED';
  return (
    <View style={[pill.wrap, isReleased ? pill.released : pill.pending]}>
      <Text style={[pill.txt, isReleased ? pill.relTxt : pill.penTxt]}>
        {status === 'PROCESSED' ? 'Processed' : status === 'CASH_COLLECTED' ? 'Collected' : 'Pending'}
      </Text>
    </View>
  );
}
const pill = StyleSheet.create({
  wrap:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  released: { backgroundColor: Colors.successDim },
  pending:  { backgroundColor: Colors.warningDim },
  txt:      { fontSize: 10, fontWeight: '700' },
  relTxt:   { color: Colors.success },
  penTxt:   { color: Colors.warning },
});

function PayoutRow({ item, onRelease, onDetail }: {
  item: Payout; onRelease: (p: Payout) => void; onDetail: (p: Payout) => void;
}) {
  return (
    <TouchableOpacity style={pr.row} onPress={() => onDetail(item)} activeOpacity={0.75}>
      <View style={pr.iconBox}>
        <Text style={pr.iconTxt}>₹</Text>
      </View>
      <View style={pr.mid}>
        <Text style={pr.orderId}>Order #{item.orderId}</Text>
        <Text style={pr.meta}>Delivery: {fmtDate(item.deliveryDate ?? null)}</Text>
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
  row:        { flexDirection: 'row', alignItems: 'center', padding: 13, gap: 10, backgroundColor: Colors.surface },
  iconBox:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconTxt:    { fontSize: 15, fontWeight: '700', color: Colors.accent },
  mid:        { flex: 1, gap: 3 },
  orderId:    { fontSize: 13, fontWeight: '600', color: Colors.fg },
  meta:       { fontSize: 11, color: Colors.fg2 },
  right:      { alignItems: 'flex-end', gap: 4 },
  amount:     { fontSize: 15, fontWeight: '700', color: Colors.fg },
  releaseBtn: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: `${Colors.accent}30` },
  releaseTxt: { fontSize: 10, fontWeight: '700', color: Colors.accent },
});

interface BatchSection {
  date: string;
  data: Payout[];
  total: number;
  pendingCount: number;
}

export default function PendingPayoutsGroupedScreen() {
  const router = useRouter();
  const { data: payouts, isLoading, refetch, isRefetching } = usePayouts();
  const releaseMut = useReleasePayoutMutation();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const today = todayIso();

  const sections: BatchSection[] = useMemo(() => {
    const groups: Record<string, Payout[]> = {};
    (payouts ?? []).forEach(p => {
      const key = isoDate(addDays(p.createdAt, 7));
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, items]) => ({
        date,
        data: items,
        total: items.reduce((s, p) => s + p.amount, 0),
        pendingCount: items.filter(p => p.status === 'PENDING').length,
      }));
  }, [payouts]);

  const totalPending = useMemo(
    () => (payouts ?? []).filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0),
    [payouts]
  );
  const totalReleased = useMemo(
    () => (payouts ?? []).filter(p => p.status !== 'PENDING').reduce((s, p) => s + p.amount, 0),
    [payouts]
  );

  const confirmRelease = (p: Payout) => Alert.alert(
    'Release Payout',
    `Release ₹${fmtINR(p.amount)} for Order #${p.orderId}?\n\nFunds will be credited to your bank within 1–2 business days.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', onPress: () => releaseMut.mutate(p.id) },
    ]
  );

  const confirmReleaseBatch = (section: BatchSection) => Alert.alert(
    'Release Entire Batch',
    `Release all ${section.pendingCount} pending payouts (₹${fmtINR(section.total)}) due on ${fmtDate(section.date)}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Release All',
        onPress: () => section.data
          .filter(p => p.status === 'PENDING')
          .forEach(p => releaseMut.mutate(p.id)),
      },
    ]
  );

  const goToDetail = (p: Payout) => router.push(`/payout/${p.id}` as any);

  const toggleCollapse = (date: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>COD Settlements</Text>
        <View style={s.headerRight}>
          <Text style={s.batchCount}>{sections.length} batch{sections.length !== 1 ? 'es' : ''}</Text>
        </View>
      </View>

      {/* Summary strip */}
      <View style={s.summaryStrip}>
        <View style={s.sumItem}>
          <Text style={[s.sumVal, { color: Colors.warning }]}>₹{fmtINR(totalPending)}</Text>
          <Text style={s.sumLbl}>Pending</Text>
        </View>
        <View style={s.sumDiv} />
        <View style={s.sumItem}>
          <Text style={[s.sumVal, { color: Colors.fg }]}>{sections.length}</Text>
          <Text style={s.sumLbl}>Batches</Text>
        </View>
        <View style={s.sumDiv} />
        <View style={s.sumItem}>
          <Text style={[s.sumVal, { color: Colors.success }]}>₹{fmtINR(totalReleased)}</Text>
          <Text style={s.sumLbl}>Released</Text>
        </View>
      </View>

      <SectionList
        sections={sections.map(sec => ({
          ...sec,
          data: collapsed.has(sec.date) ? [] : sec.data,
        }))}
        keyExtractor={item => String(item.id)}
        onRefresh={() => { refetch(); }}
        refreshing={isRefetching}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => {
          const sec = sections.find(s => s.date === section.date)!;
          const isToday = sec.date === today;
          const isCollapsed = collapsed.has(sec.date);
          return (
            <TouchableOpacity
              style={s.groupHeader}
              onPress={() => toggleCollapse(sec.date)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={s.groupDate}>
                    {sec.date === 'pending' ? 'No Date Set' : fmtDate(sec.date)}
                  </Text>
                  {isToday && (
                    <View style={s.todayBadge}><Text style={s.todayTxt}>Today</Text></View>
                  )}
                </View>
                <Text style={s.groupSub}>
                  {sec.data.length} order{sec.data.length !== 1 ? 's' : ''} · {sec.pendingCount} pending
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={s.groupTotal}>₹{fmtINR(sec.total)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {sec.pendingCount > 0 && (
                    <TouchableOpacity
                      style={s.releaseAllBtn}
                      onPress={() => confirmReleaseBatch(sec)}
                    >
                      <Text style={s.releaseAllTxt}>Release All</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={s.collapseIcon}>{isCollapsed ? '›' : '⌄'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        renderSectionFooter={({ section }) => (
          <View style={s.groupFooter} />
        )}
        renderItem={({ item, index, section }) => {
          const sec = sections.find(s => s.date === section.date)!;
          const isLast = index === sec.data.length - 1;
          return (
            <View style={[s.rowWrap, isLast && s.rowWrapLast]}>
              <PayoutRow item={item} onRelease={confirmRelease} onDetail={goToDetail} />
              {!isLast && <View style={s.rowSep} />}
            </View>
          );
        }}
        contentContainerStyle={sections.length === 0
          ? { flex: 1, alignItems: 'center', justifyContent: 'center' }
          : { paddingBottom: 32 }
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>✓</Text>
            <Text style={s.emptyTitle}>All Settled</Text>
            <Text style={s.emptySub}>No pending COD payouts to release</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30 },
  title:        { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.fg },
  headerRight:  {},
  batchCount:   { fontSize: 12, color: Colors.fg2, fontWeight: '500' },

  summaryStrip: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 14, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14 },
  sumItem:      { flex: 1, alignItems: 'center', gap: 3 },
  sumVal:       { fontSize: 18, fontWeight: '800' },
  sumLbl:       { fontSize: 10, color: Colors.fg2, fontWeight: '500' },
  sumDiv:       { width: 1, height: 32, backgroundColor: Colors.border },

  groupHeader:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 6, paddingTop: 4 },
  groupDate:    { fontSize: 15, fontWeight: '700', color: Colors.fg },
  groupSub:     { fontSize: 11, color: Colors.fg2, marginTop: 2 },
  groupTotal:   { fontSize: 16, fontWeight: '700', color: Colors.accent },
  todayBadge:   { backgroundColor: Colors.accentDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  todayTxt:     { fontSize: 10, fontWeight: '700', color: Colors.accent },
  releaseAllBtn:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: Colors.successDim, borderWidth: 1, borderColor: `${Colors.success}30` },
  releaseAllTxt:{ fontSize: 10, fontWeight: '700', color: Colors.success },
  collapseIcon: { fontSize: 18, color: Colors.fg3, fontWeight: '300', lineHeight: 20 },

  rowWrap:      { backgroundColor: Colors.surface, marginHorizontal: 16, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  rowWrapLast:  { borderBottomWidth: 1, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  rowSep:       { height: 1, backgroundColor: Colors.border, marginLeft: 59 },
  groupFooter:  { height: 14 },

  empty:        { alignItems: 'center', padding: 48 },
  emptyIcon:    { fontSize: 40, color: Colors.success, marginBottom: 14 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 6 },
  emptySub:     { fontSize: 13, color: Colors.fg2, textAlign: 'center' },
});
