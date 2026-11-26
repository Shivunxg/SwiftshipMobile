import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/auth-store';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value ?? '—'}</Text>
    </View>
  );
}

export default function AccountDetails() {
  const { userId, name, companyName } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-profile', userId],
    queryFn: () => api.get(`/api/merchant/profile/${userId}`).then(r => r.data),
    enabled: !!userId,
  });

  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.hero}>
          <View style={s.av}><Text style={s.avTxt}>{name[0]?.toUpperCase() ?? '?'}</Text></View>
          <Text style={s.heroName}>{data?.name ?? name}</Text>
          <Text style={s.heroComp}>{data?.companyName ?? companyName}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.section}>Personal Info</Text>
          <Field label="Full Name"    value={data?.name ?? name} />
          <Field label="Email"        value={data?.email} />
          <Field label="Phone"        value={data?.phone} />
        </View>

        <View style={s.card}>
          <Text style={s.section}>Business Info</Text>
          <Field label="Company Name" value={data?.companyName ?? companyName} />
          <Field label="GST Number"   value={data?.gstNumber} />
          <Field label="PAN Number"   value={data?.panNumber} />
          <Field label="Business Type" value={data?.businessType} />
        </View>

        <View style={s.card}>
          <Text style={s.section}>Address</Text>
          <Field label="Address"    value={data?.address} />
          <Field label="City"       value={data?.city} />
          <Field label="State"      value={data?.state} />
          <Field label="Pincode"    value={data?.pincode} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bg },
  hero:     { alignItems: 'center', paddingVertical: 24, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  av:       { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avTxt:    { color: '#fff', fontWeight: '700', fontSize: 28 },
  heroName: { fontSize: 18, fontWeight: '700', color: Colors.fg, marginBottom: 4 },
  heroComp: { fontSize: 13, color: Colors.fg2 },
  card:     { margin: 16, marginBottom: 0, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  section:  { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },
  field:    { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label:    { fontSize: 11, color: Colors.fg3, marginBottom: 3 },
  value:    { fontSize: 14, fontWeight: '500', color: Colors.fg },
});
