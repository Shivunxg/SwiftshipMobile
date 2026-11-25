import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useWallet, usePayouts, useReleasePayoutMutation } from '../../hooks/useOrders';
import { useAuth } from '../../lib/auth-store';
import { api } from '../../lib/api';

export default function WalletScreen() {
  const { userId } = useAuth();
  const { data: wallet, isLoading } = useWallet(userId);
  const { data: payouts } = usePayouts();
  const releaseMut = useReleasePayoutMutation();

  const topUp = async () => {
    try {
      const { data } = await api.post(`/api/wallet/topup/initialize/${userId}`, { amount: 1000 });
      Linking.openURL(data.paymentUrl);
    } catch { /* handle error */ }
  };

  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.header}><Text style={s.title}>Settlement & Wallet</Text></View>

        <View style={s.walletHero}>
          <Text style={s.walletLbl}>Available Balance</Text>
          <Text style={s.walletBal}>₹{(wallet?.balance ?? 0).toLocaleString('en-IN')}</Text>
          <View style={s.walletStats}>
            <View style={s.wStat}><Text style={s.wStatN}>₹{(wallet?.creditLimit ?? 0).toLocaleString('en-IN')}</Text><Text style={s.wStatL}>Credit Limit</Text></View>
            <View style={s.wStat}><Text style={s.wStatN}>{payouts?.length ?? 0}</Text><Text style={s.wStatL}>Pending Payouts</Text></View>
          </View>
        </View>

        <TouchableOpacity style={s.addBtn} onPress={topUp}>
          <Text style={s.addBtnTxt}>+ Add Money via Razorpay</Text>
        </TouchableOpacity>

        <Text style={s.sectionLbl}>Transactions</Text>
        {wallet?.transactions?.map(t => (
          <View key={t.id} style={s.txRow}>
            <View style={[s.txIco, { backgroundColor: t.type === 'CREDIT' ? Colors.successDim : Colors.errorDim }]}>
              <Text style={{ fontSize: 16 }}>{t.type === 'CREDIT' ? '↓' : '↑'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>{t.description}</Text>
              <Text style={s.txDate}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</Text>
            </View>
            <Text style={[s.txAmt, { color: t.type === 'CREDIT' ? Colors.success : Colors.error }]}>
              {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
            </Text>
          </View>
        ))}

        <Text style={s.sectionLbl}>COD Payouts</Text>
        {payouts?.map(p => (
          <View key={p.id} style={s.txRow}>
            <View style={[s.txIco, { backgroundColor: Colors.warningDim }]}>
              <Text style={{ fontSize: 16 }}>💰</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>Order #{p.orderId}</Text>
              <Text style={s.txDate}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[s.txAmt, { color: Colors.warning }]}>₹{p.amount.toLocaleString('en-IN')}</Text>
              <TouchableOpacity style={s.releaseBtn} onPress={() => releaseMut.mutate(p.id)}>
                <Text style={{ color: Colors.success, fontSize: 11, fontWeight: '600' }}>Release</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { padding: 16, paddingBottom: 8 },
  title:       { fontSize: 20, fontWeight: '700', color: Colors.fg },
  walletHero:  { margin: 16, backgroundColor: '#064E3B', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  walletLbl:   { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 6 },
  walletBal:   { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 16 },
  walletStats: { flexDirection: 'row', gap: 10 },
  wStat:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, alignItems: 'center' },
  wStatN:      { fontSize: 16, fontWeight: '700', color: '#fff' },
  wStatL:      { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  addBtn:      { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.success, borderRadius: 14, padding: 14, alignItems: 'center' },
  addBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionLbl:  { fontSize: 11, fontWeight: '600', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 16, marginBottom: 8, marginTop: 4 },
  txRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIco:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc:      { fontSize: 13, fontWeight: '500', color: Colors.fg },
  txDate:      { fontSize: 11, color: Colors.fg2, marginTop: 2 },
  txAmt:       { fontSize: 14, fontWeight: '700' },
  releaseBtn:  { backgroundColor: Colors.successDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
