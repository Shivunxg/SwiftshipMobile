import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { fmtDate } from '../lib/format';
import { useOrder, useGenerateLabel, useSchedulePickup } from '../hooks/useOrders';
import { BASE_URL } from '../lib/api';

const PICKUP_TIMES = ['09:00–12:00', '12:00–15:00', '15:00–18:00'];

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  try { return d.toISOString().slice(0, 10); } catch (e) { return ''; }
}

function afterTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  try { return d.toISOString().slice(0, 10); } catch (e) { return ''; }
}

export default function LabelPickupScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const id = Number(orderId);
  const { data: order, isLoading } = useOrder(id);
  const { data: labelData, isLoading: labelLoading } = useGenerateLabel(id);
  const scheduleMut = useSchedulePickup();

  const [pickupDate, setPickupDate] = useState(tomorrow());
  const [pickupTime, setPickupTime] = useState(PICKUP_TIMES[0]);
  const [scheduled, setScheduled] = useState(false);

  if (isLoading || !order) return (
    <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />
  );

  const labelUrl = labelData?.url ?? `${BASE_URL}/api/orders/${id}/label`;
  const invoiceUrl = `${BASE_URL}/api/orders/${id}/invoice`;

  const handleSchedule = () => {
    scheduleMut.mutate(
      { orderIds: [id], pickupDate, pickupTime },
      {
        onSuccess: () => setScheduled(true),
        onError: () => Alert.alert('Error', 'Could not schedule pickup. Please try again.'),
      }
    );
  };

  const dateOptions = [
    { label: 'Tomorrow', value: tomorrow() },
    { label: 'Day After', value: afterTomorrow() },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Label, Invoice & Pickup</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        {/* Order summary */}
        <View style={s.summaryCard}>
          <View style={s.summRow}>
            <Text style={s.summLabel}>Order</Text>
            <Text style={s.summValue}>#{order.orderNumber}</Text>
          </View>
          <View style={s.summRow}>
            <Text style={s.summLabel}>AWB</Text>
            <Text style={s.summValue}>{order.awbNumber ?? '—'}</Text>
          </View>
          <View style={s.summRow}>
            <Text style={s.summLabel}>Courier</Text>
            <Text style={s.summValue}>{order.courierPartner ?? '—'}</Text>
          </View>
          <View style={[s.summRow, { borderBottomWidth: 0 }]}>
            <Text style={s.summLabel}>Destination</Text>
            <Text style={s.summValue}>{order.receiverCity}, {order.receiverState}</Text>
          </View>
        </View>

        {/* Label & Invoice downloads */}
        <Text style={s.sectionHead}>Documents</Text>
        <View style={s.docCard}>
          <TouchableOpacity
            style={s.docRow}
            onPress={() => Linking.openURL(labelUrl)}
            activeOpacity={0.75}
          >
            <View style={[s.docIcon, { backgroundColor: Colors.accentDim }]}>
              <Text style={[s.docIconTxt, { color: Colors.accent }]}>L</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.docTitle}>Shipping Label</Text>
              <Text style={s.docSub}>{labelLoading ? 'Generating...' : 'Tap to download PDF'}</Text>
            </View>
            <Text style={s.docArrow}>↓</Text>
          </TouchableOpacity>

          <View style={s.docSep} />

          <TouchableOpacity
            style={s.docRow}
            onPress={() => Linking.openURL(invoiceUrl)}
            activeOpacity={0.75}
          >
            <View style={[s.docIcon, { backgroundColor: Colors.successDim }]}>
              <Text style={[s.docIconTxt, { color: Colors.success }]}>I</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.docTitle}>Tax Invoice (GST)</Text>
              <Text style={s.docSub}>Tap to download PDF</Text>
            </View>
            <Text style={s.docArrow}>↓</Text>
          </TouchableOpacity>
        </View>

        {/* Pickup scheduling */}
        <Text style={s.sectionHead}>Schedule Pickup</Text>
        {scheduled ? (
          <View style={s.scheduledCard}>
            <Text style={s.scheduledIcon}>✓</Text>
            <Text style={s.scheduledTitle}>Pickup Scheduled</Text>
            <Text style={s.scheduledSub}>
              {fmtDate(pickupDate)} · {pickupTime}
            </Text>
          </View>
        ) : (
          <View style={s.scheduleCard}>
            <Text style={s.scheduleLabel}>Pickup Date</Text>
            <View style={s.optionRow}>
              {dateOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.optChip, pickupDate === opt.value && s.optChipOn]}
                  onPress={() => setPickupDate(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.optChipTxt, pickupDate === opt.value && s.optChipTxtOn]}>
                    {opt.label}
                  </Text>
                  <Text style={[s.optChipDate, pickupDate === opt.value && s.optChipDateOn]}>
                    {fmtDate(opt.value)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.scheduleLabel, { marginTop: 14 }]}>Pickup Slot</Text>
            <View style={s.optionRow}>
              {PICKUP_TIMES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.timeChip, pickupTime === t && s.timeChipOn]}
                  onPress={() => setPickupTime(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.timeChipTxt, pickupTime === t && s.timeChipTxtOn]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.scheduleBtn, scheduleMut.isPending && { opacity: 0.6 }]}
              onPress={handleSchedule}
              disabled={scheduleMut.isPending}
              activeOpacity={0.85}
            >
              {scheduleMut.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.scheduleBtnTxt}>Schedule Pickup</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:       { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30 },
  title:         { fontSize: 17, fontWeight: '700', color: Colors.fg },

  summaryCard:   { margin: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  summRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summLabel:     { fontSize: 12, color: Colors.fg2 },
  summValue:     { fontSize: 12, fontWeight: '600', color: Colors.fg },

  sectionHead:   { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 16, marginBottom: 8, marginTop: 4 },

  docCard:       { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  docRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  docIcon:       { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docIconTxt:    { fontSize: 18, fontWeight: '800' },
  docTitle:      { fontSize: 14, fontWeight: '600', color: Colors.fg, marginBottom: 2 },
  docSub:        { fontSize: 11, color: Colors.fg2 },
  docArrow:      { fontSize: 20, color: Colors.accent, fontWeight: '300' },
  docSep:        { height: 1, backgroundColor: Colors.border },

  scheduledCard: { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.successDim, borderRadius: 14, padding: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: `${Colors.success}30` },
  scheduledIcon: { fontSize: 36, color: Colors.success },
  scheduledTitle:{ fontSize: 16, fontWeight: '700', color: Colors.success },
  scheduledSub:  { fontSize: 13, color: Colors.fg2 },

  scheduleCard:  { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  scheduleLabel: { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  optionRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optChip:       { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  optChipOn:     { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  optChipTxt:    { fontSize: 12, fontWeight: '600', color: Colors.fg2, marginBottom: 2 },
  optChipTxtOn:  { color: Colors.accent },
  optChipDate:   { fontSize: 10, color: Colors.fg3 },
  optChipDateOn: { color: Colors.accent },
  timeChip:      { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border },
  timeChipOn:    { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  timeChipTxt:   { fontSize: 11, fontWeight: '600', color: Colors.fg2 },
  timeChipTxtOn: { color: Colors.accent },
  scheduleBtn:   { marginTop: 16, backgroundColor: Colors.accent, borderRadius: 14, padding: 14, alignItems: 'center' },
  scheduleBtnTxt:{ color: '#fff', fontSize: 14, fontWeight: '700' },
});
