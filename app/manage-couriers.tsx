import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity,
  Switch, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../constants/colors';
import { useAuth } from '../lib/auth-store';
import { api } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Courier {
  id: number;
  name: string;
  code: string;
  logoInitials: string;
  logoColor: string;
  serviceType: 'SURFACE' | 'AIR' | 'EXPRESS';
  weightSlab: string;
  zone: string;
  enabled: boolean;
  addedAt: string | null;
  estimatedDelivery: string | null;
  baseRate: number | null;
}

type FilterTab = 'All' | 'Active' | 'Inactive';

// Known courier brand colors
const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  DELHIVERY:   { bg: '#E91E63', text: '#fff' },
  AMAZON:      { bg: '#FF9900', text: '#fff' },
  DTDC:        { bg: '#E53935', text: '#fff' },
  EKART:       { bg: '#00897B', text: '#fff' },
  BLUEDART:    { bg: '#003087', text: '#fff' },
  XPRESSBEES:  { bg: '#FF6B00', text: '#fff' },
  SHADOWFAX:   { bg: '#6C63FF', text: '#fff' },
  ECOM:        { bg: '#1976D2', text: '#fff' },
  SMARTR:      { bg: '#43A047', text: '#fff' },
  BLITZ:       { bg: '#7B1FA2', text: '#fff' },
  MOVIN:       { bg: '#0288D1', text: '#fff' },
  DEFAULT:     { bg: Colors.accent, text: '#fff' },
};

function getBrand(code: string) {
  const key = Object.keys(BRAND_COLORS).find(k => code.toUpperCase().includes(k)) ?? 'DEFAULT';
  return BRAND_COLORS[key];
}

// ── API hooks ─────────────────────────────────────────────────────────────────
function useCouriers(tenantId: number) {
  return useQuery<Courier[]>({
    queryKey: ['couriers', tenantId],
    queryFn: () => api.get(`/api/couriers/merchant/${tenantId}`).then(r => r.data),
    enabled: !!tenantId,
  });
}

