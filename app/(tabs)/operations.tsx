import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useOrders, useCODOrders, useNDROrders, useRTOOrders, useInitiateRTO } from '../../hooks/useOrders';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { Badge } from '../../components/Badge';
import type { Order } from '../../lib/types';

type Tab = 'Business' | 'COD' | 'NDR' | 'RTO';
const TABS: Tab[] = ['Business', 'COD', 'NDR', 'RTO'];

const TAB_ICONS: Record<Tab, string> = {
  Business: '📊',
  COD:      '💸',
  NDR:      '⚠️',
  RTO:      '↩️',
};

// ── Business analytics ───────────────────────────────────────────────────────
function BusinessTab() {
  const { data: orders, isLoading, isError, refetch } = useOrders();
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ marginTop: 60 }} />;
  if (isError) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 24, marginBottom: 12 }}>⚠️</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.fg, marginBottom: 8 }}>Could not load data</Text>
      <TouchableOpacity style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }} onPress={() => refetch()}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const o = orders ?? [];
  const total      = o.length;
  const delivered  = o.filter(x => x.status === 'DELIVERED').length;
  const inTransit  = o.filter(x => x.status === 'IN_TRANSIT' || x.status === 'PICKED_UP').length;
  const ofd        = o.filter(x => x.status === 'OUT_FOR_DELIVERY').length;
  const ndr        = o.filter(x => x.status === 'DELIVERY_FAILED' || x.status === 'NDR').length;
  const rto        = o.filter(x => x.status?.startsWith('RTO') ?? false).length;
  const cod        = o.filter(x => x.paymentMethod === 'COD').length;
  const prepaid    = o.filter(x => x.paymentMethod === 'PREPAID').length;

  const delivRate  = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const ndrRate    = total > 0 ? Math.round((ndr / total) * 100) : 0;
  const rtoRate    = total > 0 ? Math.round((rto / total) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

      {/* NDR overview card */}
      <View style={bs.ndrCard}>
        <View style={bs.ndrCardHeader}>
          <Text style={bs.ndrCardTitle}>NDR Overview</Text>
          <Text style={bs.ndrCardSub}>Last 30 days</Text>
        </View>
        <View style={bs.ndrGrid}>
          {[
            { label: 'Total NDR', value: ndr,  color: Colors.error },
            { label: 'Pending',   value: ndr,  color: Colors.warning },
            { label: 'Delivered', value: 0,    color: Colors.success },
            { label: 'RTO',       value: rto,  color: Colors.fg2 },
          ].map(item => (
            <View key={item.label} style={bs.ndrItem}>
              <Text style={[bs.ndrItemVal, { color: item.color }]}>{item.value}</Text>
              <Text style={bs.ndrItemLbl}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Key metrics row */}
      <View style={bs.metricsRow}>
        {[
          { label: 'Total Orders', value: total,     color: Colors.accent },
          { label: 'Delivered',    value: delivered, color: Colors.success },
          { label: 'In Transit',   value: inTransit, color: Colors.warning },
        ].map(m => (
          <View key={m.label} style={[bs.metricBox, { borderTopColor: m.color }]}>
            <Text style={[bs.metricVal, { color: m.color }]}>{m.value}</Text>
            <Text style={bs.metricLbl}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={bs.metricsRow}>
        {[
          { label: 'Out for Del.', value: ofd,  color: Colors.purple },
          { label: 'NDR / Failed', value: ndr,  color: Colors.error },
          { label: 'RTO',          value: rto,  color: Colors.fg2 },
        ].map(m => (
          <View key={m.label} style={[bs.metricBox, { borderTopColor: m.color }]}>
            <Text style={[bs.metricVal, { color: m.color }]}>{m.value}</Text>
            <Text style={bs.metricLbl}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Performance */}
      <Text style={bs.sectionTitle}>Performance</Text>
      <View style={bs.perfCard}>
        {[
          { label: 'Delivery Rate', value: delivRate, color: Colors.success },
          { label: 'NDR Rate',      value: ndrRate,   color: Colors.error },
          { label: 'RTO Rate',      value: rtoRate,   color: Colors.warning },
        ].map(m => (
          <View key={m.label} style={bs.perfRow}>
            <Text style={bs.perfLbl}>{m.label}</Text>
            <View style={bs.perfTrack}>
              <View style={[bs.perfFill, { width: `${Math.min(m.value, 100)}%`, backgroundColor: m.color }]} />
            </View>
            <Text style={[bs.perfVal, { color: m.color }]}>{m.value}%</Text>
          </View>
        ))}
      </View>

      {/* Payment split */}
      <Text style={bs.sectionTitle}>Payment Mode</Text>
      <View style={bs.splitCard}>
        <View style={bs.splitBarRow}>
          <View style={[bs.splitSegment, { flex: prepaid || 0.001, backgroundColor: Colors.accent }]} />
          <View style={[bs.splitSegment, { flex: cod || 0.001, backgroundColor: Colors.warning }]} />
        </View>
        <View style={bs.splitLegend}>
          {[
            { label: 'Prepaid', count: prepaid, color: Colors.accent },
            { label: 'COD',     count: cod,     color: Colors.warning },
          ].map(item => (
            <View key={item.label} style={bs.legendItem}>
              <View style={[bs.legendDot, { backgroundColor: item.color }]} />
              <Text style={bs.legendLbl}>{item.label}</Text>
              <Text style={[bs.legendCount, { color: item.color }]}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ── COD list ─────────────────────────────────────────────────────────────────
function CODList({ onContact }: { onContact: (o: Order) => void }) {
  const { data: orders, isLoading } = useCODOrders();
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />;
  return (
    <FlatList
      data={orders}
      keyExtractor={o => String(o.id)}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyState label="No COD Orders" icon="💸" />}
      renderItem={({ item: o }) => (
        <View style={s.card}>
          <View style={s.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.prodName}>{o.itemContents ?? 'Item'}</Text>
              <Text style={s.meta}>AWB: {o.awbNumber ?? '-'}</Text>
            </View>
            <Badge label={o.codCollected ? 'Collected' : 'Pending'} variant={o.codCollected ? 'success' : 'error'} />
          </View>
          <View style={s.amtRow}>
            <View>
              <Text style={s.metaLbl}>Customer</Text>
              <Text style={s.metaVal}>{o.receiverName} · {o.receiverCity ?? ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.metaLbl}>COD Amount</Text>
              <Text style={[s.amount, { color: Colors.warning }]}>₹{o.codAmount ?? o.orderValue ?? 0}</Text>
            </View>
          </View>
          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.successDim }]}>
              <Text style={{ color: Colors.success, fontWeight: '600', fontSize: 12 }}>Mark Collected</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.accentDim }]} onPress={() => onContact(o)}>
              <Text style={{ color: Colors.accent, fontWeight: '600', fontSize: 12 }}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

// ── NDR list ─────────────────────────────────────────────────────────────────
function NDRList({ onContact }: { onContact: (o: Order) => void }) {
  const { data: orders, isLoading } = useNDROrders();
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />;
  return (
    <FlatList
      data={orders}
      keyExtractor={o => String(o.id)}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyState label="No NDR Orders" icon="✅" />}
      renderItem={({ item: o }) => (
        <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: Colors.error }]}>
          <View style={s.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.prodName}>{o.orderNumber}</Text>
              <Text style={s.meta}>{o.receiverName} · {o.receiverCity}</Text>
            </View>
            <Badge label="NDR" variant="error" />
          </View>
          {o.ndrReason ? (
            <View style={s.ndrBox}>
              <Text style={s.ndrTxt}>{o.ndrReason}</Text>
            </View>
          ) : null}
          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.accentDim }]} onPress={() => onContact(o)}>
              <Text style={{ color: Colors.accent, fontWeight: '600', fontSize: 12 }}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.warningDim }]}>
              <Text style={{ color: Colors.warning, fontWeight: '600', fontSize: 12 }}>Re-Attempt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.errorDim }]}>
              <Text style={{ color: Colors.error, fontWeight: '600', fontSize: 12 }}>RTO</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

