import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useOrders } from '../../hooks/useOrders';
import { OrderCard } from '../../components/OrderCard';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import type { Order } from '../../lib/types';

const FILTERS = ['All', 'New', 'In Transit', 'Delivered', 'COD'];

export default function OrdersScreen() {
  const { data: orders, isLoading, refetch } = useOrders();
  const [filter, setFilter] = useState('All');
  const [contact, setContact] = useState<Order | null>(null);

  const filtered = orders?.filter(o => {
    if (filter === 'All')        return true;
    if (filter === 'New')        return o.status === 'ORDER_CREATED' || o.status === 'AWAITING_PICKUP';
    if (filter === 'In Transit') return o.status === 'IN_TRANSIT' || o.status === 'PICKED_UP';
    if (filter === 'Delivered')  return o.status === 'DELIVERED';
    if (filter === 'COD')        return o.paymentMethod === 'COD';
    return true;
  }) ?? [];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Orders</Text>
        <Text style={s.count}>{filtered.length} orders</Text>
      </View>
      <View style={s.chipRow}>
        {FILTERS.map(f => (
          <Text key={f} style={[s.chip, filter === f && s.chipOn]} onPress={() => setFilter(f)}>{f}</Text>
        ))}
      </View>
      {isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={o => String(o.id)}
          renderItem={({ item }) => <OrderCard order={item} onContact={setContact} />}
          onRefresh={refetch}
          refreshing={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <WhatsAppModal order={contact} onClose={() => setContact(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title:   { fontSize: 20, fontWeight: '700', color: Colors.fg },
  count:   { fontSize: 12, color: Colors.fg2 },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10, flexWrap: 'wrap' },
  chip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, color: Colors.fg2, fontSize: 12, fontWeight: '500' },
  chipOn:  { backgroundColor: Colors.accent, borderColor: Colors.accent, color: '#fff' },
});
