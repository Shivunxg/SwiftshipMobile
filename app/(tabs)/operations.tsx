import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useOrders, useCODOrders, useNDROrders, useRTOOrders, useInitiateRTO } from '../../hooks/useOrders';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { Badge } from '../../components/Badge';
import type { Order } from '../../lib/types';

type Tab = 'Business' | 'COD' | 'NDR' | 'RTO';
const TABS: Tab[] = ['Business', 'COD', 'NDR', 'RTO'];

// ── Business analytics tab ───────────────────────────────────────────────────
function BusinessTab() {
  const { data: orders, isLoading } = useOrders();
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ marginTop: 60 }} />;

  const o = orders ?? [];
  const total      = o.length;
  const delivered  = o.filter(x => x.status === 'DELIVERED').length;
  const inTransit  = o.filter(x => x.status === 'IN_TRANSIT' || x.status === 'PICKED_UP').length;
  const ofd        = o.filter(x => x.status === 'OUT_FOR_DELIVERY').length;
  const ndr        = o.filter(x => x.status === 'DELIVERY_FAILED' || x.status === 'NDR').length;
  const rto        = o.filter(x => x.status?.startsWith('RTO') ?? false).length;
  const cod        = o.filter(x => x.paymentMethod === 'COD').length;
  const prepaid    = o.filter(x => x.paymentMethod === 'ONLINE').length;
  const ndrResolved = o.filter(x => x.status === 'DELIVERED' && (x.ndrDate != null)).length;

  const delivRate  = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const ndrRate    = total > 0 ? Math.round((ndr / total) * 100) : 0;
  const rtoRate    = total > 0 ? Math.round((rto / total) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* NDR Summary card */}
      <View style={bs.headerCard}>
        <Text style={bs.headerCardTitle}>NDR Overview</Text>
        <Text style={bs.headerCardSub}>Last 30 days</Text>
        <View style={bs.ndrGrid}>
          <NDRStat label="Total NDR Raised"      value={ndr}         color={Colors.error}   />
          <NDRStat label="Action Taken"          value={ndrResolved} color={Colors.success} />
          <NDRStat label="Pending for Action"    value={Math.max(0, ndr - ndrResolved)} color={Colors.warning} />
          <NDRStat label="NDR Delivered"         value={ndrResolved} color={Colors.purple}  />
        </View>
      </View>

      {/* Shipment overview */}
      <Text style={bs.sectionTitle}>Shipment Overview</Text>
      <View style={bs.statsGrid}>
        <StatBox label="Total Orders"  value={total}      color={Colors.accent}  />
        <StatBox label="Delivered"     value={delivered}  color={Colors.success} />
        <StatBox label="In Transit"    value={inTransit}  color={Colors.warning} />
        <StatBox label="Out for Del."  value={ofd}        color={Colors.purple}  />
        <StatBox label="NDR"           value={ndr}        color={Colors.error}   />
        <StatBox label="RTO"           value={rto}        color={Colors.fg2}     />
      </View>

      {/* Performance metrics */}
      <Text style={bs.sectionTitle}>Performance</Text>
      <View style={bs.metricsCard}>
        <MetricRow label="Delivery Rate"  value={`${delivRate}%`} color={Colors.success} pct={delivRate} />
        <MetricRow label="NDR Rate"       value={`${ndrRate}%`}   color={Colors.error}   pct={ndrRate} />
        <MetricRow label="RTO Rate"       value={`${rtoRate}%`}   color={Colors.warning} pct={rtoRate} />
      </View>

      {/* Payment split */}
      <Text style={bs.sectionTitle}>Payment Mode</Text>
      <View style={bs.splitCard}>
        <View style={bs.splitRow}>
          <View style={[bs.splitBar, { flex: prepaid || 1, backgroundColor: Colors.accent }]} />
          <View style={[bs.splitBar, { flex: cod || 0.001, backgroundColor: Colors.warning }]} />
        </View>
        <View style={bs.splitLegend}>
          <View style={bs.splitItem}>
            <View style={[bs.legendDot, { backgroundColor: Colors.accent }]} />
            <Text style={bs.splitLbl}>Prepaid</Text>
            <Text style={bs.splitVal}>{prepaid}</Text>
          </View>
          <View style={bs.splitItem}>
            <View style={[bs.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={bs.splitLbl}>COD</Text>
            <Text style={bs.splitVal}>{cod}</Text>
          </View>
        </View>
      </View>

      {/* Shipping mode */}
      <Text style={bs.sectionTitle}>Shipment Split by Shipping Mode</Text>
      <View style={bs.modeCard}>
        {[
          { label: 'Surface', count: o.filter(x => x.serviceType === 'SURFACE').length, color: Colors.accent },
          { label: 'Air',     count: o.filter(x => x.serviceType === 'AIR').length,     color: Colors.purple },
          { label: 'Other',   count: o.filter(x => !x.serviceType || (x.serviceType !== 'SURFACE' && x.serviceType !== 'AIR')).length, color: Colors.fg2 },
        ].map(m => (
          <View key={m.label} style={bs.modeRow}>
            <View style={[bs.modeDot, { backgroundColor: m.color }]} />
            <Text style={bs.modeLbl}>{m.label}</Text>
            <View style={bs.modeBarWrap}>
              <View style={[bs.modeBarFill, { flex: m.count || 0.001, backgroundColor: m.color }]} />
              <View style={{ flex: total - m.count || 0.001 }} />
            </View>
            <Text style={bs.modeCount}>{m.count}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function NDRStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={bs.ndrStat}>
      <Text style={[bs.ndrVal, { color }]}>{value}</Text>
      <Text style={bs.ndrLbl}>{label}</Text>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[bs.statBox, { borderTopColor: color }]}>
      <Text style={[bs.statVal, { color }]}>{value}</Text>
      <Text style={bs.statLbl}>{label}</Text>
    </View>
  );
}

function MetricRow({ label, value, color, pct }: { label: string; value: string; color: string; pct: number }) {
  return (
    <View style={bs.metricRow}>
      <Text style={bs.metricLbl}>{label}</Text>
      <View style={bs.metricBarTrack}>
        <View style={[bs.metricBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[bs.metricVal, { color }]}>{value}</Text>
    </View>
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
      ListEmptyComponent={<EmptyState label="No COD Orders" />}
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
      ListEmptyComponent={<EmptyState label="No NDR Orders" />}
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
      ListEmptyComponent={<EmptyState label="No RTO Orders" />}
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
          {o.status === 'ORDER_CREATED' || o.status === 'IN_TRANSIT' ? (
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
          ) : null}
        </View>
      )}
    />
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 60 }}>
      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 20, color: Colors.fg2 }}>—</Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.fg }}>{label}</Text>
      <Text style={{ fontSize: 12, color: Colors.fg2, marginTop: 4 }}>Nothing to show here</Text>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function OperationsScreen() {
  const [tab, setTab] = useState<Tab>('Business');
  const [contact, setContact] = useState<Order | null>(null);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Operations</Text>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tabItem, tab === t && s.tabItemOn]} onPress={() => setTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
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
  headerCard:     { backgroundColor: Colors.accent, borderRadius: 18, padding: 18, marginBottom: 16 },
  headerCardTitle:{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  headerCardSub:  { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  ndrGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ndrStat:        { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
  ndrVal:         { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  ndrLbl:         { fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 15 },

  sectionTitle:   { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, marginTop: 4 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statBox:        { flex: 1, minWidth: '30%', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderTopWidth: 3, borderWidth: 1, borderColor: Colors.border },
  statVal:        { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLbl:        { fontSize: 11, color: Colors.fg2 },

  metricsCard:    { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 14, marginBottom: 16 },
  metricRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricLbl:      { fontSize: 12, color: Colors.fg2, width: 90 },
  metricBarTrack: { flex: 1, height: 6, backgroundColor: Colors.surface2, borderRadius: 3, overflow: 'hidden' },
  metricBarFill:  { height: 6, borderRadius: 3 },
  metricVal:      { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },

  splitCard:      { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 16 },
  splitRow:       { flexDirection: 'row', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 14 },
  splitBar:       { height: 10 },
  splitLegend:    { flexDirection: 'row', gap: 24 },
  splitItem:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:      { width: 10, height: 10, borderRadius: 5 },
  splitLbl:       { fontSize: 12, color: Colors.fg2 },
  splitVal:       { fontSize: 12, fontWeight: '700', color: Colors.fg },

  modeCard:       { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12, marginBottom: 16 },
  modeRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeDot:        { width: 8, height: 8, borderRadius: 4 },
  modeLbl:        { fontSize: 12, color: Colors.fg2, width: 55 },
  modeBarWrap:    { flex: 1, flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: Colors.surface2 },
  modeBarFill:    { height: 6 },
  modeCount:      { fontSize: 12, fontWeight: '700', color: Colors.fg, width: 24, textAlign: 'right' },
});

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  title:      { fontSize: 22, fontWeight: '800', color: Colors.fg },
  tabBar:     { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.surface2, borderRadius: 14, padding: 4 },
  tabItem:    { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabItemOn:  { backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabTxt:     { fontSize: 12, fontWeight: '600', color: Colors.fg2 },
  tabTxtOn:   { color: Colors.accent },

  card:       { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  prodName:   { fontSize: 14, fontWeight: '600', color: Colors.fg, marginBottom: 2 },
  meta:       { fontSize: 11, color: Colors.fg2 },
  amtRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  metaLbl:    { fontSize: 10, color: Colors.fg3, marginBottom: 2 },
  metaVal:    { fontSize: 12, color: Colors.fg, fontWeight: '500' },
  amount:     { fontSize: 18, fontWeight: '800' },
  btnRow:     { flexDirection: 'row', gap: 8 },
  btn:        { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  ndrBox:     { backgroundColor: '#FFF5F5', borderRadius: 8, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#FECaCa' },
  ndrTxt:     { fontSize: 11, color: Colors.error },
});