// ── RTO list ─────────────────────────────────────────────────────────────────
function RTOList() {
  const { data: orders, isLoading } = useRTOOrders();
  const rtoMut = useInitiateRTO();
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />;
  return (
    <FlatList
      data={orders}
      keyExtractor={o => String(o.id)}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyState label="No RTO Orders" icon="↩️" />}
      renderItem={({ item: o }) => (
        <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: Colors.fg2 }]}>
          <View style={s.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.prodName}>{o.orderNumber}</Text>
              <Text style={s.meta}>{o.receiverName} · {o.receiverCity}</Text>
            </View>
            <Badge label={(o.status ?? '').replace('RTO_', 'RTO ')} variant="error" />
          </View>
          <View style={s.amtRow}>
            <View>
              <Text style={s.metaLbl}>RTO Reason</Text>
              <Text style={s.metaVal}>{o.rtoReason ?? 'Not specified'}</Text>
            </View>
          </View>
          {(o.status === 'PROCESSING' || o.status === 'IN_TRANSIT') && (
            <View style={s.btnRow}>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: Colors.errorDim }]}
                onPress={() => Alert.alert('Initiate RTO', 'Return this shipment?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Confirm', style: 'destructive', onPress: () => rtoMut.mutate(o.id) },
                ])}
              >
                <Text style={{ color: Colors.error, fontWeight: '600', fontSize: 12 }}>Initiate RTO</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    />
  );
}

