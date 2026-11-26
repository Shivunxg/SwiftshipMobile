import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../constants/colors';
import { fmtDate } from '../lib/format';
import { useOrders, useBulkAssignCourier } from '../hooks/useOrders';
import { useAuth } from '../lib/auth-store';
import { api } from '../lib/api';
import type { Order } from '../lib/types';

interface CourierOption {
  courierId: number;
  courierName: string;
  courierCode: string;
  serviceType: string;
  totalRate: number;
}

const BRAND: Record<string, { bg: string }> = {
  DELHIVERY:  { bg: '#E91E63' },
  AMAZON:     { bg: '#FF9900' },
  DTDC:       { bg: '#E53935' },
  EKART:      { bg: '#00897B' },
  BLUEDART:   { bg: '#003087' },
  XPRESSBEES: { bg: '#FF6B00' },
  SHADOWFAX:  { bg: '#6C63FF' },
  ECOM:       { bg: '#1976D2' },
  SMARTR:     { bg: '#43A047' },
};
function brandBg(code: string): string {
  const key = Object.keys(BRAND).find(k => code.toUpperCase().includes(k));
  return key ? BRAND[key].bg : Colors.accent;
}

function useCouriersForTenant() {
  const { tenantId } = useAuth();
  return useQuery<CourierOption[]>({
    queryKey: ['couriers-bulk', tenantId],
    queryFn: () => api.get(`/api/couriers/merchant/${tenantId}`).then(r =>
      (r.data as any[]).filter(c => c.enabled).map(c => ({
        courierId: c.id,
        courierName: c.name,
        courierCode: c.code,
        serviceType: c.serviceType,
        totalRate: c.baseRate ?? 0,
      }))
    ),
    enabled: !!tenantId,
  });
}