function useToggleCourier() {
  const qc = useQueryClient();
  const { tenantId } = useAuth();
  return useMutation({
    mutationFn: ({ courierId, enabled }: { courierId: number; enabled: boolean }) =>
      api.put(`/api/couriers/${courierId}/toggle`, { enabled }),
    onMutate: async ({ courierId, enabled }) => {
      await qc.cancelQueries({ queryKey: ['couriers', tenantId] });
      const prev = qc.getQueryData<Courier[]>(['couriers', tenantId]);
      qc.setQueryData<Courier[]>(['couriers', tenantId], old =>
        old?.map(c => c.id === courierId ? { ...c, enabled } : c) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['couriers', tenantId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['couriers', tenantId] }),
  });
}

// ── Courier row ───────────────────────────────────────────────────────────────
const CourierRow = React.memo(function CourierRow({
  courier, onToggle,
}: { courier: Courier; onToggle: (id: number, val: boolean) => void }) {
  const brand    = getBrand(courier.code);
  const initials = courier.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CO';
  const addedStr = courier.addedAt
    ? new Date(courier.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <View style={r.row}>
      {/* Logo */}
      <View style={[r.logo, { backgroundColor: brand.bg }]}>
        <Text style={[r.logoTxt, { color: brand.text }]}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={r.info}>
        <Text style={r.name} numberOfLines={1}>{courier.name}</Text>
        <View style={r.metaRow}>
          <View style={r.slabTag}>
            <Text style={r.slabTxt}>Slab: {courier.weightSlab}</Text>
          </View>
          {courier.zone ? (
            <View style={r.zoneTag}>
              <Text style={r.zoneTxt}>{courier.zone}</Text>
            </View>
          ) : null}
          {courier.serviceType ? (
            <View style={[r.typeTag, courier.serviceType === 'AIR' && { backgroundColor: Colors.purpleDim }]}>
              <Text style={[r.typeTxt, courier.serviceType === 'AIR' && { color: Colors.purple }]}>
                {courier.serviceType}
              </Text>
            </View>
          ) : null}
        </View>
        {addedStr ? <Text style={r.added}>{addedStr}</Text> : null}
      </View>

      {/* Toggle */}
      <Switch
        value={courier.enabled}
        onValueChange={val => onToggle(courier.id, val)}
        trackColor={{ false: Colors.surface3, true: `${Colors.accent}60` }}
        thumbColor={courier.enabled ? Colors.accent : Colors.fg3}
        ios_backgroundColor={Colors.surface3}
      />
    </View>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ManageCouriersScreen() {
  const router  = useRouter();
  const { tenantId } = useAuth();
  const { data: couriers, isLoading, refetch, isRefetching } = useCouriers(tenantId);
  const toggleMut = useToggleCourier();

  const [search, setSearch]   = useState('');
  const [tab, setTab]         = useState<FilterTab>('All');
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);

  const handleToggle = useCallback((id: number, val: boolean) => {
    toggleMut.mutate({ courierId: id, enabled: val });
  }, [toggleMut]);

  const all = couriers ?? [];
  const activeCount   = all.filter(c => c.enabled).length;
  const inactiveCount = all.filter(c => !c.enabled).length;

  const filtered = useMemo(() => {
    let list = all;
    if (tab === 'Active')   list = list.filter(c => c.enabled);
    if (tab === 'Inactive') list = list.filter(c => !c.enabled);
    if (serviceFilter)      list = list.filter(c => c.serviceType === serviceFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    return list;
  }, [all, tab, serviceFilter, search]);

  const serviceTypes = useMemo(
    () => [...new Set(all.map(c => c.serviceType).filter(Boolean))],
    [all]
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Manage Couriers</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeTxt}>{activeCount} active</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchLbl}>Search</Text>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by courier name..."
          placeholderTextColor={Colors.fg3}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status tabs */}
      <View style={s.tabRow}>
        {(['All', 'Active', 'Inactive'] as FilterTab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tabChip, tab === t && s.tabChipOn]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>
              {t}
              {t === 'All'      ? ` (${all.length})`     : ''}
              {t === 'Active'   ? ` (${activeCount})`    : ''}
              {t === 'Inactive' ? ` (${inactiveCount})`  : ''}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Service type filter */}
        {serviceTypes.map(type => (
          <TouchableOpacity
            key={type}
            style={[s.tabChip, serviceFilter === type && s.tabChipService]}
            onPress={() => setServiceFilter(prev => prev === type ? null : type)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabTxt, serviceFilter === type && s.tabTxtService]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats strip */}
      <View style={s.statsStrip}>
        <View style={s.statItem}>
          <Text style={[s.statVal, { color: Colors.success }]}>{activeCount}</Text>
          <Text style={s.statLbl}>Enabled</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={[s.statVal, { color: Colors.fg2 }]}>{inactiveCount}</Text>
          <Text style={s.statLbl}>Disabled</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={[s.statVal, { color: Colors.accent }]}>{all.length}</Text>
          <Text style={s.statLbl}>Total</Text>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => String(c.id)}
          renderItem={({ item }) => <CourierRow courier={item} onToggle={handleToggle} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={Colors.accent} />}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}><Text style={s.emptyIconTxt}>—</Text></View>
              <Text style={s.emptyTitle}>No Couriers Found</Text>
              <Text style={s.emptySub}>
                {search ? 'Try a different search term' : 'No couriers match the selected filter'}
              </Text>
            </View>
          }
          ListHeaderComponent={
            filtered.length > 0 ? (
              <Text style={s.listCount}>{filtered.length} courier{filtered.length !== 1 ? 's' : ''}</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const r = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: Colors.surface },
  logo:     { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoTxt:  { fontSize: 14, fontWeight: '800' },
  info:     { flex: 1, gap: 5 },
  name:     { fontSize: 14, fontWeight: '600', color: Colors.fg },
  metaRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  slabTag:  { backgroundColor: Colors.accentDim, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  slabTxt:  { fontSize: 10, fontWeight: '600', color: Colors.accent },
  zoneTag:  { backgroundColor: Colors.surface2, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  zoneTxt:  { fontSize: 10, fontWeight: '600', color: Colors.fg2 },
  typeTag:  { backgroundColor: Colors.warningDim, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  typeTxt:  { fontSize: 10, fontWeight: '600', color: Colors.warning },
  added:    { fontSize: 10, color: Colors.fg3 },
});

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },

  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30 },
  title:        { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.fg },
  headerBadge:  { backgroundColor: Colors.successDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.success}25` },
  headerBadgeTxt: { fontSize: 11, fontWeight: '700', color: Colors.success },

  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, marginBottom: 8, backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  searchLbl:    { fontSize: 13, color: Colors.fg3 },
  searchInput:  { flex: 1, height: 44, fontSize: 13, color: Colors.fg },
  clearBtn:     { fontSize: 13, color: Colors.fg3 },

  tabRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 12, paddingBottom: 10 },
  tabChip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  tabChipOn:    { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabChipService:{ backgroundColor: Colors.purpleDim, borderColor: Colors.purple },
  tabTxt:       { fontSize: 12, fontWeight: '600', color: Colors.fg2 },
  tabTxtOn:     { color: '#fff' },
  tabTxtService:{ color: Colors.purple },

  statsStrip:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12 },
  statItem:     { flex: 1, alignItems: 'center', gap: 2 },
  statVal:      { fontSize: 20, fontWeight: '800' },
  statLbl:      { fontSize: 10, color: Colors.fg2, fontWeight: '500' },
  statDivider:  { width: 1, height: 32, backgroundColor: Colors.border },

  sep:          { height: 1, backgroundColor: Colors.border, marginLeft: 74 },
  listCount:    { fontSize: 11, color: Colors.fg3, padding: 12, paddingBottom: 6 },

  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:    { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  emptyIconTxt: { fontSize: 22, fontWeight: '700', color: Colors.fg2 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: Colors.fg, marginBottom: 6 },
  emptySub:     { fontSize: 13, color: Colors.fg2, textAlign: 'center', lineHeight: 20 },
});
