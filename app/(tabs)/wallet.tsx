import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { fmtINR, fmtDate } from '../../lib/format';
import { useWallet, usePayouts, useOrders, useReleasePayoutMutation } from '../../hooks/useOrders';
import { useAuth } from '../../lib/auth-store';
import type { Payout } from '../../lib/types';

function addDays(iso: string | null | undefined, days: number): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(d: Date | null): string {
  if (!d) return 'pending';
  try { return d.toISOString().slice(0, 10); } catch (e) { return 'pending'; }
}

export default function WalletScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: wallet, isLoading, isError, refetch } = useWallet(userId);
  const { data: payouts } = usePayouts();
  const { data: orders } = useOrders();
  const releaseMut = useReleasePayoutMutation();

  // Map orderId/orderNumber → order details for cross-reference
  const orderMap = useMemo(() => {
    const m: Record<string, any> = {};
    (orders ?? []).forEach(o => {
      if (o.orderNumber) m[o.orderNumber] = o;
      m[String(o.id)] = o;
    });
    return m;
  }, [orders]);

  // Group payouts by expected remittance date (createdAt + 7 days COD cycle)
  const payoutGroups = useMemo(() => {
    if (!payouts?.length) return [];
    const groups: Record<string, Payout[]> = {};
    payouts.forEach(p => {
      const key = isoDate(addDays(p.createdAt, 7));
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [payouts]);

  const totalPending = (payouts ?? []).reduce((sum, p) => sum + p.amount, 0);

  const confirmRelease = (p: Payout) => Alert.alert(
    'Release Payout',
    `Release ₹${fmtINR(p.amount)} for Order #${p.orderId}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', onPress: () => releaseMut.mutate(p.id) },
    ]
  );

  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;
  if (isError) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 32, marginBottom: 16 }}>⚠️</Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 8 }}>Could not load wallet</Text>
      <Text style={{ fontSize: 13, color: Colors.fg2, textAlign: 'center', marginBottom: 24 }}>Check your connection and try again</Text>
      <TouchableOpacity style={{ backgroundColor: Colors.accent, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }} onPress={() => refetch()}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <View style={s.header}><Text style={s.title}>Settlement & Wallet</Text></View>

        {/* Balance hero */}
        <View style={s.walletHero}>
          <Text style={s.walletLbl}>Available Balance</Text>
          <Text style={s.walletBal}>₹{fmtINR(wallet?.balance)}</Text>
          <View style={s.walletStats}>
            <View style={s.wStat}>
              <Text style={s.wStatN}>₹{fmtINR(wallet?.creditLimit)}</Text>
              <Text style={s.wStatL}>Credit Limit</Text>
            </View>
            <View style={s.wStat}>
              <Text style={s.wStatN}>₹{fmtINR(totalPending)}</Text>
              <Text style={s.wStatL}>Pending Payouts</Text>
            </View>
          </View>
        </View>

        <View style={s.actionRow}>
          <TouchableOpacity style={[s.actionBtn, { flex: 2, backgroundColor: Colors.accent }]} onPress={() => router.push('/wallet-recharge')} activeOpacity={0.85}>
            <Text style={[s.actionBtnTxt, { color: '#fff' }]}>+ Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { flex: 1 }]} onPress={() => router.push('/pending-payouts' as any)} activeOpacity={0.85}>
            <Text style={s.actionBtnTxt}>Payouts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { flex: 1 }]} onPress={() => router.push('/weight-discrepancy' as any)} activeOpacity={0.85}>
            <Text style={s.actionBtnTxt}>Weight</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions */}
        {(wallet?.transactions?.length ?? 0) > 0 && (
          <>
            <Text style={s.sectionLbl}>Transactions</Text>
            <View style={s.card}>
              {(wallet?.transactions ?? []).map(t => (
                <View key={t.id} style={s.txRow}>
                  <View style={[s.txIco, { backgroundColor: t.type === 'CREDIT' ? Colors.successDim : Colors.errorDim }]}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: t.type === 'CREDIT' ? Colors.success : Colors.error }}>
                      {t.type === 'CREDIT' ? '+' : '-'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txDesc}>{t.description}</Text>
                    <Text style={s.txDate}>{fmtDate(t.createdAt)}</Text>
                  </View>
                  <Text style={[s.txAmt, { color: t.type === 'CREDIT' ? Colors.success : Colors.error }]}>
                    {t.type === 'CREDIT' ? '+' : '-'}₹{fmtINR(t.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* COD Payouts grouped by remittance date */}
        <Text style={s.sectionLbl}>COD Payouts</Text>

        {payoutGroups.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyTxt}>No pending COD payouts</Text>
          </View>
        ) : (
          payoutGroups.map(([isoKey, group]) => {
            const remDate = isoKey !== 'pending' ? new Date(isoKey) : null;
            const groupTotal = group.reduce((sum, p) => sum + p.amount, 0);
            return (
              <View key={isoKey} style={s.groupWrap}>
                {/* Group header */}
                <View style={s.groupHeader}>
                  <View style={s.groupHeaderLeft}>
                    <Text style={s.groupDateLbl}>Expected Remittance</Text>
                    <Text style={s.groupDate}>{remDate ? fmtDate(remDate) : 'Pending'}</Text>
                  </View>
                  <View style={s.groupHeaderRight}>
                    <Text style={s.groupTotal}>₹{fmtINR(groupTotal)}</Text>
                    <Text style={s.groupCount}>{group.length} order{group.length > 1 ? 's' : ''}</Text>
                  </View>
                </View>

                {/* Payout rows */}
                <View style={s.groupCard}>
                  {group.map((p, idx) => {
                    const ord = orderMap[p.orderId] ?? orderMap[String(p.orderId)];
                    return (
                      <View key={p.id} style={[s.payRow, idx < group.length - 1 && s.payRowDivider]}>
                        <View style={s.payIco}>
                          <Text style={s.payIcoTxt}>₹</Text>
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={s.payOrderNum}>Order #{p.orderId}</Text>
                          {ord ? (
                            <Text style={s.payMeta} numberOfLines={1}>
                              {ord.receiverName}{ord.receiverCity ? `  ·  ${ord.receiverCity}` : ''}
                            </Text>
                          ) : null}
                          <Text style={s.payDate}>Delivery: {fmtDate(p.createdAt)}</Text>
                        </View>
                        <View style={s.payRight}>
                          <Text style={s.payAmt}>₹{fmtINR(p.amount)}</Text>
                          <TouchableOpacity
                            style={[s.releaseBtn, releaseMut.isPending && { opacity: 0.5 }]}
                            onPress={() => confirmRelease(p)}
                            disabled={releaseMut.isPending}
                          >
                            <Text style={s.releaseTxt}>Release</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
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

  actionRow:   { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 16 },
  actionBtn:   { backgroundColor: Colors.surface, borderRadius: 14, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  actionBtnTxt:{ fontSize: 13, fontWeight: '700', color: Colors.fg },

  addBtn:      { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.success, borderRadius: 14, padding: 14, alignItems: 'center' },
  addBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '700' },

  sectionLbl:  { fontSize: 11, fontWeight: '600', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 16, marginBottom: 8, marginTop: 8 },

  card:        { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 4 },
  txRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIco:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc:      { fontSize: 13, fontWeight: '500', color: Colors.fg },
  txDate:      { fontSize: 11, color: Colors.fg2, marginTop: 2 },
  txAmt:       { fontSize: 14, fontWeight: '700' },

  emptyBox:    { marginHorizontal: 16, padding: 24, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  emptyTxt:    { fontSize: 13, color: Colors.fg2 },

  groupWrap:   { marginHorizontal: 16, marginBottom: 14 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, paddingHorizontal: 2 },
  groupHeaderLeft: {},
  groupHeaderRight:{ alignItems: 'flex-end' },
  groupDateLbl:{ fontSize: 10, fontWeight: '600', color: Colors.fg3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  groupDate:   { fontSize: 14, fontWeight: '700', color: Colors.purple },
  groupTotal:  { fontSize: 16, fontWeight: '800', color: Colors.fg },
  groupCount:  { fontSize: 11, color: Colors.fg2, marginTop: 1 },

  groupCard:   { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  payRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  payRowDivider:{ borderBottomWidth: 1, borderBottomColor: Colors.border },
  payIco:      { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.warningDim, alignItems: 'center', justifyContent: 'center' },
  payIcoTxt:   { fontSize: 16, fontWeight: '800', color: Colors.warning },
  payOrderNum: { fontSize: 13, fontWeight: '700', color: Colors.fg },
  payMeta:     { fontSize: 11, color: Colors.fg2 },
  payDate:     { fontSize: 10, color: Colors.fg3 },
  payRight:    { alignItems: 'flex-end', gap: 6 },
  payAmt:      { fontSize: 15, fontWeight: '800', color: Colors.warning },
  releaseBtn:  { backgroundColor: Colors.successDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: `${Colors.success}30` },
  releaseTxt:  { color: Colors.success, fontSize: 11, fontWeight: '700' },
});
