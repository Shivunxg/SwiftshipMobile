import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { fmtINR, fmtDate } from '../lib/format';
import { useWeightDiscrepancies, useDisputeWeight } from '../hooks/useOrders';
import type { WeightDiscrepancy } from '../lib/types';

type Filter = 'All' | 'PENDING' | 'DISPUTED' | 'ACCEPTED' | 'WAIVED';
const FILTERS: Filter[] = ['All', 'PENDING', 'DISPUTED', 'ACCEPTED', 'WAIVED'];

const STATUS_COLOR: Record<WeightDiscrepancy['status'], string> = {
  PENDING:  Colors.warning,
  DISPUTED: Colors.accent,
  ACCEPTED: Colors.error,
  WAIVED:   Colors.success,
};
const STATUS_LABEL: Record<WeightDiscrepancy['status'], string> = {
  PENDING:  'Pending',
  DISPUTED: 'Disputed',
  ACCEPTED: 'Accepted',
  WAIVED:   'Waived',
};

function DiscrepancyCard({ item, onDispute }: {
  item: WeightDiscrepancy; onDispute: (d: WeightDiscrepancy) => void;
}) {
  const color = STATUS_COLOR[item.status];
  return (
    <View style={dc.card}>
      <View style={dc.top}>
        <View style={{ flex: 1 }}>
          <Text style={dc.orderNum}>Order #{item.orderNumber}</Text>
          {item.awbNumber && <Text style={dc.awb}>AWB: {item.awbNumber}</Text>}
          {item.courierPartner && <Text style={dc.courier}>{item.courierPartner}</Text>}
        </View>
        <View style={[dc.statusBadge, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
          <Text style={[dc.statusTxt, { color }]}>{STATUS_LABEL[item.status]}</Text>
        </View>
      </View>

      <View style={dc.weightRow}>
        <View style={dc.weightItem}>
          <Text style={dc.weightVal}>{item.declaredWeight} kg</Text>
          <Text style={dc.weightLbl}>Declared</Text>
        </View>
        <View style={dc.arrow}>
          <Text style={dc.arrowTxt}>→</Text>
        </View>
        <View style={dc.weightItem}>
          <Text style={[dc.weightVal, { color: Colors.error }]}>{item.chargedWeight} kg</Text>
          <Text style={dc.weightLbl}>Charged</Text>
        </View>
        <View style={dc.diff}>
          <Text style={dc.diffVal}>+{item.difference} kg</Text>
          <Text style={dc.diffCharge}>₹{fmtINR(item.extraCharge)} extra</Text>
        </View>
      </View>

      <View style={dc.footer}>
        <Text style={dc.date}>Detected: {fmtDate(item.detectedAt)}</Text>
        {item.status === 'PENDING' && (
          <TouchableOpacity style={dc.disputeBtn} onPress={() => onDispute(item)}>
            <Text style={dc.disputeTxt}>Dispute</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  card:        { backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  top:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  orderNum:    { fontSize: 14, fontWeight: '700', color: Colors.fg, marginBottom: 2 },
  awb:         { fontSize: 11, color: Colors.fg2, marginBottom: 1 },
  courier:     { fontSize: 11, color: Colors.fg3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },
  weightRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface2, borderRadius: 10, padding: 12, marginBottom: 10, gap: 8 },
  weightItem:  { flex: 1, alignItems: 'center' },
  weightVal:   { fontSize: 16, fontWeight: '700', color: Colors.fg },
  weightLbl:   { fontSize: 10, color: Colors.fg2, marginTop: 2 },
  arrow:       { paddingHorizontal: 4 },
  arrowTxt:    { fontSize: 18, color: Colors.fg3 },
  diff:        { flex: 1, alignItems: 'center' },
  diffVal:     { fontSize: 14, fontWeight: '700', color: Colors.error },
  diffCharge:  { fontSize: 11, color: Colors.error, marginTop: 2 },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date:        { fontSize: 11, color: Colors.fg3 },
  disputeBtn:  { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: `${Colors.accent}30` },
  disputeTxt:  { fontSize: 11, fontWeight: '700', color: Colors.accent },
});

export default function WeightDiscrepancyScreen() {
  const router = useRouter();
  const { data: discrepancies, isLoading, refetch, isRefetching } = useWeightDiscrepancies();
  const disputeMut = useDisputeWeight();
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = useMemo(() => {
    const all = discrepancies ?? [];
    return filter === 'All' ? all : all.filter(d => d.status === filter);
  }, [discrepancies, filter]);

  const counts = useMemo(() => {
    const all = discrepancies ?? [];
    return Object.fromEntries(FILTERS.map(f => [f, f === 'All' ? all.length : all.filter(d => d.status === f).length])) as Record<Filter, number>;
  }, [discrepancies]);

  const totalExtraCharge = useMemo(() =>
    (discrepancies ?? []).filter(d => d.status === 'PENDING' || d.status === 'ACCEPTED').reduce((s, d) => s + d.extraCharge, 0),
    [discrepancies]
  );

  const handleDispute = (d: WeightDiscrepancy) => Alert.alert(
    'Dispute Weight',
    `Dispute the weight charge of ₹${fmtINR(d.extraCharge)} for Order #${d.orderNumber}?\n\nOur team will review within 2–3 business days.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Dispute', onPress: () => disputeMut.mutate(d.id) },
    ]
  );

  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Weight Discrepancy</Text>
      </View>

      {/* Alert strip */}
      {totalExtraCharge > 0 && (
        <View style={s.alertStrip}>
          <View style={s.alertDot} />
          <Text style={s.alertTxt}>
            ₹{fmtINR(totalExtraCharge)} in potential extra charges — review and dispute if incorrect
          </Text>
        </View>
      )}

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={[s.statVal, { color: Colors.warning }]}>{counts.PENDING}</Text>
          <Text style={s.statLbl}>Pending</Text>
        </View>
        <View style={s.statDiv} />
        <View style={s.stat}>
          <Text style={[s.statVal, { color: Colors.accent }]}>{counts.DISPUTED}</Text>
          <Text style={s.statLbl}>Disputed</Text>
        </View>
        <View style={s.statDiv} />
        <View style={s.stat}>
          <Text style={[s.statVal, { color: Colors.error }]}>{counts.ACCEPTED}</Text>
          <Text style={s.statLbl}>Accepted</Text>
        </View>
        <View style={s.statDiv} />
        <View style={s.stat}>
          <Text style={[s.statVal, { color: Colors.success }]}>{counts.WAIVED}</Text>
          <Text style={s.statLbl}>Waived</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipOn]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipTxt, filter === f && s.chipTxtOn]}>
              {f === 'All' ? 'All' : STATUS_LABEL[f as WeightDiscrepancy['status']]}
              {counts[f] > 0 ? ` (${counts[f]})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={d => String(d.id)}
        renderItem={({ item }) => <DiscrepancyCard item={item} onDispute={handleDispute} />}
        onRefresh={() => { refetch(); }}
        refreshing={isRefetching}
        contentContainerStyle={filtered.length === 0 ? { flex: 1, alignItems: 'center', justifyContent: 'center' } : { paddingTop: 10, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>✓</Text>
            <Text style={s.emptyTitle}>No Discrepancies</Text>
            <Text style={s.emptySub}>No weight discrepancies found for the selected filter</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:    { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30 },
  title:      { fontSize: 17, fontWeight: '700', color: Colors.fg },

  alertStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 12, marginBottom: 8, backgroundColor: Colors.warningDim, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${Colors.warning}30` },
  alertDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.warning, flexShrink: 0 },
  alertTxt:   { fontSize: 12, color: Colors.warning, flex: 1, lineHeight: 18 },

  statsRow:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12 },
  stat:       { flex: 1, alignItems: 'center', gap: 3 },
  statVal:    { fontSize: 20, fontWeight: '800' },
  statLbl:    { fontSize: 10, color: Colors.fg2, fontWeight: '500' },
  statDiv:    { width: 1, height: 32, backgroundColor: Colors.border },

  filterRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 12, paddingBottom: 10 },
  chip:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipOn:     { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipTxt:    { fontSize: 12, fontWeight: '600', color: Colors.fg2 },
  chipTxtOn:  { color: '#fff' },

  empty:      { alignItems: 'center', padding: 48 },
  emptyIcon:  { fontSize: 40, color: Colors.success, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: Colors.fg2, textAlign: 'center' },
});
