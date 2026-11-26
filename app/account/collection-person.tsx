import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export default function CollectionPersonScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>💼</Text>
          <Text style={s.emptyTitle}>Collection Persons</Text>
          <Text style={s.emptySub}>Assign dedicated personnel to collect COD payments from customers at the time of delivery.</Text>
        </View>

        <View style={s.featureCard}>
          <Text style={s.featureHead}>How it works</Text>
          {[
            ['1', 'Add a collection person with their mobile number'],
            ['2', 'Assign orders to specific collectors'],
            ['3', 'Track collection status in real time'],
            ['4', 'Auto-reconcile collected amounts to wallet'],
          ].map(([num, text]) => (
            <View key={num} style={s.stepRow}>
              <View style={s.stepNum}><Text style={s.stepNumTxt}>{num}</Text></View>
              <Text style={s.stepText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoTxt}>📱  Collection persons receive an OTP on delivery to confirm payment receipt.</Text>
        </View>

        <TouchableOpacity style={s.btn}>
          <Text style={s.btnTxt}>Coming Soon — Request Early Access</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  emptyCard:  { backgroundColor: Colors.surface, borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  emptyIcon:  { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: Colors.fg2, textAlign: 'center', lineHeight: 20 },
  featureCard:{ backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  featureHead:{ fontSize: 12, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  stepRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  stepNum:    { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  stepNumTxt: { fontSize: 12, fontWeight: '700', color: Colors.accent },
  stepText:   { flex: 1, fontSize: 13, color: Colors.fg, lineHeight: 18, paddingTop: 3 },
  infoBox:    { backgroundColor: Colors.warningDim, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  infoTxt:    { fontSize: 12, color: Colors.fg2, lineHeight: 18 },
  btn:        { backgroundColor: Colors.accentDim, borderRadius: 14, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)' },
  btnTxt:     { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
