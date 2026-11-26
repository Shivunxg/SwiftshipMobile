import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { fmtINR, fmtDate } from '../../lib/format';
import { useOrder } from '../../hooks/useOrders';
import { useAuth } from '../../lib/auth-store';
import { BASE_URL } from '../../lib/api';

function InvoiceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={ir.row}>
      <Text style={ir.label}>{label}</Text>
      <Text style={[ir.value, bold && ir.boldVal]}>{value}</Text>
    </View>
  );
}
const ir = StyleSheet.create({
  row:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label:   { fontSize: 12, color: Colors.fg2, flex: 1 },
  value:   { fontSize: 12, fontWeight: '500', color: Colors.fg, maxWidth: '55%', textAlign: 'right' },
  boldVal: { fontWeight: '700', fontSize: 13 },
});

function TaxRow({ desc, rate, taxable, igst, cgst, sgst, total }: {
  desc: string; rate: string; taxable: number; igst: number; cgst: number; sgst: number; total: number;
}) {
  return (
    <View style={tr.row}>
      <Text style={[tr.cell, { flex: 2 }]}>{desc}</Text>
      <Text style={tr.cell}>{rate}</Text>
      <Text style={tr.cell}>₹{fmtINR(taxable)}</Text>
      <Text style={tr.cell}>{igst > 0 ? `₹${fmtINR(igst)}` : '—'}</Text>
      <Text style={tr.cell}>{cgst > 0 ? `₹${fmtINR(cgst)}` : '—'}</Text>
      <Text style={tr.cell}>{sgst > 0 ? `₹${fmtINR(sgst)}` : '—'}</Text>
      <Text style={[tr.cell, { fontWeight: '700' }]}>₹{fmtINR(total)}</Text>
    </View>
  );
}
const tr = StyleSheet.create({
  row:  { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cell: { flex: 1, fontSize: 10, color: Colors.fg2, textAlign: 'center' },
});

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(id as string);
  const { companyName } = useAuth();

  if (isLoading || !order) return (
    <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />
  );

  const freight = order.freightCharge ?? 0;
  const gstRate = 18;
  const taxable = Math.round(freight / 1.18);
  const gst = freight - taxable;
  const halfGst = Math.round(gst / 2);
  const isInterState = (order.senderState ?? '') !== (order.receiverState ?? '');
  const invoiceUrl = `${BASE_URL}/api/orders/${order.id}/invoice`;
  const invoiceNo  = `INV-${order.orderNumber}`;
  const invoiceDate = fmtDate(order.shippedAt ?? order.createdAt);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>GST Tax Invoice</Text>
        <TouchableOpacity style={s.downloadBtn} onPress={() => Linking.openURL(invoiceUrl)}>
          <Text style={s.downloadTxt}>↓ PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Invoice header */}
        <View style={s.invoiceHeader}>
          <View style={s.brandRow}>
            <View style={s.brandLogo}>
              <Text style={s.brandLogoTxt}>SS</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.brandName}>SwiftShip Logistics Pvt. Ltd.</Text>
              <Text style={s.brandGST}>GSTIN: 27AABCU9603R1ZX</Text>
            </View>
          </View>
          <View style={s.invNoRow}>
            <View>
              <Text style={s.invLabel}>Invoice No.</Text>
              <Text style={s.invValue}>{invoiceNo}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.invLabel}>Date</Text>
              <Text style={s.invValue}>{invoiceDate}</Text>
            </View>
          </View>
        </View>

        {/* Bill to */}
        <Text style={s.sectionHead}>Bill To</Text>
        <View style={s.card}>
          <InvoiceRow label="Company / Name"  value={companyName ?? order.senderName ?? '—'} bold />
          <InvoiceRow label="Order Number"    value={`#${order.orderNumber}`} />
          <InvoiceRow label="AWB Number"      value={order.awbNumber ?? '—'} />
          <InvoiceRow label="Courier Partner" value={order.courierPartner ?? '—'} />
          <InvoiceRow label="From"            value={`${order.senderCity ?? '—'}, ${order.senderState ?? '—'} - ${order.senderPincode ?? ''}`} />
          <InvoiceRow label="To"              value={`${order.receiverCity ?? '—'}, ${order.receiverState ?? '—'} - ${order.receiverPincode ?? ''}`} />
          <InvoiceRow label="Shipment Date"   value={fmtDate(order.shippedAt ?? order.createdAt)} />
        </View>

        {/* Tax table */}
        <Text style={s.sectionHead}>Tax Breakdown</Text>
        <View style={s.taxCard}>
          {/* Table header */}
          <View style={[tr.row, { backgroundColor: Colors.surface2 }]}>
            {['Description', 'Tax%', 'Taxable', 'IGST', 'CGST', 'SGST', 'Total'].map(h => (
              <Text key={h} style={[tr.cell, { fontWeight: '700', color: Colors.fg, flex: h === 'Description' ? 2 : 1 }]}>{h}</Text>
            ))}
          </View>
          <TaxRow
            desc="Freight Charges"
            rate={`${gstRate}%`}
            taxable={taxable}
            igst={isInterState ? gst : 0}
            cgst={isInterState ? 0 : halfGst}
            sgst={isInterState ? 0 : halfGst}
            total={freight}
          />
          {/* Total row */}
          <View style={[tr.row, { backgroundColor: Colors.accentDim }]}>
            <Text style={[tr.cell, { flex: 2, fontWeight: '700', color: Colors.accent }]}>Total</Text>
            <Text style={tr.cell} />
            <Text style={[tr.cell, { fontWeight: '700', color: Colors.fg }]}>₹{fmtINR(taxable)}</Text>
            <Text style={[tr.cell, { fontWeight: '700', color: Colors.fg }]}>{isInterState ? `₹${fmtINR(gst)}` : '—'}</Text>
            <Text style={[tr.cell, { fontWeight: '700', color: Colors.fg }]}>{!isInterState ? `₹${fmtINR(halfGst)}` : '—'}</Text>
            <Text style={[tr.cell, { fontWeight: '700', color: Colors.fg }]}>{!isInterState ? `₹${fmtINR(halfGst)}` : '—'}</Text>
            <Text style={[tr.cell, { fontWeight: '800', color: Colors.accent }]}>₹{fmtINR(freight)}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={s.summaryCard}>
          <View style={s.summRow}>
            <Text style={s.summLabel}>Taxable Amount</Text>
            <Text style={s.summValue}>₹{fmtINR(taxable)}</Text>
          </View>
          <View style={s.summRow}>
            <Text style={s.summLabel}>GST ({gstRate}%)</Text>
            <Text style={s.summValue}>₹{fmtINR(gst)}</Text>
          </View>
          <View style={[s.summRow, { borderBottomWidth: 0 }]}>
            <Text style={[s.summLabel, { fontWeight: '700', color: Colors.fg }]}>Invoice Total</Text>
            <Text style={[s.summValue, { fontSize: 16, fontWeight: '800', color: Colors.accent }]}>₹{fmtINR(freight)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.pdfBtn}
          onPress={() => Linking.openURL(invoiceUrl)}
          activeOpacity={0.85}
        >
          <Text style={s.pdfBtnTxt}>↓ Download PDF Invoice</Text>
        </TouchableOpacity>

        <Text style={s.legalNote}>
          This is a computer-generated invoice. No signature required.{'\n'}
          Subject to jurisdiction of Mumbai courts only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30 },
  title:        { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.fg },
  downloadBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: `${Colors.accent}30` },
  downloadTxt:  { fontSize: 12, fontWeight: '700', color: Colors.accent },

  invoiceHeader:{ margin: 16, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  brandRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  brandLogo:    { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  brandLogoTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
  brandName:    { fontSize: 14, fontWeight: '700', color: Colors.fg, marginBottom: 2 },
  brandGST:     { fontSize: 11, color: Colors.fg2 },
  invNoRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  invLabel:     { fontSize: 10, color: Colors.fg3, marginBottom: 3 },
  invValue:     { fontSize: 13, fontWeight: '700', color: Colors.fg },

  sectionHead:  { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 16, marginBottom: 8, marginTop: 4 },
  card:         { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  taxCard:      { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  summaryCard:  { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  summRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summLabel:    { fontSize: 13, color: Colors.fg2 },
  summValue:    { fontSize: 13, fontWeight: '600', color: Colors.fg },

  pdfBtn:       { marginHorizontal: 16, padding: 15, backgroundColor: Colors.accent, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  pdfBtnTxt:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  legalNote:    { textAlign: 'center', fontSize: 10, color: Colors.fg3, lineHeight: 16, paddingHorizontal: 24 },
});
