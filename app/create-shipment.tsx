import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-store';
import type { OrderItem, PaymentMethod, WarehouseLocation } from '../lib/types';
import { mergeWarehouses, useWarehouses } from '../lib/warehouse-store';

export default function CreateShipmentScreen() {
  const queryClient = useQueryClient();
  const { tenantId, role } = useAuth();
  const { warehouses: localWarehouses, hydrate, addWarehouse } = useWarehouses();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const isMerchant = !role || role.toUpperCase().includes('MERCHANT');
  const pickupQuery = useQuery<WarehouseLocation[]>({
    queryKey: ['pickup-locations', tenantId, role],
    queryFn: async () => {
      const path = isMerchant && tenantId ? `/api/pickups/locations/merchant/${tenantId}` : '/api/pickups/locations';
      const res = await api.get(path);
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.content ?? [];
      return list.map((raw: Record<string, unknown>) => ({
        id: String(raw.id ?? raw.pickupLocationId ?? ''),
        name: String(raw.addressName ?? raw.address_name ?? raw.name ?? raw.warehouseName ?? 'Warehouse'),
        contactName: String(raw.contactName ?? raw.contact_name ?? 'Dispatch Desk'),
        phone: String(raw.contactNumber ?? raw.contact_number ?? raw.phone ?? ''),
        address: String(raw.addressLine ?? raw.address_line ?? raw.address ?? ''),
        city: String(raw.city ?? ''),
        state: String(raw.state ?? ''),
        pincode: String(raw.pincode ?? ''),
        isDefault: Boolean(raw.isDefault ?? raw.default ?? raw.is_default ?? false),
        source: 'server' as const,
      }));
    },
  });

  const warehouses = useMemo(
    () => mergeWarehouses(pickupQuery.data ?? [], localWarehouses),
    [pickupQuery.data, localWarehouses]
  );

  const defaultWh = warehouses.find((w) => w.isDefault)?.name ?? warehouses[0]?.name ?? 'Primary Warehouse';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PREPAID');
  const [pickupLocation, setPickupLocation] = useState(defaultWh);

  useEffect(() => {
    if (defaultWh && (!pickupLocation || pickupLocation === 'Primary Warehouse')) {
      setPickupLocation(defaultWh);
    }
  }, [defaultWh, pickupLocation]);
  const [showAddWh, setShowAddWh] = useState(false);
  const [whName, setWhName] = useState('');
  const [whCity, setWhCity] = useState('');
  const [whPincode, setWhPincode] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [receiverState, setReceiverState] = useState('');
  const [receiverPincode, setReceiverPincode] = useState('');

  const [items, setItems] = useState<OrderItem[]>([
    { name: '', sku: '', quantity: 1, price: 0, weight: 0.5 },
  ]);
  const [codAmount, setCodAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalAmount = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const totalWeight = Number(
    items.reduce((s, it) => s + (Number(it.weight) || 0.5) * (Number(it.quantity) || 1), 0).toFixed(2)
  );
  const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      const cleanedItems = items.map((it) => ({
        name: it.name.trim() || 'Parcel Item',
        sku: it.sku?.trim() || undefined,
        quantity: Math.max(1, Number(it.quantity) || 1),
        price: Math.max(0, Number(it.price) || 0),
        weight: Math.max(0.1, Number(it.weight) || 0.5),
      }));
      const res = await api.post('/api/orders', {
        paymentMethod,
        pickupLocation: pickupLocation.trim() || defaultWh,
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverAddress: receiverAddress.trim(),
        receiverCity: receiverCity.trim(),
        receiverState: receiverState.trim(),
        receiverPincode: receiverPincode.trim(),
        itemName: cleanedItems.map((i) => `${i.name} × ${i.quantity}`).join(', '),
        itemQuantity: totalQty,
        items: cleanedItems,
        weight: Math.max(0.1, totalWeight),
        orderAmount: totalAmount,
        codAmount: paymentMethod === 'COD' ? Number(codAmount || totalAmount) || 0 : 0,
      });
      return res.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      const createdId = String(data?.data?.id ?? data?.id ?? '');
      if (createdId) {
        router.replace({ pathname: '/courier-assignment', params: { orderId: createdId } });
      } else {
        router.back();
      }
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to create shipment';
      setErrorMsg(message);
    },
  });

  const handleAddWhInline = async () => {
    if (!whName.trim()) return;
    const created = await addWarehouse({
      name: whName.trim(),
      contactName: 'Dispatch Desk',
      phone: '',
      address: '',
      city: whCity.trim(),
      state: '',
      pincode: whPincode.trim(),
      isDefault: false,
    });
    setPickupLocation(created.name);
    setWhName('');
    setWhCity('');
    setWhPincode('');
    setShowAddWh(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Shipment</Text>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Payment Mode</Text>
        <View style={styles.segmentRow}>
          {(['PREPAID', 'COD'] as PaymentMethod[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.segmentBtn, paymentMethod === mode && styles.segmentActive]}
              onPress={() => setPaymentMethod(mode)}
            >
              <Text style={[styles.segmentText, paymentMethod === mode && styles.segmentTextActive]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Pickup Warehouse</Text>
          <TouchableOpacity onPress={() => setShowAddWh((p) => !p)}>
            <Text style={styles.linkText}>{showAddWh ? 'Cancel' : '+ Add Warehouse'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.whScroll}>
          {warehouses.map((wh) => (
            <TouchableOpacity
              key={wh.id}
              style={[styles.whChip, pickupLocation === wh.name && styles.whChipActive]}
              onPress={() => setPickupLocation(wh.name)}
            >
              <Text style={[styles.whChipText, pickupLocation === wh.name && styles.whChipTextActive]}>
                {wh.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showAddWh ? (
          <View style={styles.inlineBox}>
            <TextInput
              style={styles.input}
              placeholder="Warehouse Name"
              value={whName}
              onChangeText={setWhName}
            />
            <View style={styles.twoCol}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="City"
                value={whCity}
                onChangeText={setWhCity}
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Pincode"
                keyboardType="numeric"
                value={whPincode}
                onChangeText={setWhPincode}
              />
            </View>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => void handleAddWhInline()}>
              <Text style={styles.secondaryBtnText}>Save & Select Warehouse</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.label}>Receiver Details</Text>
        <TextInput style={styles.input} placeholder="Receiver Name" value={receiverName} onChangeText={setReceiverName} />
        <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={receiverPhone} onChangeText={setReceiverPhone} />
        <TextInput style={styles.input} placeholder="Address" value={receiverAddress} onChangeText={setReceiverAddress} />
        <View style={styles.twoCol}>
          <TextInput style={[styles.input, styles.flex1]} placeholder="City" value={receiverCity} onChangeText={setReceiverCity} />
          <TextInput style={[styles.input, styles.flex1]} placeholder="State" value={receiverState} onChangeText={setReceiverState} />
        </View>
        <TextInput style={styles.input} placeholder="Pincode" keyboardType="numeric" value={receiverPincode} onChangeText={setReceiverPincode} />
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
          <TouchableOpacity
            onPress={() => setItems((prev) => [...prev, { name: '', sku: '', quantity: 1, price: 0, weight: 0.5 }])}
          >
            <Text style={styles.linkText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, idx) => (
          <View key={idx} style={styles.itemBox}>
            <View style={styles.rowBetween}>
              <Text style={styles.muted}>Item #{idx + 1}</Text>
              {items.length > 1 ? (
                <TouchableOpacity onPress={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Item Name"
              value={item.name}
              onChangeText={(val) =>
                setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, name: val } : it)))
              }
            />
            <View style={styles.twoCol}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Qty"
                keyboardType="numeric"
                value={String(item.quantity)}
                onChangeText={(val) =>
                  setItems((prev) =>
                    prev.map((it, i) => (i === idx ? { ...it, quantity: Math.max(1, Number(val) || 1) } : it))
                  )
                }
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Unit Price (₹)"
                keyboardType="decimal-pad"
                value={item.price ? String(item.price) : ''}
                onChangeText={(val) =>
                  setItems((prev) =>
                    prev.map((it, i) => (i === idx ? { ...it, price: Number(val) || 0 } : it))
                  )
                }
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Wt (kg)"
                keyboardType="decimal-pad"
                value={String(item.weight)}
                onChangeText={(val) =>
                  setItems((prev) =>
                    prev.map((it, i) => (i === idx ? { ...it, weight: Number(val) || 0.5 } : it))
                  )
                }
              />
            </View>
          </View>
        ))}

        {paymentMethod === 'COD' ? (
          <TextInput
            style={styles.input}
            placeholder={`COD Collect Amount (default ₹${totalAmount})`}
            keyboardType="decimal-pad"
            value={codAmount}
            onChangeText={setCodAmount}
          />
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        disabled={createMutation.isPending}
        onPress={() => {
          setErrorMsg(null);
          createMutation.mutate();
        }}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryBtnText}>
            Create Order ({totalQty} items · ₹{totalAmount.toFixed(2)})
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, gap: 10 },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  muted: { fontSize: 12, color: '#6B7280' },
  linkText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  removeText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F5F6FA', paddingHorizontal: 12, fontSize: 14, color: '#111827' },
  segmentRow: { flexDirection: 'row', backgroundColor: '#F5F6FA', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  segmentBtn: { flex: 1, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#3B82F6' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#FFFFFF' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  whScroll: { flexDirection: 'row', marginVertical: 4 },
  whChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8, backgroundColor: '#F5F6FA' },
  whChipActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  whChipText: { fontSize: 12, fontWeight: '600', color: '#111827' },
  whChipTextActive: { color: '#3B82F6' },
  inlineBox: { padding: 12, borderRadius: 12, backgroundColor: '#F5F6FA', borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
  itemBox: { padding: 12, borderRadius: 12, backgroundColor: '#F5F6FA', borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  secondaryBtn: { height: 40, borderRadius: 10, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
