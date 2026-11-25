import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/auth-store';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, mono && s.mono]}>{value ?? '—'}</Text>
    </View>
  );
}

export default function BankDetails() {
  const { userId } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['bank-details', userId],
    queryFn: () => api.get(`/api/merchant/bank-details/${userId}`).then(r => r.data),
    enabled: !!userId,
  });

  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.hero}>
          <Text style={s.heroIcon}>🏦</Text>
          <Text style={s.heroTitle}>Bank Account</Text>
          <Text style={s.heroSub}>Linked for COD settlements & withdrawals</Text>
        </View>

        <View style={s.card}>
          <Text style={s.section}>Account Details</Text>
          <Field label="Account Holder Name" value={data?.accountHolderName} />
          <Field label="Account Number"       value={data?.accountNumber} mono />
          <Field label="IFSC Code"            value={data?.ifscCode} mono />
          <Field label="Bank Name"            value={data?.bankName} />
          <Field label="Branch"               value={data?.branch} />
          <Field label="Account Type"         value={data?.accountType} />
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoText}>🔒  Bank details are encrypted and used only for COD remittances and wallet withdrawals.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  hero:      { alignItems: 'center', paddingVertical: 24, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heroIcon:  { fontSize: 40, marginBottom: 10 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: Colors.fg, marginBottom: 4 },
  heroSub:   { fontSize: 12, color: Colors.fg2, textAlign: 'center', paddingHorizontal: 32 },
  card:      { margin: 16, marginBottom: 0, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  section:   { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },
  field:     { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label:     { fontSize: 11, color: Colors.fg3, marginBottom: 3 },
  value:     { fontSize: 14, fontWeight: '500', color: Colors.fg },
  mono:      { fontFamily: 'monospace', letterSpacing: 1 },
  infoBox:   { margin: 16, backgroundColor: Colors.accentDim, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  infoText:  { fontSize: 12, color: Colors.fg2, lineHeight: 18 },
});
