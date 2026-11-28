import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-store';
import { buildLabelsHtml, type DocumentPrintMode } from '../lib/label-html';
import { mapOrder } from '../lib/mappers';
import type { MerchantProfile } from '../lib/types';
import { loadLocalProfile, useWarehouses } from '../lib/warehouse-store';

export default function LabelPickupScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { userId, companyName } = useAuth();
  const { warehouses, hydrate } = useWarehouses();
  const [pickupStatus, setPickupStatus] = useState<string | null>(null);
  const [docMode, setDocMode] = useState<DocumentPrintMode>('clubbed');
  const [localProfile, setLocalProfile] = useState<Partial<MerchantProfile> | null>(null);

  useEffect(() => {
    void hydrate();
    void loadLocalProfile(userId || 'default').then(setLocalProfile);
  }, [hydrate, userId]);

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const res = await api.get(`/api/orders/${orderId}`);
      return mapOrder(res.data?.data ?? res.data);
    },
  });

  const labelQuery = useQuery({
    queryKey: ['order-label', orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const res = await api.get(`/api/orders/${orderId}/label`);
      const data = res.data?.data ?? res.data ?? {};
      return String(data.labelUrl ?? data.pdfUrl ?? data.url ?? '');
    },
  });

  const pickupMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/pickups', {
        orderId,
        pickupDate: new Date().toISOString().slice(0, 10),
        timeSlot: '10:00 AM - 02:00 PM',
        warehouseName: orderQuery.data?.pickupLocation || 'Primary Warehouse',
      });
      return res.data;
    },
    onSuccess: () => setPickupStatus('Pickup scheduled successfully.'),
  });

  const handlePrintDocument = async () => {
    if (!orderQuery.data) return;
    const html = buildLabelsHtml([orderQuery.data], companyName || 'SwiftShip', docMode, localProfile, warehouses);
    await Print.printAsync({ html });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Label, Clubbed GST & Pickup</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Document Print</Text>
        <View style={styles.segmentRow}>
          {(
            [
              { key: 'clubbed', label: 'Label + GST' },
              { key: 'label', label: 'Label Only' },
              { key: 'invoice', label: 'GST Invoice' },
            ] as { key: DocumentPrintMode; label: string }[]
          ).map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.segmentBtn, docMode === m.key && styles.segmentActive]}
              onPress={() => setDocMode(m.key)}
            >
              <Text style={[styles.segmentText, docMode === m.key && styles.segmentTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {labelQuery.data ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              Linking.openURL(labelQuery.data).catch(() => {});
            }}
          >
            <Text style={styles.primaryBtnText}>Open Courier Label PDF</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.muted}>
            {labelQuery.isError
              ? 'Courier PDF endpoint unavailable — print the clubbed label & GST invoice below.'
              : 'Ready to print shipping label and GST tax invoice.'}
          </Text>
        )}

        <TouchableOpacity
          style={styles.secondaryBtn}
          disabled={!orderQuery.data}
          onPress={() => void handlePrintDocument()}
        >
          <Text style={styles.secondaryBtnText}>
            {docMode === 'clubbed'
              ? 'Print Clubbed Label + GST Invoice'
              : docMode === 'invoice'
              ? 'Print GST Tax Invoice PDF'
              : 'Print 4×6 Shipping Label PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Schedule Pickup</Text>
        {pickupStatus ? <Text style={styles.success}>{pickupStatus}</Text> : null}
        <TouchableOpacity
          style={styles.primaryBtn}
          disabled={pickupMutation.isPending || !orderId}
          onPress={() => pickupMutation.mutate()}
        >
          <Text style={styles.primaryBtnText}>
            {pickupMutation.isPending ? 'Scheduling...' : 'Schedule Pickup Today'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { padding: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, gap: 10 },
  segmentRow: { flexDirection: 'row', backgroundColor: '#F5F6FA', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  segmentBtn: { flex: 1, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#3B82F6' },
  segmentText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#FFFFFF' },
  muted: { fontSize: 13, color: '#6B7280' },
  success: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secondaryBtn: { height: 48, borderRadius: 12, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
