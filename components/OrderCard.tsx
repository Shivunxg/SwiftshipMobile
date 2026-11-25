import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Badge } from './Badge';
import type { Order } from '../lib/types';

interface Props { order: Order; onContact: (order: Order) => void; }

export function OrderCard({ order, onContact }: Props) {
  const router = useRouter();
  const item = order.itemContents ?? 'Item';
  const initials = item.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'IT';
  const gradients = ['#2563EB', '#059669', '#DC2626', '#7C3AED', '#0891B2'];
  const bg = gradients[order.id % gradients.length];

  return (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/order/${order.id}`)}>
      <View style={s.top}>
        <View>
          <Text style={s.id}>ID: {order.orderNumber}</Text>
          <Text style={s.date}>{new Date(order.createdAt ?? order.placedAt ?? '').toLocaleDateString('en-IN')}</Text>
        </View>
        <Badge label={order.paymentMethod} variant={order.paymentMethod === 'COD' ? 'success' : 'accent'} />
      </View>
      <View style={s.prod}>
        <View style={[s.thumb, { backgroundColor: bg }]}>
          <Text style={s.initials}>{initials}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{item}</Text>
          <View style={s.priceRow}>
            <Text style={s.price}>₹{order.orderValue ?? order.codAmount ?? 0}</Text>
            <Text style={s.qty}>Qty: {order.quantity ?? 1}</Text>
          </View>
        </View>
      </View>
      <View style={s.footer}>
        <View style={s.custInfo}>
          <Text style={s.custName}>{order.receiverName} · {order.receiverPhone}</Text>
          <Text style={s.custAddr}>{order.receiverCity}, {order.receiverState}</Text>
        </View>
        <View style={s.actions}>
          <TouchableOpacity style={s.waBtn} onPress={() => onContact(order)}>
            <Text style={{ color: Colors.whatsapp, fontSize: 16 }}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:+91${order.receiverPhone}`)}>
            <Text style={{ color: Colors.accent, fontSize: 16 }}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:     { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: Colors.border },
  top:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  id:       { fontSize: 10, color: Colors.fg3 },
  date:     { fontSize: 10, color: Colors.fg2 },
  prod:     { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  thumb:    { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700', fontSize: 14 },
  info:     { flex: 1 },
  name:     { fontSize: 13, fontWeight: '600', color: Colors.fg, marginBottom: 4 },
  priceRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  price:    { fontSize: 14, fontWeight: '700', color: Colors.fg },
  qty:      { fontSize: 11, color: Colors.fg2 },
  footer:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  custInfo: { flex: 1 },
  custName: { fontSize: 12, fontWeight: '600', color: Colors.fg },
  custAddr: { fontSize: 11, color: Colors.fg2 },
  actions:  { flexDirection: 'row', gap: 8 },
  waBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.whatsappDim, alignItems: 'center', justifyContent: 'center' },
  callBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center' },
});
