import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useOrders, useApproveOrder } from '../../hooks/useOrders';
import { OrderCard } from '../../components/OrderCard';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import type { Order } from '../../lib/types';

type Filter = 'All' | 'New' | 'In Transit' | 'OFD' | 'Delivered' | 'NDR' | 'RTO' | 'COD';

const FILTERS: Filter[] = ['All', 'New', 'In Transit', 'OFD', 'Delivered', 'NDR', 'RTO', 'COD'];

const FILTER_COLORS: Record<Filter, string> = {
  All:          Colors.fg,
  New:          Colors.accent,
  'In Transit': Colors.warning,
  OFD:          Colors.purple,
  Delivered:    Colors.success,
  NDR:          Colors.error,
  RTO:          Colors.fg2,
  COD:          '#D97706',
};

function matchFilter(o: Order, filter: Filter): boolean {
  switch (filter) {
    case 'All':        return true;
    case 'New':        return o.status === 'ORDER_CREATED' || o.status === 'AWAITING_PICKUP';
    case 'In Transit': return o.status === 'IN_TRANSIT' || o.status === 'PICKED_UP';
    case 'OFD':        return o.status === 'OUT_FOR_DELIVERY';
    case 'Delivered':  return o.status === 'DELIVERED';
    case 'NDR':        return o.status === 'DELIVERY_FAILED' || o.status === 'NDR';
    case 'RTO':        return o.status?.startsWith('RTO') ?? false;
    case 'COD':        return o.paymentMethod === 'COD';
  }
}

function EmptyState({ filter }: { filter: Filter }) {
  const isNDR = filter === 'NDR';
  return (
    <View style={es.wrap}>
      <View style={[es.iconBox, isNDR && { backgroundColor: Colors.successDim, borderColor: `${Colors.success}30` }]}>
        <Text style={[es.iconEmoji]}>{isNDR ? '✓' : '📦'}</Text>
      </View>
      <Text style={es.title}>
        {isNDR ? 'No NDR Orders' : `No ${filter === 'All' ? '' : filter + ' '}Orders`}
      </Text>
      <Text style={es.sub}>
        {isNDR
          ? 'All deliveries are running smoothly'
          : 'Pull down to refresh or change the filter'}
      </Text>
    </View>
  );
}

export default function OrdersScreen() {
  const { data: orders, isLoading, isError, refetch, isRefetching } = useOrders();
  const approveMut = useApproveOrder();
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [contact, setContact] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    let list = orders?.filter(o => matchFilter(o, filter)) ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.receiverName?.toLowerCase().includes(q) ||
        o.receiverCity?.toLowerCase().includes(q) ||
        o.awbNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  const counts = useMemo(() => {
    const o = orders ?? [];
    return Object.fromEntries(
      FILTERS.map(f => [f, f === 'All' ? o.length : o.filter(x => matchFilter(x, f)).length])
    ) as Record<Filter, number>;
  }, [orders]);

  const activeColor = FILTER_COLORS[filter] ?? Colors.accent;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Orders</Text>
          <Text style={s.subtitle}>{counts.All} shipments total</Text>
        </View>
        {counts.NDR > 0 && (
          <View style={s.ndrAlert}>
            <Text style={s.ndrAlertTxt}>{counts.NDR} NDR</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={s.searchBar}>
        <Text style={s.searchMagnifier}>⌕</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Order ID, customer name, AWB..."
          placeholderTextColor={Colors.fg3}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View style={s.clearBtn}><Text style={s.clearBtnTxt}>✕</Text></View>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills - scrollable */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.pillsRow}
        style={s.pillsBar}
        renderItem={({ item: f }) => {
          const active = filter === f;
          const cnt    = counts[f];
          const col    = FILTER_COLORS[f] ?? Colors.accent;
          return (
            <TouchableOpacity
              style={[s.pill, active && { backgroundColor: col, borderColor: col }]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[s.pillTxt, active && s.pillTxtOn]}>{f}</Text>
              {cnt > 0 && (
                <View style={[s.pillBadge, active && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <Text style={[s.pillBadgeTxt, active && { color: '#fff' }]}>{cnt}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Count strip */}
      {!isLoading && (
        <View style={s.countStrip}>
          <Text style={s.countTxt}>
            Showing <Text style={{ color: activeColor, fontWeight: '700' }}>{filtered.length}</Text>
            {filter !== 'All' ? ` ${filter}` : ''} order{filtered.length !== 1 ? 's' : ''}
            {search ? ` · "${search}"` : ''}
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={{ fontSize: 13, color: Colors.fg2, marginTop: 12 }}>Loading orders...</Text>
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 32, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 8 }}>Could not load orders</Text>
          <Text style={{ fontSize: 13, color: Colors.fg2, textAlign: 'center', marginBottom: 24 }}>Check your connection and try again</Text>
          <TouchableOpacity style={{ backgroundColor: Colors.accent, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }} onPress={() => { refetch(); }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={o => String(o.id)}
          renderItem={({ item }) => <OrderCard order={item} onContact={setContact} onApprove={(id) => approveMut.mutate(id)} approvePending={approveMut.isPending} />}
          onRefresh={() => { refetch(); }}
          refreshing={isRefetching}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 24, paddingTop: 4 }}
          ListEmptyComponent={<EmptyState filter={filter} />}
        />
      )}

      <WhatsAppModal order={contact} onClose={() => setContact(null)} />
    </SafeAreaView>
  );
}

const es = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 18, borderWidth: 1, borderColor: Colors.border },
  iconEmoji: { fontSize: 28 },
  title:   { fontSize: 18, fontWeight: '700', color: Colors.fg, marginBottom: 8, textAlign: 'center' },
  sub:     { fontSize: 13, color: Colors.fg2, textAlign: 'center', lineHeight: 20 },
});

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },

  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  title:         { fontSize: 24, fontWeight: '800', color: Colors.fg, letterSpacing: -0.3 },
  subtitle:      { fontSize: 12, color: Colors.fg2, marginTop: 2 },
  ndrAlert:      { backgroundColor: Colors.error, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  ndrAlertTxt:   { fontSize: 12, color: '#fff', fontWeight: '700' },

  searchBar:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.border, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  searchMagnifier: { fontSize: 20, color: Colors.fg3 },
  searchInput:   { flex: 1, height: 46, fontSize: 14, color: Colors.fg },
  clearBtn:      { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  clearBtnTxt:   { fontSize: 11, color: Colors.fg3, fontWeight: '700' },

  pillsBar:      { flexGrow: 0, flexShrink: 0 },
  pillsRow:      { paddingHorizontal: 16, gap: 8, paddingBottom: 10, alignItems: 'center' },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  pillTxt:       { fontSize: 12, fontWeight: '600', color: Colors.fg2 },
  pillTxtOn:     { color: '#fff' },
  pillBadge:     { backgroundColor: Colors.surface2, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  pillBadgeTxt:  { fontSize: 10, fontWeight: '700', color: Colors.fg2 },

  countStrip:    { paddingHorizontal: 20, paddingBottom: 8 },
  countTxt:      { fontSize: 12, color: Colors.fg2 },
});
