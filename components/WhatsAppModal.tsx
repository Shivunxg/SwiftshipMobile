import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import type { Order } from '../lib/types';

interface Props { order: Order | null; onClose: () => void; }

export function WhatsAppModal({ order, onClose }: Props) {
  if (!order) return null;

  const phone = `91${order.receiverPhone}`;
  const openWA = (msg: string) => Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`);
  const call   = () => Linking.openURL(`tel:+${phone}`);
  const item   = order.itemContents ?? 'your order';
  const amount = order.codAmount ?? order.orderValue ?? 0;

  const templates = [
    { label: 'Order Status', msg: `Your order for ${item} (Order #${order.orderNumber}) is out for delivery today. Please keep your phone handy! 📦` },
    { label: 'COD Reminder', msg: `Your COD order (Order #${order.orderNumber}) of ₹${amount} is arriving today. Please keep cash ready! 💰` },
    { label: 'Delivery Failed', msg: `We attempted delivery for Order #${order.orderNumber} but could not reach you. Please reply to reschedule. 🔁` },
    { label: 'Tracking Link', msg: `Track your order: https://track.swiftship.co.in/${order.awbNumber ?? order.orderNumber}` },
  ];

  return (
    <Modal visible={!!order} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.drag} />
        <View style={s.custRow}>
          <View style={s.av}><Text style={s.avTxt}>{order.receiverName?.[0] ?? '?'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.custName}>{order.receiverName}</Text>
            <Text style={s.custPhone}>+91 {order.receiverPhone}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={{ color: Colors.fg2, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={s.actionRow}>
          <TouchableOpacity style={[s.bigBtn, { backgroundColor: Colors.whatsappDim }]} onPress={() => openWA(templates[0].msg)}>
            <Text style={{ fontSize: 24 }}>💬</Text>
            <Text style={[s.bigBtnLbl, { color: Colors.whatsapp }]}>WhatsApp ↗</Text>
            <Text style={s.bigBtnSub}>Opens WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.bigBtn, { backgroundColor: Colors.accentDim }]} onPress={call}>
            <Text style={{ fontSize: 24 }}>📞</Text>
            <Text style={[s.bigBtnLbl, { color: Colors.accent }]}>Call Now</Text>
            <Text style={s.bigBtnSub}>Direct call</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.tplTitle}>Quick Templates — Tap to Send</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {templates.map((t, i) => (
            <TouchableOpacity key={i} style={s.tpl} onPress={() => openWA(t.msg)}>
              <Text style={s.tplLbl}>{t.label} ↗</Text>
              <Text style={s.tplMsg}>{t.msg}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:      { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '80%' },
  drag:       { width: 36, height: 4, backgroundColor: Colors.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  custRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  av:         { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avTxt:      { color: '#fff', fontWeight: '700', fontSize: 18 },
  custName:   { fontSize: 15, fontWeight: '700', color: Colors.fg },
  custPhone:  { fontSize: 12, color: Colors.fg2 },
  closeBtn:   { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  actionRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  bigBtn:     { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', gap: 6 },
  bigBtnLbl:  { fontSize: 13, fontWeight: '700' },
  bigBtnSub:  { fontSize: 10, color: Colors.fg2 },
  tplTitle:   { fontSize: 11, fontWeight: '600', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 },
  tpl:        { backgroundColor: Colors.surface2, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  tplLbl:     { fontSize: 10, fontWeight: '700', color: Colors.whatsapp, marginBottom: 4 },
  tplMsg:     { fontSize: 12, color: Colors.fg, lineHeight: 18 },
});
