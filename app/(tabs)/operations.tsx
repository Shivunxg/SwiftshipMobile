import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useCODOrders, useNDROrders, useRTOOrders, useInitiateRTO, usePickups } from '../../hooks/useOrders';
import { useAuth } from '../../lib/auth-store';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { Badge } from '../../components/Badge';
import type { Order } from '../../lib/types';

type Tab = 'COD' | 'NDR' | 'RTO' | 'Pickups';
const TABS: Tab[] = ['COD', 'NDR', 'RTO', 'Pickups'];

const TAB_ICONS: Record<Tab, string> = {
  COD:     '💸',
  NDR:     '⚠️',
  RTO:     '↩️',
  Pickups: '📦',
};

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

// ── Pickups list ─────────────────────────────────────────────────────────────
function PickupsList() {
  const { tenantId } = useAuth();
  const { data: pickups, isLoading } = usePickups(tenantId);
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />;

  const STATUS_COLOR: Record<string, string> = {
    PENDING:    Colors.warning,
    SCHEDULED:  Colors.accent,
    PICKED_UP:  Colors.success,
  };

  return (
    <FlatList
      data={pickups}
      keyExtractor={p => String(p.id)}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyState label="No Pickups" icon="📦" />}
      renderItem={({ item: p }) => {
        const color = STATUS_COLOR[p.status] ?? Colors.fg2;
        return (
          <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: color }]}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.prodName}>{p.contactPerson}</Text>
                <Text style={s.meta}>{p.pickupAddress}, {p.city}</Text>
              </View>
              <Badge label={p.status.replace('_', ' ')} variant={p.status === 'PICKED_UP' ? 'success' : p.status === 'SCHEDULED' ? 'accent' : 'warning'} />
            </View>
            <View style={s.amtRow}>
              <View>
                <Text style={s.metaLbl}>Packages / Weight</Text>
                <Text style={s.metaVal}>{p.totalPackages ?? '—'} pkgs · {p.totalWeight ?? '—'} kg</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.metaLbl}>Preferred Time</Text>
                <Text style={s.metaVal}>{p.preferredTime ?? '—'}</Text>
              </View>
            </View>
          </View>
        );
      }}
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
  const [tab, setTab] = useState<Tab>('COD');
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
      <FlatList
        horizontal
        data={[
          { label: 'Bulk Assign',   icon: '⚡', path: '/bulk-assign' },
          { label: 'Print Labels',  icon: '🖨',  path: '/clubbed-print' },
          { label: 'Weight Issues', icon: '⚖️', path: '/weight-discrepancy' },
        ]}
        keyExtractor={item => item.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.qaScroll}
        style={s.qaBar}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.qaChip} onPress={() => router.push(item.path as any)} activeOpacity={0.75}>
            <Text style={s.qaChipIcon}>{item.icon}</Text>
            <Text style={s.qaChipLbl}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

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
        {tab === 'COD' && <CODList onContact={setContact} />}
        {tab === 'NDR' && <NDRList onContact={setContact} />}
        {tab === 'RTO' && <RTOList />}
        {tab === 'Pickups' && <PickupsList />}
      </View>

      <WhatsAppModal order={contact} onClose={() => setContact(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  title:       { fontSize: 24, fontWeight: '800', color: Colors.fg, letterSpacing: -0.3 },
  subtitle:    { fontSize: 12, color: Colors.fg2, marginTop: 2 },

  qaBar:       { flexGrow: 0, flexShrink: 0 },
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
