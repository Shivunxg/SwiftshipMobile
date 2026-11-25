import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useOrder, useInitiateRTO } from '../../hooks/useOrders';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { Badge } from '../../components/Badge';

const STATUS_STEPS = [
  'ORDER_CREATED', 'AWAITING_PICKUP', 'PICKED_UP',
  'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(Number(id));
  const rtoMut = useInitiateRTO();
  const [showWA, setShowWA] = useState(false);

  if (isLoading || !order) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  const stepIdx = STATUS_STEPS.indexOf(order.status);
  const item = order.itemContents ?? 'Item';
  const initials = item.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'IT';
  const amount = order.orderValue ?? order.codAmount ?? 0;

  const initiateRTO = () => Alert.alert('Initiate RTO', `Return order #${order.orderNumber}?`, [
    { text: 'Cancel' },
    { text: 'Confirm', style: 'destructive', onPress: () => rtoMut.mutate(order.id) },
  ]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.hero}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Text style={s.backTxt}>← Orders</Text>
          </TouchableOpacity>
          <View style={s.prodRow}>
            <View style={[s.thumb, { backgroundColor: '#2563EB' }]}><Text style={s.thumbTxt}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.prodName}>{item}</Text>
              <Text style={s.prodMeta}>Order #{order.orderNumber} · {order.paymentMethod} · ₹{amount}</Text>
            </View>
          </View>
          <View style={s.heroStats}>
            <View style={s.hStat}><Text style={s.hStatN}>{order.courierPartner ?? '-'}</Text><Text style={s.hStatL}>Courier</Text></View>
            <View style={s.hStat}><Text style={s.hStatN}>{order.weight ?? '-'}kg</Text><Text style={s.hStatL}>Weight</Text></View>
            <View style={s.hStat}><Text style={s.hStatN}>{order.quantity ?? 1}</Text><Text style={s.hStatL}>Qty</Text></View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}>
          <Badge label={order.status.replace(/_/g, ' ')} variant={order.status === 'DELIVERED' ? 'success' : order.status.includes('FAILED') ? 'error' : 'accent'} />
          {order.awbNumber ? <Text style={{ fontSize: 11, color: Colors.fg2 }}>AWB: {order.awbNumber}</Text> : null}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Customer Contact</Text>
          <View style={s.custRow}>
            <View style={s.custAv}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{order.receiverName?.[0] ?? '?'}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.custName}>{order.receiverName}</Text>
              <Text style={s.custMeta}>+91 {order.receiverPhone} · {order.receiverCity}</Text>
            </View>
          </View>
          <View style={s.contactBtns}>
            <TouchableOpacity style={[s.contactBtn, { backgroundColor: Colors.whatsappDim }]} onPress={() => setShowWA(true)}>
              <Text style={{ fontSize: 20 }}>💬</Text><Text style={[s.contactBtnLbl, { color: Colors.whatsapp }]}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.contactBtn, { backgroundColor: Colors.accentDim }]} onPress={() => Linking.openURL(`tel:+91${order.receiverPhone}`)}>
              <Text style={{ fontSize: 20 }}>📞</Text><Text style={[s.contactBtnLbl, { color: Colors.accent }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.contactBtn, { backgroundColor: Colors.purpleDim }]}>
              <Text style={{ fontSize: 20 }}>💬</Text><Text style={[s.contactBtnLbl, { color: Colors.purple }]}>SMS</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Tracking Timeline</Text>
          {STATUS_STEPS.map((step, i) => {
            const done = i <= stepIdx;
            const current = i === stepIdx;
            return (
              <View key={step} style={s.step}>
                <View style={s.stepLine}>
                  <View style={[s.dot, { backgroundColor: done ? (current ? Colors.success : Colors.accent) : Colors.fg3 }]} />
                  {i < STATUS_STEPS.length - 1 && <View style={[s.vert, { backgroundColor: done ? Colors.accent : Colors.border }]} />}
                </View>
                <View style={s.stepBody}>
                  <Text style={[s.stepEvt, { color: done ? Colors.fg : Colors.fg3 }]}>{step.replace(/_/g, ' ')}</Text>
                  {current && <Text style={{ fontSize: 11, color: Colors.success, marginTop: 1 }}>Current status</Text>}
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Shipment Details</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.addrLbl}>Pincode</Text>
              <Text style={s.addrVal}>{order.receiverPincode ?? '-'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.addrLbl}>State</Text>
              <Text style={s.addrVal}>{order.receiverState ?? '-'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.addrLbl}>Payment</Text>
              <Text style={s.addrVal}>{order.paymentMethod}</Text>
            </View>
          </View>
        </View>

        {!order.status.startsWith('RTO') && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <View style={s.cta}>
            <TouchableOpacity style={[s.ctaBtn, { backgroundColor: Colors.errorDim }]} onPress={initiateRTO}>
              <Text style={{ color: Colors.error, fontWeight: '700', fontSize: 13 }}>Initiate RTO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.ctaBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}>
              <Text style={{ color: Colors.fg, fontWeight: '600', fontSize: 13 }}>Share Tracking</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <WhatsAppModal order={showWA ? order : null} onClose={() => setShowWA(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  hero:          { backgroundColor: '#1E40AF', padding: 16, paddingBottom: 20 },
  back:          { marginBottom: 14 },
  backTxt:       { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  prodRow:       { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 14 },
  thumb:         { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  thumbTxt:      { color: '#fff', fontWeight: '700', fontSize: 18 },
  prodName:      { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  prodMeta:      { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  heroStats:     { flexDirection: 'row', gap: 8 },
  hStat:         { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 9, alignItems: 'center' },
  hStatN:        { fontSize: 13, fontWeight: '700', color: '#fff' },
  hStatL:        { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  card:          { margin: 16, marginBottom: 0, marginTop: 10, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  cardTitle:     { fontSize: 11, fontWeight: '600', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },
  custRow:       { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  custAv:        { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  custName:      { fontSize: 13, fontWeight: '600', color: Colors.fg },
  custMeta:      { fontSize: 11, color: Colors.fg2, marginTop: 1 },
  contactBtns:   { flexDirection: 'row', gap: 8 },
  contactBtn:    { flex: 1, padding: 11, borderRadius: 12, alignItems: 'center', gap: 4 },
  contactBtnLbl: { fontSize: 11, fontWeight: '600' },
  step:          { flexDirection: 'row', gap: 12, marginBottom: 10 },
  stepLine:      { alignItems: 'center', width: 20 },
  dot:           { width: 12, height: 12, borderRadius: 6, marginTop: 1 },
  vert:          { flex: 1, width: 2, marginTop: 3 },
  stepBody:      { flex: 1, paddingBottom: 2 },
  stepEvt:       { fontSize: 12, fontWeight: '600' },
  addrLbl:       { fontSize: 10, color: Colors.fg2, marginBottom: 3 },
  addrVal:       { fontSize: 13, fontWeight: '500', color: Colors.fg },
  cta:           { flexDirection: 'row', gap: 8, padding: 16 },
  ctaBtn:        { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' },
});
