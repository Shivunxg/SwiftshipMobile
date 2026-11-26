import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { fmtINR, fmtDate } from '../../lib/format';
import { usePayoutDetail, useReleasePayoutMutation } from '../../hooks/useOrders';

function LedgerRow({ label, value, highlight, negative }: {
  label: string; value: number; highlight?: boolean; negative?: boolean;
}) {
  const color = highlight ? Colors.success : negative ? Colors.error : Colors.fg;
  return (
    <View style={[lr.row, highlight && lr.highlightRow]}>
      <Text style={[lr.label, highlight && lr.highlightLabel]}>{label}</Text>
      <Text style={[lr.value, { color }, highlight && { fontSize: 16, fontWeight: '800' }]}>
        {negative ? '−' : ''}₹{fmtINR(Math.abs(value))}
      </Text>
    </View>
  );
}

const lr = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  highlightRow: { backgroundColor: Colors.successDim },
  label:        { fontSize: 13, color: Colors.fg2 },
  highlightLabel:{ fontSize: 14, fontWeight: '600', color: Colors.success },
  value:        { fontSize: 14, fontWeight: '600' },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={ir.row}>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value}>{value}</Text>
    </View>
  );
}
const ir = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: 12, color: Colors.fg2 },
  value: { fontSize: 12, fontWeight: '600', color: Colors.fg, maxWidth: '60%', textAlign: 'right' },
});

export default function PayoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: payout, isLoading } = usePayoutDetail(Number(id));
  const releaseMut = useReleasePayoutMutation();

  if (isLoading || !payout) return (
    <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />
  );

  const isReleased = payout.status === 'RELEASED';

  const confirmRelease = () => Alert.alert(
    'Release Payout',
    `Release ₹${fmtINR(payout.netPayout)} for Order #${payout.orderNumber}?\n\nFunds will be credited to your bank account within 1–2 business days.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', onPress: () => releaseMut.mutate(payout.id) },
    ]
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Payout Breakdown</Text>
        <View style={[s.statusBadge, isReleased ? s.releasedBadge : s.pendingBadge]}>
          <Text style={[s.statusTxt, isReleased ? s.releasedTxt : s.pendingTxt]}>
            {isReleased ? 'Released' : 'Pending'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroLbl}>Net Payout</Text>
          <Text style={s.heroAmt}>₹{fmtINR(payout.netPayout)}</Text>
          {payout.expectedDate && !isReleased && (
            <Text style={s.heroDate}>Expected by {fmtDate(payout.expectedDate)}</Text>
          )}
          {isReleased && payout.releasedAt && (
            <Text style={s.heroDate}>Released on {fmtDate(payout.releasedAt)}</Text>
          )}
        </View>

        {/* Order info */}
        <Text style={s.sectionHead}>Order Information</Text>
        <View style={s.card}>
          <InfoRow label="Order Number"    value={`#${payout.orderNumber}`} />
          <InfoRow label="Customer"        value={payout.receiverName} />
          <InfoRow label="City"            value={payout.receiverCity} />
          {payout.awbNumber && <InfoRow label="AWB Number"  value={payout.awbNumber} />}
          {payout.courierPartner && <InfoRow label="Courier" value={payout.courierPartner} />}
          {payout.batchId && <InfoRow label="Batch ID"      value={payout.batchId} />}
          <InfoRow label="Created"         value={fmtDate(payout.createdAt)} />
        </View>

        {/* Ledger */}
        <Text style={s.sectionHead}>Settlement Breakdown</Text>
        <View style={s.card}>
          <LedgerRow label="COD Amount Collected"  value={payout.codAmount} />
          <LedgerRow label="Freight Charge"        value={payout.freightCharge}       negative />
          <LedgerRow label="COD Handling Charge"   value={payout.codHandlingCharge}   negative />
          {payout.reverseCharge > 0 && (
            <LedgerRow label="Reverse Charge"      value={payout.reverseCharge}       negative />
          )}
          {payout.weightCharge > 0 && (
            <LedgerRow label="Weight Discrepancy"  value={payout.weightCharge}        negative />
          )}
          <LedgerRow label="Net Payout"            value={payout.netPayout}           highlight />
        </View>

        {payout.remark && (
          <View style={s.remarkCard}>
            <Text style={s.remarkLbl}>Remark</Text>
            <Text style={s.remarkTxt}>{payout.remark}</Text>
          </View>
        )}

        {!isReleased && (
          <TouchableOpacity style={s.releaseBtn} onPress={confirmRelease} activeOpacity={0.85}>
            <Text style={s.releaseBtnTxt}>Release ₹{fmtINR(payout.netPayout)}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30 },
  title:        { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.fg },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  releasedBadge:{ backgroundColor: Colors.successDim },
  pendingBadge: { backgroundColor: Colors.warningDim },
  statusTxt:    { fontSize: 11, fontWeight: '700' },
  releasedTxt:  { color: Colors.success },
  pendingTxt:   { color: Colors.warning },

  hero:         { backgroundColor: Colors.accent, margin: 16, borderRadius: 18, padding: 24, alignItems: 'center', gap: 6 },
  heroLbl:      { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  heroAmt:      { fontSize: 36, fontWeight: '800', color: '#fff' },
  heroDate:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  sectionHead:  { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 16, marginBottom: 8, marginTop: 4 },
  card:         { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  remarkCard:   { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.warningDim, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${Colors.warning}30` },
  remarkLbl:    { fontSize: 11, fontWeight: '700', color: Colors.warning, marginBottom: 4 },
  remarkTxt:    { fontSize: 13, color: Colors.fg2, lineHeight: 20 },

  releaseBtn:   { marginHorizontal: 16, padding: 16, backgroundColor: Colors.accent, borderRadius: 16, alignItems: 'center' },
  releaseBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '700' },
});
