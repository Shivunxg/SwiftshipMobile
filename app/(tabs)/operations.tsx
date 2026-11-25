import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useCODOrders, useNDROrders, useRTOOrders, useInitiateRTO } from '../../hooks/useOrders';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { Badge } from '../../components/Badge';
import type { Order } from '../../lib/types';

const TABS = ['COD', 'NDR', 'RTO'];

function CODList({ onContact }: { onContact: (o: Order) => void }) {
  const { data: orders, isLoading } = useCODOrders();
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />;
  return (
    <FlatList data={orders} keyExtractor={o => String(o.id)} contentContainerStyle={{ padding: 16, gap: 10 }}
      renderItem={({ item: o }) => (
        <View style={s.card}>
          <View style={s.cardTop}>
            <View><Text style={s.prodName}>{o.itemContents ?? 'Item'}</Text><Text style={s.meta}>AWB: {o.awbNumber ?? '-'}</Text></View>
            <Badge label={o.status === 'DELIVERED' ? 'Collected' : 'Pending'} variant={o.status === 'DELIVERED' ? 'success' : 'error'} />
          </View>
          <View style={s.amtRow}>
            <View><Text style={s.metaLbl}>Customer</Text><Text style={s.metaVal}>{o.receiverName} · {o.receiverCity ?? ''}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={s.metaLbl}>COD Amount</Text><Text style={[s.amount, { color: Colors.warning }]}>₹{o.codAmount ?? o.orderValue ?? 0}</Text></View>
          </View>
          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.successDim }]}><Text style={{ color: Colors.success, fontWeight: '600', fontSize: 12 }}>Mark Collected</Text></TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.whatsappDim }]} onPress={() => onContact(o)}><Text style={{ color: Colors.whatsapp, fontWeight: '600', fontSize: 12 }}>WhatsApp</Text></TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

function NDRList({ onContact }: { onContact: (o: Order) => void }) {
  const { data: orders, isLoading } = useNDROrders();
  const rtoMut = useInitiateRTO();
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />;
  return (
    <FlatList data={orders} keyExtractor={o => String(o.id)} contentContainerStyle={{ padding: 16, gap: 10 }}
      renderItem={({ item: o }) => (
        <View style={s.card}>
          <View style={s.cardTop}>
            <View><Text style={s.prodName}>{o.itemContents ?? 'Item'}</Text><Text style={s.meta}>Order #{o.orderNumber}</Text></View>
            <Badge label="Failed" variant="error" />
          </View>
          <View style={s.amtRow}>
            <View><Text style={s.metaLbl}>Customer</Text><Text style={s.metaVal}>{o.receiverName}</Text><Text style={s.metaVal}>{o.receiverPhone}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={s.metaLbl}>Payment</Text><Badge label={o.paymentMethod} variant={o.paymentMethod === 'COD' ? 'success' : 'accent'} /></View>
          </View>
          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.successDim }]}><Text style={{ color: Colors.success, fontWeight: '600', fontSize: 12 }}>Re-attempt</Text></TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.errorDim }]} onPress={() => { Alert.alert('Initiate RTO', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Confirm', onPress: () => rtoMut.mutate(o.id) }]); }}><Text style={{ color: Colors.error, fontWeight: '600', fontSize: 12 }}>Initiate RTO</Text></TouchableOpacity>
          </View>
          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.whatsappDim }]} onPress={() => onContact(o)}><Text style={{ color: Colors.whatsapp, fontWeight: '600', fontSize: 12 }}>WhatsApp</Text></TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: Colors.accentDim }]}><Text style={{ color: Colors.accent, fontWeight: '600', fontSize: 12 }}>Call</Text></TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

function RTOList() {
  const { data: orders, isLoading } = useRTOOrders();
  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />;
  return (
    <FlatList data={orders} keyExtractor={o => String(o.id)} contentContainerStyle={{ padding: 16, gap: 10 }}
      renderItem={({ item: o }) => (
        <View style={s.card}>
          <View style={s.cardTop}>
            <View><Text style={s.prodName}>{o.itemContents ?? 'Item'}</Text><Text style={s.meta}>AWB: {o.awbNumber ?? '-'}</Text></View>
            <Badge label={o.status.replace(/_/g, ' ')} variant="warning" />
          </View>
          <View style={s.amtRow}>
            <View><Text style={s.metaLbl}>Original Customer</Text><Text style={s.metaVal}>{o.receiverName} · {o.receiverCity ?? ''}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={s.metaLbl}>Weight</Text><Text style={s.metaVal}>{o.weight ?? '-'} kg</Text></View>
          </View>
          {o.paymentMethod === 'COD' && <Text style={{ fontSize: 11, color: Colors.error, marginTop: 4 }}>COD ₹{o.codAmount ?? o.orderValue ?? 0} — Uncollected</Text>}
        </View>
      )}
    />
  );
}

export default function OperationsScreen() {
  const [tab, setTab] = useState('COD');
  const [contact, setContact] = useState<Order | null>(null);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Operations</Text>
      </View>
      <View style={s.tabRow}>
        {TABS.map(t => <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabOn]} onPress={() => setTab(t)}><Text style={[s.tabLbl, tab === t && s.tabLblOn]}>{t}</Text></TouchableOpacity>)}
      </View>
      {tab === 'COD' && <CODList onContact={setContact} />}
      {tab === 'NDR' && <NDRList onContact={setContact} />}
      {tab === 'RTO' && <RTOList />}
      <WhatsAppModal order={contact} onClose={() => setContact(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bg },
  header:   { padding: 16, paddingBottom: 8 },
  title:    { fontSize: 20, fontWeight: '700', color: Colors.fg },
  tabRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  tabBtn:   { flex: 1, padding: 10, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  tabOn:    { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabLbl:   { fontSize: 13, fontWeight: '600', color: Colors.fg2 },
  tabLblOn: { color: '#fff' },
  card:     { backgroundColor: Colors.surface, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: Colors.border },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  prodName: { fontSize: 13, fontWeight: '600', color: Colors.fg, maxWidth: 200 },
  meta:     { fontSize: 10, color: Colors.fg2, marginTop: 2 },
  metaLbl:  { fontSize: 10, color: Colors.fg2, marginBottom: 2 },
  metaVal:  { fontSize: 12, fontWeight: '600', color: Colors.fg },
  amtRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  amount:   { fontSize: 20, fontWeight: '700' },
  btnRow:   { flexDirection: 'row', gap: 8, marginTop: 6 },
  btn:      { flex: 1, padding: 9, borderRadius: 10, alignItems: 'center' },
});