function EmptyState({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 }}>
      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.fg, marginBottom: 6 }}>{label}</Text>
      <Text style={{ fontSize: 12, color: Colors.fg2, textAlign: 'center' }}>Nothing to show here right now</Text>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function OperationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Business');
  const [contact, setContact] = useState<Order | null>(null);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Operations</Text>
          <Text style={s.subtitle}>Monitor & manage your shipments</Text>
        </View>
      </View>

      {/* Quick action chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.qaScroll}>
        {[
          { label: 'Bulk Assign',   icon: '⚡', path: '/bulk-assign' },
          { label: 'Print Labels',  icon: '🖨',  path: '/clubbed-print' },
          { label: 'Weight Issues', icon: '⚖️', path: '/weight-discrepancy' },
        ].map(item => (
          <TouchableOpacity key={item.label} style={s.qaChip} onPress={() => router.push(item.path as any)} activeOpacity={0.75}>
            <Text style={s.qaChipIcon}>{item.icon}</Text>
            <Text style={s.qaChipLbl}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab selector */}
      <View style={s.tabBar}>
        {TABS.map(t => {
          const active = tab === t;
          return (
            <TouchableOpacity key={t} style={[s.tabItem, active && s.tabItemOn]} onPress={() => setTab(t)} activeOpacity={0.75}>
              <Text style={s.tabItemIcon}>{TAB_ICONS[t]}</Text>
              <Text style={[s.tabTxt, active && s.tabTxtOn]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'Business' && <BusinessTab />}
        {tab === 'COD' && <CODList onContact={setContact} />}
        {tab === 'NDR' && <NDRList onContact={setContact} />}
        {tab === 'RTO' && <RTOList />}
      </View>

      <WhatsAppModal order={contact} onClose={() => setContact(null)} />
    </SafeAreaView>
  );
}

const bs = StyleSheet.create({
  ndrCard:       { backgroundColor: Colors.error, borderRadius: 20, padding: 18, marginBottom: 16 },
  ndrCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  ndrCardTitle:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  ndrCardSub:    { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  ndrGrid:       { flexDirection: 'row', gap: 10 },
  ndrItem:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, alignItems: 'center' },
  ndrItemVal:    { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  ndrItemLbl:    { fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  metricsRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  metricBox:     { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderTopWidth: 3, borderWidth: 1, borderColor: Colors.border },
  metricVal:     { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  metricLbl:     { fontSize: 11, color: Colors.fg2 },

  sectionTitle:  { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, marginTop: 8 },

  perfCard:      { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 14, marginBottom: 16 },
  perfRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perfLbl:       { fontSize: 12, color: Colors.fg2, width: 90 },
  perfTrack:     { flex: 1, height: 7, backgroundColor: Colors.surface2, borderRadius: 4, overflow: 'hidden' },
  perfFill:      { height: 7, borderRadius: 4 },
  perfVal:       { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },

  splitCard:     { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 16 },
  splitBarRow:   { flexDirection: 'row', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 14 },
  splitSegment:  { height: 10 },
  splitLegend:   { flexDirection: 'row', gap: 24 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:     { width: 10, height: 10, borderRadius: 5 },
  legendLbl:     { fontSize: 12, color: Colors.fg2 },
  legendCount:   { fontSize: 12, fontWeight: '700' },
});

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  title:       { fontSize: 24, fontWeight: '800', color: Colors.fg, letterSpacing: -0.3 },
  subtitle:    { fontSize: 12, color: Colors.fg2, marginTop: 2 },

  qaScroll:    { paddingHorizontal: 16, paddingBottom: 12, gap: 8, alignItems: 'center' },
  qaChip:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  qaChipIcon:  { fontSize: 15 },
  qaChipLbl:   { fontSize: 12, fontWeight: '600', color: Colors.fg2 },

  tabBar:      { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surface2, borderRadius: 16, padding: 4 },
  tabItem:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: 12 },
  tabItemOn:   { backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabItemIcon: { fontSize: 13 },
  tabTxt:      { fontSize: 11, fontWeight: '600', color: Colors.fg2 },
  tabTxtOn:    { color: Colors.accent },

  card:        { backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  prodName:    { fontSize: 14, fontWeight: '600', color: Colors.fg, marginBottom: 2 },
  meta:        { fontSize: 11, color: Colors.fg2 },
  amtRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  metaLbl:     { fontSize: 10, color: Colors.fg3, marginBottom: 2 },
  metaVal:     { fontSize: 12, color: Colors.fg, fontWeight: '500' },
  amount:      { fontSize: 18, fontWeight: '800' },
  btnRow:      { flexDirection: 'row', gap: 8 },
  btn:         { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  ndrBox:      { backgroundColor: Colors.errorDim, borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: `${Colors.error}20` },
  ndrTxt:      { fontSize: 11, color: Colors.error },
});
