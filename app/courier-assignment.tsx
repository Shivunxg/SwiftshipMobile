import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../constants/colors';
import { fmtDate } from '../lib/format';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-store';
import { useOrder } from '../hooks/useOrders';
import { getPendingShipment, clearPendingShipment } from '../lib/pending-shipment';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CourierRate {
  courierId: number;
  courierName: string;
  courierCode: string;
  serviceType: 'SURFACE' | 'AIR' | 'EXPRESS';
  zone: string;
  freightCharge: number;
  codCharge: number | null;
  fuelSurcharge: number | null;
  totalRate: number;
  edd: string | null;
  estimatedDays: number | null;
  available: boolean;
  minWeight: number | null;
  maxWeight: number | null;
}

type SortMode = 'rate' | 'edd' | 'default';

// ── Brand colors ──────────────────────────────────────────────────────────────
const BRAND: Record<string, { bg: string; text: string }> = {
  DELHIVERY:  { bg: '#E91E63', text: '#fff' },
  AMAZON:     { bg: '#FF9900', text: '#fff' },
  DTDC:       { bg: '#E53935', text: '#fff' },
  EKART:      { bg: '#00897B', text: '#fff' },
  BLUEDART:   { bg: '#003087', text: '#fff' },
  XPRESSBEES: { bg: '#FF6B00', text: '#fff' },
  SHADOWFAX:  { bg: '#6C63FF', text: '#fff' },
  ECOM:       { bg: '#1976D2', text: '#fff' },
  SMARTR:     { bg: '#43A047', text: '#fff' },
  BLITZ:      { bg: '#7B1FA2', text: '#fff' },
  MOVIN:      { bg: '#0288D1', text: '#fff' },
};
const getBrand = (code: string) =>
  Object.entries(BRAND).find(([k]) => code.toUpperCase().includes(k))?.[1] ?? { bg: Colors.accent, text: '#fff' };