function OrderRow({ order, selected, onToggle }: {
  order: Order; selected: boolean; onToggle: (id: number) => void;
}) {
  return (
    <TouchableOpacity style={[or.row, selected && or.rowSel]} onPress={() => onToggle(order.id)} activeOpacity={0.75}>
      <View style={[or.check, selected && or.checkOn]}>
        {selected && <Text style={or.checkTxt}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={or.id}>#{order.orderNumber}</Text>
        <Text style={or.meta} numberOfLines={1}>{order.receiverName} · {order.receiverCity}</Text>
        <Text style={or.weight}>{order.weight ?? '—'} kg · {order.paymentMethod}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[or.statusBadge, { backgroundColor: order.status === 'ORDER_CREATED' ? Colors.accentDim : Colors.warningDim }]}>
          <Text style={[or.statusTxt, { color: order.status === 'ORDER_CREATED' ? Colors.accent : Colors.warning }]}>
            {order.status === 'ORDER_CREATED' ? 'New' : 'Awaiting'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const or = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: Colors.surface },
  rowSel:     { backgroundColor: Colors.accentDim },
  check:      { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2 },
  checkOn:    { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkTxt:   { fontSize: 12, color: '#fff', fontWeight: '700' },
  id:         { fontSize: 13, fontWeight: '600', color: Colors.fg, marginBottom: 2 },
  meta:       { fontSize: 11, color: Colors.fg2, marginBottom: 2 },
  weight:     { fontSize: 10, color: Colors.fg3 },
  statusBadge:{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  statusTxt:  { fontSize: 10, fontWeight: '700' },
});

function CourierCard({ courier, selected, onSelect }: {
  courier: CourierOption; selected: boolean; onSelect: () => void;
}) {
  const bg = brandBg(courier.courierCode);
  const initials = courier.courierName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CO';
  return (
    <TouchableOpacity style={[cc.card, selected && cc.cardSel]} onPress={onSelect} activeOpacity={0.75}>
      <View style={[cc.logo, { backgroundColor: bg }]}>
        <Text style={cc.logoTxt}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={cc.name}>{courier.courierName}</Text>
        <Text style={cc.type}>{courier.serviceType}</Text>
      </View>
      {selected && <View style={cc.selectedDot}><Text style={cc.selectedDotTxt}>✓</Text></View>}
    </TouchableOpacity>
  );
}

const cc = StyleSheet.create({
  card:          { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  cardSel:       { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  logo:          { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoTxt:       { fontSize: 13, fontWeight: '800', color: '#fff' },
  name:          { fontSize: 13, fontWeight: '600', color: Colors.fg, marginBottom: 2 },
  type:          { fontSize: 11, color: Colors.fg2 },
  selectedDot:   { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  selectedDotTxt:{ fontSize: 12, color: '#fff', fontWeight: '700' },
});

type Step = 'selectOrders' | 'selectCourier' | 'confirm';

export default function BulkAssignScreen() {
  const router = useRouter();
  const { data: allOrders, isLoading: ordersLoading } = useOrders();
  const { data: couriers, isLoading: couriersLoading } = useCouriersForTenant();
  const bulkMut = useBulkAssignCourier();

  const [step, setStep] = useState<Step>('selectOrders');
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(null);
  const [search, setSearch] = useState('');

  const eligible = useMemo(() =>
    (allOrders ?? []).filter(o =>
      o.status === 'ORDER_CREATED' || o.status === 'AWAITING_PICKUP'
    ),
    [allOrders]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return eligible;
    const q = search.trim().toLowerCase();
    return eligible.filter(o =>
      o.orderNumber?.toLowerCase().includes(q) ||
      o.receiverName?.toLowerCase().includes(q)
    );
  }, [eligible, search]);

  const toggleOrder = (id: number) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedOrders.size === filtered.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(filtered.map(o => o.id)));
  };

  const handleAssign = () => {
    if (!selectedCourier) return;
    Alert.alert(
      'Confirm Bulk Assignment',
      `Assign ${selectedCourier.courierName} to ${selectedOrders.size} order${selectedOrders.size !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: () => bulkMut.mutate(
            {
              orderIds: Array.from(selectedOrders),
              courierCode: selectedCourier.courierCode,
              courierName: selectedCourier.courierName,
            },
            {
              onSuccess: (data) => {
                Alert.alert('Done', `${data?.assigned ?? selectedOrders.size} orders assigned to ${selectedCourier.courierName}.`);
                router.back();
              },
              onError: () => Alert.alert('Error', 'Bulk assignment failed. Please try again.'),
            }
          ),
        },
      ]
    );
  };

  const isLoading = ordersLoading || couriersLoading;
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => { if (step === 'selectOrders') router.back(); else setStep(step === 'confirm' ? 'selectCourier' : 'selectOrders'); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Bulk Courier Assignment</Text>
      </View>

      {/* Step indicator */}
      <View style={s.stepRow}>
        {(['selectOrders', 'selectCourier', 'confirm'] as Step[]).map((st, i) => {
          const idx = ['selectOrders', 'selectCourier', 'confirm'].indexOf(step);
          const done = i < idx;
          const active = st === step;
          return (
            <React.Fragment key={st}>
              <View style={[s.stepDot, active && s.stepDotActive, done && s.stepDotDone]}>
                <Text style={[s.stepDotTxt, (active || done) && s.stepDotTxtOn]}>{done ? '✓' : String(i + 1)}</Text>
              </View>
              {i < 2 && <View style={[s.stepLine, (done || active) && s.stepLineActive]} />}
            </React.Fragment>
          );
        })}
      </View>

      {step === 'selectOrders' && (
        <>
          <View style={s.searchRow}>
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search orders..."
              placeholderTextColor={Colors.fg3}
            />
          </View>
          <View style={s.selectBar}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={selectAll}>
              <View style={[s.check, selectedOrders.size === filtered.length && filtered.length > 0 && s.checkOn]}>
                {selectedOrders.size === filtered.length && filtered.length > 0 && <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.fg }}>Select All</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: Colors.fg2 }}>{selectedOrders.size} selected</Text>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={o => String(o.id)}
            renderItem={({ item }) => <OrderRow order={item} selected={selectedOrders.has(item.id)} onToggle={toggleOrder} />}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyTitle}>No Eligible Orders</Text>
                <Text style={s.emptySub}>Only new and awaiting orders can be bulk assigned</Text>
              </View>
            }
          />
          <View style={s.bottomBar}>
            <TouchableOpacity
              style={[s.nextBtn, selectedOrders.size === 0 && { opacity: 0.4 }]}
              onPress={() => setStep('selectCourier')}
              disabled={selectedOrders.size === 0}
            >
              <Text style={s.nextBtnTxt}>Next: Select Courier ({selectedOrders.size})</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'selectCourier' && (
        <>
          <Text style={s.stepTitle}>Choose a Courier Partner</Text>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {(couriers ?? []).map(c => (
              <CourierCard
                key={c.courierId}
                courier={c}
                selected={selectedCourier?.courierId === c.courierId}
                onSelect={() => setSelectedCourier(c)}
              />
            ))}
          </ScrollView>
          <View style={s.bottomBar}>
            <TouchableOpacity
              style={[s.nextBtn, !selectedCourier && { opacity: 0.4 }]}
              onPress={() => setStep('confirm')}
              disabled={!selectedCourier}
            >
              <Text style={s.nextBtnTxt}>Next: Review & Confirm</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'confirm' && selectedCourier && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <View style={s.confirmCard}>
            <Text style={s.confirmTitle}>Assignment Summary</Text>
            <View style={s.confirmRow}>
              <Text style={s.confirmLabel}>Courier</Text>
              <Text style={s.confirmValue}>{selectedCourier.courierName}</Text>
            </View>
            <View style={s.confirmRow}>
              <Text style={s.confirmLabel}>Service Type</Text>
              <Text style={s.confirmValue}>{selectedCourier.serviceType}</Text>
            </View>
            <View style={[s.confirmRow, { borderBottomWidth: 0 }]}>
              <Text style={s.confirmLabel}>Orders to Assign</Text>
              <Text style={[s.confirmValue, { color: Colors.accent, fontWeight: '700' }]}>{selectedOrders.size}</Text>
            </View>
          </View>

          <Text style={[s.stepTitle, { marginTop: 8 }]}>Selected Orders</Text>
          {Array.from(selectedOrders).map(id => {
            const o = eligible.find(x => x.id === id);
            if (!o) return null;
            return (
              <View key={id} style={s.confirmOrderRow}>
                <Text style={s.confirmOrderNum}>#{o.orderNumber}</Text>
                <Text style={s.confirmOrderMeta}>{o.receiverName} · {o.receiverCity}</Text>
              </View>
            );
          })}

          <View style={s.bottomBar}>
            <TouchableOpacity
              style={[s.nextBtn, bulkMut.isPending && { opacity: 0.6 }]}
              onPress={handleAssign}
              disabled={bulkMut.isPending}
            >
              {bulkMut.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.nextBtnTxt}>Assign {selectedCourier.courierName} to {selectedOrders.size} Orders</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30 },
  title:        { fontSize: 17, fontWeight: '700', color: Colors.fg },

  stepRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  stepDot:      { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface2, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:{ borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  stepDotDone:  { borderColor: Colors.success, backgroundColor: Colors.successDim },
  stepDotTxt:   { fontSize: 11, fontWeight: '700', color: Colors.fg3 },
  stepDotTxtOn: { color: Colors.fg },
  stepLine:     { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineActive:{ backgroundColor: Colors.accent },

  stepTitle:    { fontSize: 13, fontWeight: '700', color: Colors.fg2, paddingHorizontal: 16, paddingVertical: 10 },

  searchRow:    { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput:  { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: Colors.fg },

  selectBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.surface, borderBottomWidth: 1, borderTopWidth: 1, borderColor: Colors.border },
  check:        { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2 },
  checkOn:      { backgroundColor: Colors.accent, borderColor: Colors.accent },

  confirmCard:  { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 16 },
  confirmTitle: { fontSize: 13, fontWeight: '700', color: Colors.fg2, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, textTransform: 'uppercase', letterSpacing: 0.5 },
  confirmRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.border },
  confirmLabel: { fontSize: 13, color: Colors.fg2 },
  confirmValue: { fontSize: 13, fontWeight: '600', color: Colors.fg },
  confirmOrderRow:{ backgroundColor: Colors.surface, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  confirmOrderNum:{ fontSize: 13, fontWeight: '600', color: Colors.fg, marginBottom: 2 },
  confirmOrderMeta:{ fontSize: 11, color: Colors.fg2 },

  empty:        { alignItems: 'center', padding: 48 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 6 },
  emptySub:     { fontSize: 13, color: Colors.fg2, textAlign: 'center' },

  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 28, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  nextBtn:      { backgroundColor: Colors.accent, borderRadius: 16, padding: 16, alignItems: 'center' },
  nextBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '700' },
});
