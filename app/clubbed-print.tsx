import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Print from 'expo-print';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-store';
import { buildLabelsHtml, type DocumentPrintMode } from '../lib/label-html';
import { mapOrder } from '../lib/mappers';
import type { MerchantProfile, Order } from '../lib/types';
import { loadLocalProfile, useWarehouses } from '../lib/warehouse-store';

export default function ClubbedPrintScreen() {
  const { userId, companyName } = useAuth();
  const { warehouses, hydrate } = useWarehouses();
  const [selected, setSelected] = useState<string[]>([]);
  const [printMode, setPrintMode] = useState<DocumentPrintMode>('clubbed');
  const [notice, setNotice] = useState<string | null>(null);
  const [localProfile, setLocalProfile] = useState<Partial<MerchantProfile> | null>(null);

  useEffect(() => {
    void hydrate();
    void loadLocalProfile(userId || 'default').then(setLocalProfile);
  }, [hydrate, userId]);

  const ordersQuery = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/api/orders');
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.content ?? [];
      return list.map(mapOrder);
    },
  });

  const orders = ordersQuery.data ?? [];
  const selectedOrders = useMemo(
    () => orders.filter((o) => selected.includes(o.id)),
    [orders, selected]
  );

  const bulkLabel = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const res = await api.post('/api/orders/bulk-label', { orderIds });
      return String(res.data?.data?.labelUrl ?? res.data?.labelUrl ?? '');
    },
  });

  const handlePrint = async () => {
    if (selectedOrders.length === 0) return;
    setNotice(null);
    if (printMode === 'label') {
      try {
        const url = await bulkLabel.mutateAsync(selected);
        if (url) {
          Linking.openURL(url).catch(() => {});
          return;
        }
      } catch (e) {
        setNotice('Server bulk PDF unavailable — generated documents via device print.');
      }
    }
    const html = buildLabelsHtml(selectedOrders, companyName || 'SwiftShip', printMode, localProfile, warehouses);
    await Print.printAsync({ html });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>Clubbed Document Print</Text>
        <TouchableOpacity
          style={[styles.primaryBtn, selected.length === 0 && styles.disabledBtn]}
          disabled={selected.length === 0}
          onPress={() => void handlePrint()}
        >
          <Text style={styles.primaryBtnText}>Print ({selected.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentRow}>
        {(
          [
            { key: 'clubbed', label: 'Label + GST' },
            { key: 'label', label: 'Labels Only' },
            { key: 'invoice', label: 'GST Invoices' },
          ] as { key: DocumentPrintMode; label: string }[]
        ).map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.segmentBtn, printMode === m.key && styles.segmentActive]}
            onPress={() => setPrintMode(m.key)}
          >
            <Text style={[styles.segmentText, printMode === m.key && styles.segmentTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.listCard}>
        {orders.map((order) => {
          const checked = selected.includes(order.id);
          return (
            <TouchableOpacity
              key={order.id}
              style={styles.row}
              onPress={() =>
                setSelected((prev) =>
                  prev.includes(order.id) ? prev.filter((x) => x !== order.id) : [...prev, order.id]
                )
              }
            >
              <View>
                <Text style={styles.orderNo}>{order.orderNumber}</Text>
                <Text style={styles.muted}>
                  {order.receiverName} · {order.courierPartner || 'Unassigned'}
                </Text>
              </View>
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { padding: 16, gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  primaryBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  segmentRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  segmentBtn: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#3B82F6' },
  segmentText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#FFFFFF' },
  notice: { fontSize: 12, color: '#6B7280', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  listCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  row: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  orderNo: { fontSize: 14, fontWeight: '700', color: '#111827' },
  muted: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  checkmark: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