// ── API ───────────────────────────────────────────────────────────────────────
function useCourierRates(params: {
  fromPincode: string; toPincode: string; weight: number; paymentMethod: string;
}) {
  const enabled = params.fromPincode.length === 6 && params.toPincode.length === 6 && params.weight > 0;
  return useQuery<CourierRate[]>({
    queryKey: ['courier-rates', params],
    queryFn: () =>
      api.get('/api/couriers/rates', { params }).then(r => r.data),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

function useAssignCourier(orderId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { courierCode: string; courierName: string }) =>
      api.post(`/api/orders/${orderId}/ship`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
}

function useCreateWithCourier() {
  const qc = useQueryClient();
  const { tenantId } = useAuth();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/api/orders/merchant/${tenantId}`, body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

// ── Courier card ──────────────────────────────────────────────────────────────
function CourierCard({
  rate, isCheapest, isFastest, selected, onSelect, loading,
}: {
  rate: CourierRate;
  isCheapest: boolean;
  isFastest: boolean;
  selected: boolean;
  onSelect: () => void;
  loading: boolean;
}) {
  const brand    = getBrand(rate.courierCode);
  const initials = rate.courierName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CO';
  const eddStr   = rate.edd
    ? fmtDate(rate.edd)
    : rate.estimatedDays ? `${rate.estimatedDays} days` : '—';

  return (
    <View style={[c.card, selected && c.cardSelected, !rate.available && c.cardDisabled]}>
      {/* Badges */}
      {(isCheapest || isFastest) && (
        <View style={c.badgeRow}>
          {isCheapest && <View style={[c.badge, { backgroundColor: Colors.successDim, borderColor: `${Colors.success}30` }]}><Text style={[c.badgeTxt, { color: Colors.success }]}>Best Value</Text></View>}
          {isFastest  && <View style={[c.badge, { backgroundColor: Colors.purpleDim,  borderColor: `${Colors.purple}30`  }]}><Text style={[c.badgeTxt, { color: Colors.purple  }]}>Fastest</Text></View>}
        </View>
      )}

      {/* Top row — logo + name + zone */}
      <View style={c.topRow}>
        <View style={[c.logo, { backgroundColor: brand.bg }]}>
          <Text style={[c.logoTxt, { color: brand.text }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={c.name}>{rate.courierName}</Text>
          <View style={c.metaRow}>
            <View style={[c.serviceTag, rate.serviceType === 'AIR' && { backgroundColor: Colors.purpleDim }]}>
              <Text style={[c.serviceTagTxt, rate.serviceType === 'AIR' && { color: Colors.purple }]}>
                {rate.serviceType === 'AIR' ? 'Air' : rate.serviceType === 'EXPRESS' ? 'Express' : 'Surface'}
              </Text>
            </View>
            {rate.zone ? (
              <View style={c.zoneTag}>
                <Text style={c.zoneTxt}>{rate.zone}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Rate breakdown */}
      <View style={c.rateGrid}>
        <View style={c.rateCell}>
          <Text style={c.rateLbl}>Freight Charge</Text>
          <Text style={c.rateVal}>₹{rate.freightCharge.toFixed(2)}</Text>
        </View>
        {rate.codCharge != null && rate.codCharge > 0 && (
          <View style={c.rateCell}>
            <Text style={c.rateLbl}>COD Charge</Text>
            <Text style={c.rateVal}>₹{rate.codCharge.toFixed(2)}</Text>
          </View>
        )}
        {rate.fuelSurcharge != null && rate.fuelSurcharge > 0 && (
          <View style={c.rateCell}>
            <Text style={c.rateLbl}>Fuel Surcharge</Text>
            <Text style={c.rateVal}>₹{rate.fuelSurcharge.toFixed(2)}</Text>
          </View>
        )}
        <View style={c.rateCell}>
          <Text style={c.rateLbl}>EDD</Text>
          <Text style={[c.rateVal, { color: Colors.accent }]}>{eddStr}</Text>
        </View>
      </View>

      {/* Footer — total + button */}
      <View style={c.footer}>
        <View>
          <Text style={c.totalLbl}>Total Rate</Text>
          <Text style={c.totalVal}>₹{rate.totalRate.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[c.assignBtn, selected && c.assignBtnSelected, !rate.available && c.assignBtnDisabled]}
          onPress={onSelect}
          disabled={!rate.available || loading}
          activeOpacity={0.8}
        >
          {loading && selected
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={[c.assignTxt, selected && { color: '#fff' }]}>
                {selected ? 'Assigning...' : rate.available ? 'Assign Courier' : 'Unavailable'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CourierAssignmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    fromPincode?: string;
    toPincode?: string;
    weight?: string;
    paymentMethod?: string;
  }>();

  const orderId = params.orderId ? Number(params.orderId) : null;
  const isExistingOrder = orderId != null;

  // For existing orders, fetch the order to get pincodes/weight
  const { data: existingOrder } = useOrder(orderId ?? 0);

  // Derive route params — from URL params (create flow) OR from existing order
  const fromPincode   = params.fromPincode   ?? existingOrder?.senderPincode   ?? '';
  const toPincode     = params.toPincode     ?? existingOrder?.receiverPincode  ?? '';
  const weight        = Number(params.weight ?? existingOrder?.weight ?? 0);
  const paymentMethod = params.paymentMethod ?? existingOrder?.paymentMethod    ?? 'PREPAID';

  const { data: rates, isLoading, refetch, isRefetching } = useCourierRates({
    fromPincode, toPincode, weight, paymentMethod,
  });

  const assignMut      = useAssignCourier(orderId);
  const createWithMut  = useCreateWithCourier();
  const anyLoading     = assignMut.isPending || createWithMut.isPending;

  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const available = useMemo(() => (rates ?? []).filter(r => r.available), [rates]);

  const sorted = useMemo(() => {
    const list = [...(rates ?? [])];
    if (sortMode === 'rate') list.sort((a, b) => a.totalRate - b.totalRate);
    if (sortMode === 'edd')  list.sort((a, b) => {
      if (!a.edd) return 1;
      if (!b.edd) return -1;
      return new Date(a.edd).getTime() - new Date(b.edd).getTime();
    });
    return list;
  }, [rates, sortMode]);

  const cheapestId = useMemo(() => available.reduce((min, r) => !min || r.totalRate < min.totalRate ? r : min, null as CourierRate | null)?.courierId, [available]);
  const fastestId  = useMemo(() => available.filter(r => r.edd).reduce((f, r) => !f || new Date(r.edd!).getTime() < new Date(f.edd!).getTime() ? r : f, null as CourierRate | null)?.courierId, [available]);

  const handleSelect = async (rate: CourierRate) => {
    if (!rate.available) return;
    setSelectedId(rate.courierId);

    if (isExistingOrder) {
      // Assign to existing order
      try {
        await assignMut.mutateAsync({ courierCode: rate.courierCode, courierName: rate.courierName });
        Alert.alert('Courier Assigned', `${rate.courierName} has been assigned to this order.`, [
          { text: 'Done', onPress: () => router.back() },
        ]);
      } catch (e: any) {
        setSelectedId(null);
        Alert.alert('Error', e?.response?.data?.message ?? 'Failed to assign courier.');
      }
      return;
    }

    // Create flow — retrieve pending shipment payload
    const pending = getPendingShipment();
    if (!pending) {
      Alert.alert('Error', 'Shipment data was lost. Please start over.');
      router.back();
      return;
    }

    try {
      await createWithMut.mutateAsync({
        ...pending,
        courierCode: rate.courierCode,
        courierPartner: rate.courierName,
        freightCharge: rate.totalRate,
      });
      clearPendingShipment();
      Alert.alert('Shipment Created', `Order placed with ${rate.courierName}.`, [
        { text: 'View Orders', onPress: () => router.replace('/(tabs)/orders') },
      ]);
    } catch (e: any) {
      setSelectedId(null);
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to create shipment.');
    }
  };

  const readyToFetch = fromPincode.length === 6 && toPincode.length === 6 && weight > 0;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Courier Assignment</Text>
        <TouchableOpacity onPress={() => { setSortMode('default'); refetch(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.resetTxt}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Route card */}
      <View style={s.routeCard}>
        <View style={s.pinBox}>
          <Text style={s.pinLabel}>Pickup</Text>
          <Text style={s.pinCode}>{fromPincode || '— — — — — —'}</Text>
        </View>
        <View style={s.arrow}>
          <View style={s.arrowLine} />
          <Text style={s.arrowHead}>›</Text>
        </View>
        <View style={[s.pinBox, { alignItems: 'flex-end' }]}>
          <Text style={s.pinLabel}>Destination</Text>
          <Text style={s.pinCode}>{toPincode || '— — — — — —'}</Text>
        </View>
      </View>

      {/* Shipment info strip */}
      <View style={s.infoStrip}>
        <InfoPill label="Weight"  value={`${weight || '—'} kg`} />
        <View style={s.infoDiv} />
        <InfoPill label="Payment" value={paymentMethod === 'COD' ? 'COD' : 'Prepaid'} />
        <View style={s.infoDiv} />
        <InfoPill label="Available" value={`${available.length} couriers`} />
      </View>

      {/* Sort tabs */}
      <View style={s.sortBar}>
        <Text style={s.sortLabel}>Sort by:</Text>
        {([['default', 'Default'], ['rate', 'Lowest Rate'], ['edd', 'Fastest Delivery']] as [SortMode, string][]).map(([mode, label]) => (
          <TouchableOpacity
            key={mode}
            style={[s.sortChip, sortMode === mode && s.sortChipOn]}
            onPress={() => setSortMode(mode)}
            activeOpacity={0.7}
          >
            <Text style={[s.sortChipTxt, sortMode === mode && s.sortChipTxtOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {!readyToFetch ? (
        <View style={s.placeholder}>
          <View style={s.placeholderIcon}><Text style={s.placeholderIconTxt}>→</Text></View>
          <Text style={s.placeholderTitle}>Route Required</Text>
          <Text style={s.placeholderSub}>Pickup pincode, destination pincode and weight are needed to fetch courier rates.</Text>
        </View>
      ) : isLoading ? (
        <View style={s.placeholder}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={s.loadingTxt}>Fetching best rates...</Text>
        </View>
      ) : sorted.length === 0 ? (
        <View style={s.placeholder}>
          <View style={s.placeholderIcon}><Text style={s.placeholderIconTxt}>—</Text></View>
          <Text style={s.placeholderTitle}>No Couriers Available</Text>
          <Text style={s.placeholderSub}>No couriers service this route. Try a different weight or check pincode.</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={r => String(r.courierId)}
          renderItem={({ item }) => (
            <CourierCard
              rate={item}
              isCheapest={item.courierId === cheapestId}
              isFastest={item.courierId === fastestId}
              selected={selectedId === item.courierId}
              onSelect={() => handleSelect(item)}
              loading={anyLoading}
            />
          )}
          contentContainerStyle={{ padding: 12, paddingBottom: 36, gap: 12 }}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          ListHeaderComponent={
            <Text style={s.countHdr}>{sorted.length} courier{sorted.length !== 1 ? 's' : ''} · {available.length} available</Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoPill}>
      <Text style={s.infoPillLbl}>{label}</Text>
      <Text style={s.infoPillVal}>{value}</Text>
    </View>
  );
}

const c = StyleSheet.create({
  card:           { backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardSelected:   { borderColor: Colors.accent, borderWidth: 1.5 },
  cardDisabled:   { opacity: 0.5 },

  badgeRow:       { flexDirection: 'row', gap: 6, marginBottom: 10 },
  badge:          { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeTxt:       { fontSize: 10, fontWeight: '700' },

  topRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  logo:           { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoTxt:        { fontSize: 13, fontWeight: '800' },
  name:           { fontSize: 15, fontWeight: '700', color: Colors.fg, marginBottom: 5 },
  metaRow:        { flexDirection: 'row', gap: 6 },
  serviceTag:     { backgroundColor: Colors.warningDim, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  serviceTagTxt:  { fontSize: 10, fontWeight: '700', color: Colors.warning },
  zoneTag:        { backgroundColor: Colors.accentDim, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  zoneTxt:        { fontSize: 10, fontWeight: '600', color: Colors.accent },

  rateGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 14 },
  rateCell:       { minWidth: '40%' },
  rateLbl:        { fontSize: 10, color: Colors.fg3, marginBottom: 3, fontWeight: '500' },
  rateVal:        { fontSize: 13, fontWeight: '600', color: Colors.fg },

  footer:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLbl:       { fontSize: 11, color: Colors.fg2, marginBottom: 3 },
  totalVal:       { fontSize: 20, fontWeight: '800', color: Colors.fg },
  assignBtn:      { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  assignBtnSelected: { backgroundColor: Colors.accent },
  assignBtnDisabled: { borderColor: Colors.fg3, backgroundColor: Colors.surface2 },
  assignTxt:      { fontSize: 13, fontWeight: '700', color: Colors.accent },
});

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },

  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:        { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30, width: 36 },
  title:          { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.fg, textAlign: 'center' },
  resetTxt:       { fontSize: 13, color: Colors.fg2, fontWeight: '600', width: 44, textAlign: 'right' },

  routeCard:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 12, marginBottom: 8, backgroundColor: Colors.accent, borderRadius: 18, padding: 18, gap: 10 },
  pinBox:         { flex: 1 },
  pinLabel:       { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 4, fontWeight: '600' },
  pinCode:        { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  arrow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  arrowLine:      { width: 24, height: 2, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 },
  arrowHead:      { fontSize: 20, color: '#fff', marginLeft: -4, fontWeight: '300' },

  infoStrip:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 10 },
  infoPill:       { flex: 1, alignItems: 'center', gap: 2 },
  infoPillLbl:    { fontSize: 10, color: Colors.fg3, fontWeight: '500' },
  infoPillVal:    { fontSize: 13, fontWeight: '700', color: Colors.fg },
  infoDiv:        { width: 1, height: 28, backgroundColor: Colors.border },

  sortBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 7, marginBottom: 4, flexWrap: 'wrap' },
  sortLabel:      { fontSize: 11, color: Colors.fg3, fontWeight: '600' },
  sortChip:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sortChipOn:     { backgroundColor: Colors.accent, borderColor: Colors.accent },
  sortChipTxt:    { fontSize: 11, fontWeight: '600', color: Colors.fg2 },
  sortChipTxtOn:  { color: '#fff' },

  countHdr:       { fontSize: 11, color: Colors.fg3, marginBottom: 6, paddingHorizontal: 4 },

  placeholder:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  placeholderIcon:{ width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  placeholderIconTxt: { fontSize: 24, fontWeight: '700', color: Colors.fg2 },
  placeholderTitle:{ fontSize: 17, fontWeight: '700', color: Colors.fg },
  placeholderSub: { fontSize: 13, color: Colors.fg2, textAlign: 'center', lineHeight: 20 },
  loadingTxt:     { fontSize: 13, color: Colors.fg2, marginTop: 12 },
});
