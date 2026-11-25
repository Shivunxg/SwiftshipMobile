import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { usePickups } from '../hooks/useOrders';
import { useAuth } from '../lib/auth-store';
import { setPendingShipment } from '../lib/pending-shipment';

type Step = 1 | 2 | 3;

interface FormData {
  // Customer
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverState: string;
  receiverPincode: string;
  // Package
  itemContents: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  orderValue: string;
  paymentMethod: 'COD' | 'ONLINE';
  codAmount: string;
  // Pickup
  pickupLocationId: string;
}

const INIT: FormData = {
  receiverName: '', receiverPhone: '', receiverAddress: '',
  receiverCity: '', receiverState: '', receiverPincode: '',
  itemContents: '', weight: '', length: '', width: '', height: '',
  orderValue: '', paymentMethod: 'ONLINE', codAmount: '',
  pickupLocationId: '',
};

function Field({ label, value, onChange, placeholder, keyboardType = 'default', required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; required?: boolean;
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}{required ? <Text style={f.req}> *</Text> : null}</Text>
      <TextInput
        style={f.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={Colors.fg3}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const f = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.fg2, marginBottom: 5 },
  req:   { color: Colors.error },
  input: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.fg },
});

export default function CreateShipmentScreen() {
  const router = useRouter();
  const { tenantId } = useAuth();
  const { data: pickups } = usePickups(tenantId);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INIT);

  const set = (key: keyof FormData) => (val: string) => setForm(p => ({ ...p, [key]: val }));

  const validateStep1 = () => {
    if (!form.receiverName.trim()) return 'Customer name is required';
    if (!/^\d{10}$/.test(form.receiverPhone)) return 'Enter valid 10-digit phone';
    if (!form.receiverAddress.trim()) return 'Address is required';
    if (!form.receiverCity.trim()) return 'City is required';
    if (!form.receiverState.trim()) return 'State is required';
    if (!/^\d{6}$/.test(form.receiverPincode)) return 'Enter valid 6-digit pincode';
    return null;
  };

  const validateStep2 = () => {
    if (!form.itemContents.trim()) return 'Item description is required';
    if (!form.weight || Number(form.weight) <= 0) return 'Enter valid weight (kg)';
    if (!form.orderValue || Number(form.orderValue) <= 0) return 'Enter order value';
    if (form.paymentMethod === 'COD' && (!form.codAmount || Number(form.codAmount) <= 0))
      return 'Enter COD amount';
    return null;
  };

  const nextStep = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) { Alert.alert('Required', err); return; }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) { Alert.alert('Required', err); return; }
    }
    setStep(s => (s + 1) as Step);
  };

  const submit = () => {
    const pickup = pickups?.find(p => String(p.id) === form.pickupLocationId);
    const fromPincode = pickup?.pincode ?? '';

    setPendingShipment({
      receiverName:    form.receiverName.trim(),
      receiverPhone:   form.receiverPhone.trim(),
      receiverAddress: form.receiverAddress.trim(),
      receiverCity:    form.receiverCity.trim(),
      receiverState:   form.receiverState.trim(),
      receiverPincode: form.receiverPincode.trim(),
      itemContents:    form.itemContents.trim(),
      weight:          Number(form.weight),
      length:          form.length ? Number(form.length) : null,
      width:           form.width  ? Number(form.width)  : null,
      height:          form.height ? Number(form.height) : null,
      orderValue:      Number(form.orderValue),
      paymentMethod:   form.paymentMethod,
      codAmount:       form.paymentMethod === 'COD' ? Number(form.codAmount) : null,
      pickupLocationId: form.pickupLocationId ? Number(form.pickupLocationId) : null,
      fromPincode,
    });

    router.replace({
      pathname: '/courier-assignment',
      params: {
        fromPincode,
        toPincode:     form.receiverPincode.trim(),
        weight:        form.weight,
        paymentMethod: form.paymentMethod,
      },
    });
  };

  const stepLabel = ['Customer Details', 'Package Details', 'Review & Confirm'];

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => (s - 1) as Step) : router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹ {step > 1 ? 'Back' : 'Cancel'}</Text>
        </TouchableOpacity>
        <Text style={s.title}>Create Shipment</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress */}
      <View style={s.progress}>
        {[1, 2, 3].map(n => (
          <React.Fragment key={n}>
            <View style={[s.stepCircle, step >= n && s.stepCircleActive]}>
              <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
            </View>
            {n < 3 && <View style={[s.stepLine, step > n && s.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>
      <Text style={s.stepLabel}>{stepLabel[step - 1]}</Text>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

          {/* ── Step 1: Customer ─────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <Field label="Customer Name"    value={form.receiverName}    onChange={set('receiverName')}    required />
              <Field label="Phone Number"     value={form.receiverPhone}   onChange={set('receiverPhone')}   required keyboardType="phone-pad" placeholder="10-digit mobile" />
              <Field label="Address Line"     value={form.receiverAddress} onChange={set('receiverAddress')} required placeholder="House / flat / street" />
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Field label="City"  value={form.receiverCity}    onChange={set('receiverCity')}    required />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Field label="State" value={form.receiverState}   onChange={set('receiverState')}   required />
                </View>
              </View>
              <Field label="Pincode" value={form.receiverPincode} onChange={set('receiverPincode')} required keyboardType="numeric" placeholder="6-digit pincode" />
            </>
          )}

          {/* ── Step 2: Package ──────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <Field label="Item Description" value={form.itemContents} onChange={set('itemContents')} required placeholder="e.g. Electronics, Clothing" />
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Weight (kg)" value={form.weight} onChange={set('weight')} required keyboardType="decimal-pad" />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Field label="Order Value (₹)" value={form.orderValue} onChange={set('orderValue')} required keyboardType="numeric" />
                </View>
              </View>

              <Text style={s.dimLabel}>Dimensions (cm) — optional</Text>
              <View style={s.row}>
                <View style={{ flex: 1 }}><Field label="L" value={form.length} onChange={set('length')} keyboardType="numeric" /></View>
                <View style={{ width: 8 }} />
                <View style={{ flex: 1 }}><Field label="W" value={form.width}  onChange={set('width')}  keyboardType="numeric" /></View>
                <View style={{ width: 8 }} />
                <View style={{ flex: 1 }}><Field label="H" value={form.height} onChange={set('height')} keyboardType="numeric" /></View>
              </View>

              <Text style={s.dimLabel}>Payment Mode</Text>
              <View style={s.payRow}>
                {(['ONLINE', 'COD'] as const).map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[s.payChip, form.paymentMethod === m && s.payChipOn]}
                    onPress={() => set('paymentMethod')(m)}
                  >
                    <Text style={[s.payChipTxt, form.paymentMethod === m && s.payChipTxtOn]}>
                      {m === 'ONLINE' ? 'Prepaid' : 'Cash on Delivery'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.paymentMethod === 'COD' && (
                <Field label="COD Amount (₹)" value={form.codAmount} onChange={set('codAmount')} required keyboardType="numeric" />
              )}

              {/* Pickup location */}
              {pickups && pickups.length > 0 && (
                <>
                  <Text style={s.dimLabel}>Pickup Location</Text>
                  {pickups.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[s.pickupRow, String(p.id) === form.pickupLocationId && s.pickupRowOn]}
                      onPress={() => set('pickupLocationId')(String(p.id))}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={s.pickupName}>{p.contactName}</Text>
                        <Text style={s.pickupAddr}>{p.address}, {p.city} — {p.pincode}</Text>
                      </View>
                      {String(p.id) === form.pickupLocationId && (
                        <View style={s.pickupCheck}><Text style={s.pickupCheckTxt}>✓</Text></View>
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── Step 3: Review ───────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <View style={s.reviewSection}>
                <Text style={s.reviewHead}>Customer Details</Text>
                <ReviewRow label="Name"    value={form.receiverName} />
                <ReviewRow label="Phone"   value={form.receiverPhone} />
                <ReviewRow label="Address" value={`${form.receiverAddress}, ${form.receiverCity}, ${form.receiverState} — ${form.receiverPincode}`} />
              </View>
              <View style={s.reviewSection}>
                <Text style={s.reviewHead}>Package Details</Text>
                <ReviewRow label="Item"    value={form.itemContents} />
                <ReviewRow label="Weight"  value={`${form.weight} kg`} />
                {(form.length || form.width || form.height) && (
                  <ReviewRow label="Dims" value={`${form.length || '—'} × ${form.width || '—'} × ${form.height || '—'} cm`} />
                )}
                <ReviewRow label="Value"   value={`₹${form.orderValue}`} />
                <ReviewRow label="Payment" value={form.paymentMethod === 'COD' ? `COD — ₹${form.codAmount}` : 'Prepaid'} />
              </View>
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* CTA */}
        <View style={s.footer}>
          {step < 3 ? (
            <TouchableOpacity style={s.btn} onPress={nextStep} activeOpacity={0.85}>
              <Text style={s.btnTxt}>Continue  ›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btn} onPress={submit} activeOpacity={0.85}>
              <Text style={s.btnTxt}>Find Couriers  →</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rv.row}>
      <Text style={rv.lbl}>{label}</Text>
      <Text style={rv.val}>{value}</Text>
    </View>
  );
}
const rv = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  lbl: { fontSize: 13, color: Colors.fg2, flex: 0.4 },
  val: { fontSize: 13, color: Colors.fg, fontWeight: '500', flex: 0.6, textAlign: 'right' },
});

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn:      { fontSize: 16, color: Colors.accent, fontWeight: '600', width: 60 },
  title:        { fontSize: 16, fontWeight: '700', color: Colors.fg },

  progress:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40, paddingTop: 20, paddingBottom: 6 },
  stepCircle:   { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border },
  stepCircleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  stepNum:      { fontSize: 13, fontWeight: '700', color: Colors.fg2 },
  stepNumActive:{ color: '#fff' },
  stepLine:     { flex: 1, height: 2, backgroundColor: Colors.border },
  stepLineActive: { backgroundColor: Colors.accent },
  stepLabel:    { textAlign: 'center', fontSize: 13, fontWeight: '600', color: Colors.fg2, marginBottom: 16 },

  form:         { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  row:          { flexDirection: 'row' },
  dimLabel:     { fontSize: 12, fontWeight: '600', color: Colors.fg2, marginBottom: 10, marginTop: 4 },

  payRow:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  payChip:      { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  payChipOn:    { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  payChipTxt:   { fontSize: 13, fontWeight: '600', color: Colors.fg2 },
  payChipTxtOn: { color: Colors.accent },

  pickupRow:    { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 8, borderWidth: 1.5, borderColor: Colors.border },
  pickupRowOn:  { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  pickupName:   { fontSize: 14, fontWeight: '600', color: Colors.fg, marginBottom: 2 },
  pickupAddr:   { fontSize: 11, color: Colors.fg2 },
  pickupCheck:  { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  pickupCheckTxt:{ fontSize: 13, color: '#fff', fontWeight: '700' },

  reviewSection:{ backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  reviewHead:   { fontSize: 12, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },

  footer:       { padding: 16, paddingBottom: 24, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  btn:          { backgroundColor: Colors.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnTxt:       { color: '#fff', fontSize: 15, fontWeight: '700' },
});
