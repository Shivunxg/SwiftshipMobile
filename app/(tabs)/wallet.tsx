import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { fmtINR } from '../../lib/format';
import { useWallet, usePayouts, useReleasePayoutMutation } from '../../hooks/useOrders';
import { useAuth } from '../../lib/auth-store';

export default function WalletScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: wallet, isLoading } = useWallet(userId);
  const { data: payouts } = usePayouts();
  const releaseMut = useReleasePayoutMutation();

  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.header}><Text style={s.title}>Settlement & Wallet</Text></View>

        <View style={s.walletHero}>
          <Text style={s.walletLbl}>Available Balance</Text>
          <Text style={s.walletBal}>₹{fmtINR(wallet?.balance)}</Text>
          <View style={s.walletStats}>
            <View style={s.wStat}><Text style={s.wStatN}>₹{fmtINR(wallet?.creditLimit)}</Text><Text style={s.wStatL}>Credit Limit</Text></View>
            <View style={s.wStat}><Text style={s.wStatN}>₹{fmtINR((payouts ?? []).reduce((sum, p) => sum + p.amount, 0))}</Text><Text style={s.wStatL}>Pending Payouts</Text></View>
          </View>
        </View>

        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/wallet-recharge')} activeOpacity={0.85}>
          <Text style={s.addBtnTxt}>+ Add Money</Text>
        </TouchableOpacity>

        <Text style={s.sectionLbl}>Transactions</Text>
        {wallet?.transactions?.map(t => (
          <View key={t.id} style={s.txRow}>
            <View style={[s.txIco, { backgroundColor: t.type === 'CREDIT' ? Colors.successDim : Colors.errorDim }]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.type === 'CREDIT' ? Colors.success : Colors.error }}>{t.type === 'CREDIT' ? '+' : '-'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>{t.description}</Text>
              <Text style={s.txDate}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</Text>
            </View>
            <Text style={[s.txAmt, { color: t.type === 'CREDIT' ? Colors.success : Colors.error }]}>
              {t.type === 'CREDIT' ? '+' : '-'}₹{fmtINR(t.amount)}
            </Text>
          </View>
        ))}

        {/* Upcoming COD Settlement Banner */}
        <View style={s.settleBanner}>
          <View style={s.settleLeft}>
            <Text style={s.settleLblTop}>Upcoming COD Settlement</Text>
            <Text style={s.settleAmt}>₹{fmtINR((payouts ?? []).reduce((sum, p) => sum + p.amount, 0))}</Text>
            <Text style={s.settleSub}>Next remittance: 2–3 working days after delivery</Text>
          </View>
          <View style={s.settleRight}>
            <View style={s.settleIconBox}><Text style={s.settleIconTxt}>₹</Text></View>
            <View style={s.settleBadge}><Text style={s.settleBadgeTxt}>{(payouts ?? []).length} orders</Text></View>
          </View>
        </View>

        <Text style={s.sectionLbl}>COD Payouts</Text>
        {payouts?.map(p => (
          <View key={p.id} style={s.txRow}>
            <View style={[s.txIco, { backgroundColor: Colors.warningDim }]}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.warning }}>₹</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>Order #{p.orderId}</Text>
              <Text style={s.txDate}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[s.txAmt, { color: Colors.warning }]}>₹{fmtINR(p.amount)}</Text>
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
  releaseBtn:    { backgroundColor: Colors.successDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  settleBanner:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(139,92,246,0.14)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  settleLeft:    { flex: 1 },
  settleLblTop:  { fontSize: 11, fontWeight: '700', color: Colors.purple, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  settleAmt:     { fontSize: 24, fontWeight: '700', color: Colors.fg, marginBottom: 4 },
  settleSub:     { fontSize: 11, color: Colors.fg2, lineHeight: 16 },
  settleRight:   { alignItems: 'center', gap: 8 },
  settleIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(139,92,246,0.2)', alignItems: 'center', justifyContent: 'center' },
  settleIconTxt: { fontSize: 20, fontWeight: '800', color: Colors.purple },
  settleBadge:   { backgroundColor: 'rgba(139,92,246,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  settleBadgeTxt:{ fontSize: 11, fontWeight: '600', color: Colors.purple },
});
