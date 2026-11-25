import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useOrders } from '../../hooks/useOrders';
import { OrderCard } from '../../components/OrderCard';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import type { Order } from '../../lib/types';

type Filter = 'All' | 'New' | 'In Transit' | 'OFD' | 'Delivered' | 'NDR' | 'RTO' | 'COD';

const FILTERS: Filter[] = ['All', 'New', 'In Transit', 'OFD', 'Delivered', 'NDR', 'RTO', 'COD'];

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
  return (
    <View style={es.wrap}>
      <View style={es.iconBox}>
        <Text style={es.iconTxt}>{filter === 'NDR' ? '✓' : '—'}</Text>
      </View>
      <Text style={es.title}>
        {filter === 'NDR' ? 'No NDR Orders' : `No ${filter === 'All' ? '' : filter + ' '}Orders`}
      </Text>
      <Text style={es.sub}>
        {filter === 'NDR'
          ? 'All deliveries are running smoothly'
          : 'Pull down to refresh or change the filter'}
      </Text>
    </View>
  );
}

export default function OrdersScreen() {
  const { data: orders, isLoading, refetch, isRefetching } = useOrders();
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

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Orders</Text>
        <View style={s.totalBadge}>
          <Text style={s.totalBadgeTxt}>{counts.All} total</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>Search</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search order ID, name, city, AWB..."
          placeholderTextColor={Colors.fg3}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipScroll}
        style={s.chipBar}
      >
        {FILTERS.map(f => {
          const active = filter === f;
          const cnt = counts[f];
          return (
            <TouchableOpacity
              key={f}
              style={[s.chip, active && s.chipOn]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipTxt, active && s.chipTxtOn]}>{f}</Text>
              {cnt > 0 && (
                <View style={[s.chipBadge, active && s.chipBadgeOn]}>
                  <Text style={[s.chipBadgeTxt, active && s.chipBadgeTxtOn]}>{cnt}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filtered}
            keyExtractor={o => String(o.id)}
            renderItem={({ item }) => <OrderCard order={item} onContact={setContact} />}
            onRefresh={() => { refetch(); }}
            refreshing={isRefetching}
            contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 24, paddingTop: 4 }}
            ListEmptyComponent={<EmptyState filter={filter} />}
          />
        </View>
      )}

      <WhatsAppModal order={contact} onClose={() => setContact(null)} />
    </SafeAreaView>
  );
}

const es = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  iconTxt: { fontSize: 22, fontWeight: '700', color: Colors.fg2 },
  title:   { fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 8, textAlign: 'center' },
  sub:     { fontSize: 13, color: Colors.fg2, textAlign: 'center', lineHeight: 20 },
});

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  title:         { fontSize: 22, fontWeight: '800', color: Colors.fg },
  totalBadge:    { backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  totalBadgeTxt: { fontSize: 11, color: Colors.fg2, fontWeight: '600' },
  searchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  searchIcon:    { fontSize: 14, color: Colors.fg3 },
  searchInput:   { flex: 1, height: 44, fontSize: 13, color: Colors.fg },
  clearBtn:      { fontSize: 13, color: Colors.fg3, fontWeight: '600' },
  chipBar:       { flexGrow: 0, flexShrink: 0 },
  chipScroll:    { paddingHorizontal: 16, gap: 8, paddingBottom: 10, alignItems: 'center' },
  chip:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipOn:        { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipTxt:       { fontSize: 12, fontWeight: '600', color: Colors.fg2 },
  chipTxtOn:     { color: '#fff' },
  chipBadge:     { backgroundColor: Colors.surface2, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  chipBadgeOn:   { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipBadgeTxt:  { fontSize: 10, fontWeight: '700', color: Colors.fg2 },
  chipBadgeTxtOn:{ color: '#fff' },
});
