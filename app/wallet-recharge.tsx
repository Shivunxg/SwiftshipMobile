import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../constants/colors';
import { useWallet } from '../hooks/useOrders';
import { useAuth } from '../lib/auth-store';
import { api } from '../lib/api';
import { fmtINR } from '../lib/format';

const DENOMINATIONS = [500, 1000, 2500, 5000];
const MIN_AMOUNT = 500;
const MAX_AMOUNT = 100000;

type Gateway = 'razorpay' | 'phonepe';

interface CouponResult {
  code: string;
  cashback: number;
  description: string;
}

export default function WalletRechargeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { userId, walletBalance } = useAuth();
  const { data: wallet } = useWallet(userId);

  const [selected, setSelected] = useState<number | null>(1000);
  const [custom, setCustom] = useState('');
  const [gateway, setGateway] = useState<Gateway>('razorpay');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const amount = custom.trim()
    ? Math.min(Math.max(Number(custom) || 0, 0), MAX_AMOUNT)
    : (selected ?? 0);

  const cashback = appliedCoupon?.cashback ?? 0;
  const payable  = Math.max(0, amount - cashback);

  const isValid = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;

  const selectDenom = (d: number) => {
    setSelected(d);
    setCustom('');
  };

  const handleCustomChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    setCustom(digits);
    setSelected(null);
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/api/wallet/coupon/validate', { code, amount });
      setAppliedCoupon({ code, cashback: data.cashback ?? 0, description: data.description ?? 'Coupon applied' });
    } catch (e: any) {
      Alert.alert('Invalid Coupon', e?.response?.data?.message ?? 'This coupon code is not valid.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const pay = async () => {
    if (!isValid) {
      Alert.alert('Invalid Amount', `Minimum recharge is ₹${fmtINR(MIN_AMOUNT)} and maximum is ₹${fmtINR(MAX_AMOUNT)}.`);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/api/wallet/topup/initialize/${userId}`, {
        amount: payable,
        rechargeAmount: amount,
        couponCode: appliedCoupon?.code ?? null,
        paymentGateway: gateway,
      });
      await Linking.openURL(data.paymentUrl);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      router.back();
    } catch (e: any) {
      Alert.alert('Payment Error', e?.response?.data?.message ?? 'Could not initiate payment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const bal = wallet?.balance ?? walletBalance ?? 0;
  const hold = wallet?.creditLimit ?? 0;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={s.title}>Add Money</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Balance card */}
          <View style={s.balCard}>
            <View style={s.balRow}>
              <View>
                <Text style={s.balLbl}>Current Wallet Balance</Text>
                <Text style={s.balVal}>₹{fmtINR(bal)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.holdLbl}>Amount on Hold</Text>
                <Text style={s.holdVal}>₹{fmtINR(hold)}</Text>
              </View>
            </View>
          </View>

          {/* Cashback offer */}
          <View style={s.offerBanner}>
            <View style={s.offerDot} />
            <Text style={s.offerTxt}>Recharge ₹1000 &amp; get ₹500 credits free</Text>
          </View>

          {/* Denomination chips */}
          <Text style={s.sectionLabel}>Select an amount from the options below</Text>
          <View style={s.chipGrid}>
            {DENOMINATIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[s.chip, selected === d && s.chipOn]}
                onPress={() => selectDenom(d)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipTxt, selected === d && s.chipTxtOn]}>
                  ₹{fmtINR(d)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.rangeHint}>Min value: ₹{fmtINR(MIN_AMOUNT)} | Max value: ₹{fmtINR(MAX_AMOUNT)}</Text>

          {/* Custom amount */}
          <Text style={s.sectionLabel}>Or enter a custom amount</Text>
          <View style={s.amtInputWrap}>
            <Text style={s.rupeeSign}>₹</Text>
            <TextInput
              style={s.amtInput}
              value={custom}
              onChangeText={handleCustomChange}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={Colors.fg3}
              maxLength={6}
            />
          </View>

          {/* Coupon */}
          <Text style={s.sectionLabel}>Choose or enter a coupon code</Text>
          {appliedCoupon ? (
            <View style={s.couponApplied}>
              <View style={{ flex: 1 }}>
                <Text style={s.couponAppliedCode}>{appliedCoupon.code}</Text>
                <Text style={s.couponAppliedDesc}>{appliedCoupon.description}</Text>
              </View>
              <TouchableOpacity onPress={removeCoupon} style={s.couponRemove}>
                <Text style={s.couponRemoveTxt}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.couponRow}>
              <TextInput
                style={s.couponInput}
                value={couponInput}
                onChangeText={v => setCouponInput(v.toUpperCase())}
                placeholder="ENTER CODE"
                placeholderTextColor={Colors.fg3}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[s.couponBtn, !couponInput.trim() && { opacity: 0.4 }]}
                onPress={applyCoupon}
                disabled={!couponInput.trim() || couponLoading}
              >
                {couponLoading
                  ? <ActivityIndicator color={Colors.accent} size="small" />
                  : <Text style={s.couponBtnTxt}>Apply</Text>
                }
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={s.viewCoupons}>
            <Text style={s.viewCouponsTxt}>View Available Coupons</Text>
          </TouchableOpacity>

          {/* Summary */}
          <View style={s.summaryCard}>
            <SumRow label="Recharge Amount" value={`₹${fmtINR(amount)}`} />
            {cashback > 0 && (
              <SumRow label="Wallet Cashback" value={`-₹${fmtINR(cashback)}`} accent={Colors.success} />
            )}
            <View style={s.divider} />
            <SumRow label="Payable Amount" value={`₹${fmtINR(payable)}`} bold />
          </View>

          {/* Payment method */}
          <Text style={s.sectionLabel}>Choose your preferred payment method</Text>
          <View style={s.gatewayRow}>
            <TouchableOpacity
              style={[s.gateway, gateway === 'razorpay' && s.gatewayOn]}
              onPress={() => setGateway('razorpay')}
              activeOpacity={0.75}
            >
              <View style={[s.gwLogoWrap, { backgroundColor: '#072654' }]}>
                <Text style={s.gwLogoTxt}>Razorpay</Text>
              </View>
              {gateway === 'razorpay' && <View style={s.gwCheck}><Text style={s.gwCheckTxt}>✓</Text></View>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.gateway, gateway === 'phonepe' && s.gatewayOn]}
              onPress={() => setGateway('phonepe')}
              activeOpacity={0.75}
            >
              <View style={[s.gwLogoWrap, { backgroundColor: '#5F259F' }]}>
                <Text style={s.gwLogoTxt}>PhonePe</Text>
              </View>
              {gateway === 'phonepe' && <View style={s.gwCheck}><Text style={s.gwCheckTxt}>✓</Text></View>}
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.cancelBtnTxt}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.payBtn, (!isValid || loading) && { opacity: 0.5 }]}
          onPress={pay}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.payBtnTxt}>Pay Now  ₹{fmtINR(payable)}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SumRow({ label, value, accent, bold }: {
  label: string; value: string; accent?: string; bold?: boolean;
}) {
  return (
    <View style={sum.row}>
      <Text style={[sum.lbl, bold && { color: Colors.fg, fontWeight: '700' }]}>{label}</Text>
      <Text style={[sum.val, accent ? { color: accent } : bold ? { color: Colors.fg, fontWeight: '700' } : {}]}>{value}</Text>
    </View>
  );
}
const sum = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  lbl: { fontSize: 13, color: Colors.fg2 },
  val: { fontSize: 13, color: Colors.fg, fontWeight: '500' },
});

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel:      { fontSize: 15, color: Colors.fg2, width: 60 },
  title:       { fontSize: 16, fontWeight: '700', color: Colors.fg },
  scroll:      { paddingHorizontal: 16, paddingTop: 16 },

  balCard:     { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  balRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  balLbl:      { fontSize: 11, color: Colors.fg2, marginBottom: 4 },
  balVal:      { fontSize: 26, fontWeight: '800', color: Colors.fg },
  holdLbl:     { fontSize: 11, color: Colors.fg2, marginBottom: 4 },
  holdVal:     { fontSize: 16, fontWeight: '700', color: Colors.warning },

  offerBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.successDim, borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: `${Colors.success}25` },
  offerDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  offerTxt:    { fontSize: 12, fontWeight: '600', color: Colors.success },

  sectionLabel:{ fontSize: 12, fontWeight: '600', color: Colors.fg2, marginBottom: 10, marginTop: 4 },
  rangeHint:   { fontSize: 11, color: Colors.fg3, marginTop: 8, marginBottom: 20 },

  chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip:        { flex: 1, minWidth: '21%', alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  chipOn:      { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  chipTxt:     { fontSize: 15, fontWeight: '700', color: Colors.fg2 },
  chipTxtOn:   { color: Colors.accent },

  amtInputWrap:{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  rupeeSign:   { fontSize: 20, fontWeight: '700', color: Colors.fg, marginRight: 6 },
  amtInput:    { flex: 1, height: 52, fontSize: 20, fontWeight: '700', color: Colors.fg },

  couponRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  couponInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, height: 46, fontSize: 14, color: Colors.fg, letterSpacing: 1 },
  couponBtn:   { paddingHorizontal: 18, height: 46, borderRadius: 12, backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.accent },
  couponBtnTxt:{ fontSize: 13, fontWeight: '700', color: Colors.accent },
  couponApplied:{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successDim, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${Colors.success}30`, marginBottom: 8 },
  couponAppliedCode:{ fontSize: 13, fontWeight: '700', color: Colors.success, marginBottom: 2 },
  couponAppliedDesc:{ fontSize: 11, color: Colors.fg2 },
  couponRemove: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.errorDim, borderRadius: 8 },
  couponRemoveTxt:{ fontSize: 11, fontWeight: '600', color: Colors.error },
  viewCoupons: { marginBottom: 20 },
  viewCouponsTxt:{ fontSize: 12, color: Colors.accent, fontWeight: '600' },

  summaryCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  divider:     { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  gatewayRow:  { flexDirection: 'row', gap: 12, marginBottom: 20 },
  gateway:     { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, gap: 10, position: 'relative' },
  gatewayOn:   { borderColor: Colors.accent },
  gwLogoWrap:  { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  gwLogoTxt:   { color: '#fff', fontWeight: '800', fontSize: 12 },
  gwCheck:     { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  gwCheckTxt:  { color: '#fff', fontSize: 11, fontWeight: '800' },

  footer:      { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 24, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  cancelBtn:   { flex: 1, padding: 15, borderRadius: 14, alignItems: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border },
  cancelBtnTxt:{ fontSize: 14, fontWeight: '600', color: Colors.fg2 },
  payBtn:      { flex: 2, padding: 15, borderRadius: 14, alignItems: 'center', backgroundColor: Colors.accent },
  payBtnTxt:   { fontSize: 14, fontWeight: '700', color: '#fff' },
});
