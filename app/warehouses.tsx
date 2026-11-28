import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-store';
import type { WarehouseLocation } from '../lib/types';
import { mergeWarehouses, useWarehouses } from '../lib/warehouse-store';

function mapPickupLocation(raw: unknown): WarehouseLocation {
  const r = (raw ?? {}) as Record<string, unknown>;
  const line1 = String(r.addressLine ?? r.address_line ?? r.address ?? '');
  const line2 = String(r.addressLine2 ?? r.address_line2 ?? '');
  return {
    id: String(r.id ?? r.pickupLocationId ?? `srv-${Math.random()}`),
    name: String(r.addressName ?? r.address_name ?? r.name ?? r.warehouseName ?? 'Warehouse'),
    contactName: String(r.contactName ?? r.contact_name ?? 'Dispatch Desk'),
    phone: String(r.contactNumber ?? r.contact_number ?? r.phone ?? ''),
    email: String(r.email ?? ''),
    address: [line1, line2].filter(Boolean).join(', '),
    city: String(r.city ?? ''),
    state: String(r.state ?? ''),
    pincode: String(r.pincode ?? ''),
    isDefault: Boolean(r.isDefault ?? r.default ?? r.is_default ?? false),
    verificationStatus: String(r.verificationStatus ?? r.verification_status ?? 'VERIFICATION_PENDING').toUpperCase(),
    source: 'server',
  };
}

export default function WarehousesScreen() {
  const { tenantId, role } = useAuth();
  const queryClient = useQueryClient();
  const { warehouses: localWarehouses, hydrate, addWarehouse, setDefaultWarehouse, removeWarehouse } = useWarehouses();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [otp, setOtp] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

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
      return list.map(mapPickupLocation);
    },
  });

  const merged = useMemo(
    () => mergeWarehouses(pickupQuery.data ?? [], localWarehouses),
    [pickupQuery.data, localWarehouses]
  );

  const sendOtpMutation = useMutation({
    mutationFn: async () => (await api.post('/api/pickups/locations/otp', {})).data,
    onSuccess: () => setNotice('OTP sent to your registered mobile number.'),
    onError: () => setNotice('Could not send OTP right now.'),
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/api/pickups/locations', {
          tenant_id: Number(tenantId) || tenantId,
          address_name: name.trim(),
          contact_name: contactName.trim() || 'Dispatch Desk',
          contact_number: phone.trim(),
          email: email.trim(),
          address_line: address.trim(),
          address_line2: '',
          pincode: pincode.trim(),
          city: city.trim(),
          state: state.trim(),
          dropship_location: false,
          use_alt_rto_address: false,
          rto_address: '',
          ...(otp.trim() ? { otp: otp.trim() } : {}),
        })
      ).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pickup-locations'] });
      setNotice('Warehouse synced with SwiftShip server.');
    },
  });

  const setDefaultServer = useMutation({
    mutationFn: async (id: string) => (await api.put(`/api/pickups/locations/${id}/default`, {})).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pickup-locations'] }),
  });

  const handleSave = async () => {
    if (!name.trim()) return;
    setNotice(null);
    try {
      await createMutation.mutateAsync();
    } catch (e) {
      await addWarehouse({
        name: name.trim(),
        contactName: contactName.trim() || 'Dispatch Desk',
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        isDefault: false,
        source: 'local',
      });
      setNotice('Saved locally on this device.');
    }
    setName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setState('');
    setPincode('');
    setOtp('');
    setShowForm(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>Warehouse Locations</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm((p) => !p)}>
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {showForm ? (
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Warehouse Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Contact Name" value={contactName} onChangeText={setContactName} />
          <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <TextInput style={styles.input} placeholder="Email (optional)" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Street Address" value={address} onChangeText={setAddress} />
          <View style={styles.twoCol}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="City" value={city} onChangeText={setCity} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="State" value={state} onChangeText={setState} />
          </View>
          <TextInput style={styles.input} placeholder="Pincode" keyboardType="numeric" value={pincode} onChangeText={setPincode} />
          <View style={styles.twoCol}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="OTP (for server sync)" value={otp} onChangeText={setOtp} />
            <TouchableOpacity style={styles.otpBtn} onPress={() => sendOtpMutation.mutate()}>
              <Text style={styles.otpBtnText}>Send OTP</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => void handleSave()}>
            <Text style={styles.primaryBtnText}>Save Warehouse</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {merged.map((wh) => (
        <View key={wh.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.whName}>
              {wh.name} {wh.isDefault ? '· Default' : ''}
            </Text>
            <View style={styles.actions}>
              {!wh.isDefault ? (
                <TouchableOpacity
                  onPress={() => {
                    if (wh.source === 'server') {
                      setDefaultServer.mutate(wh.id);
                    } else {
                      void setDefaultWarehouse(wh.id);
                    }
                  }}
                >
                  <Text style={styles.link}>Set Default</Text>
                </TouchableOpacity>
              ) : null}
              {wh.source !== 'server' && merged.length > 1 ? (
                <TouchableOpacity onPress={() => void removeWarehouse(wh.id)}>
                  <Text style={styles.delete}>Delete</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <Text style={styles.muted}>
            {[wh.address, wh.city, wh.state, wh.pincode].filter(Boolean).join(', ') || 'Pickup location ready'}
          </Text>
          {wh.verificationStatus ? (
            <Text style={styles.status}>
              {wh.verificationStatus === 'ACTIVE' ? 'VERIFIED' : wh.verificationStatus}
            </Text>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { padding: 16, gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  notice: { fontSize: 12, color: '#16A34A', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, gap: 8 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F5F6FA', paddingHorizontal: 12, fontSize: 14 },
  twoCol: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex1: { flex: 1 },
  otpBtn: { height: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3B82F6', justifyContent: 'center' },
  otpBtnText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },
  primaryBtn: { height: 46, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  whName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  muted: { fontSize: 12, color: '#6B7280' },
  status: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  actions: { flexDirection: 'row', gap: 12 },
  link: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  delete: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
});
