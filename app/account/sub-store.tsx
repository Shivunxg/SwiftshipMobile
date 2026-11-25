import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export default function SubStoreScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>🏪</Text>
          <Text style={s.emptyTitle}>Sub Store Management</Text>
          <Text style={s.emptySub}>Manage multiple pickup locations for your business. Add warehouses, branch offices, or fulfillment centers as sub stores.</Text>
        </View>

        <View style={s.featureCard}>
          <Text style={s.featureHead}>What you can do with Sub Stores</Text>
          {[
            ['📍', 'Add multiple pickup addresses'],
            ['📦', 'Route orders to specific locations'],
            ['📊', 'Track inventory per location'],
            ['👥', 'Assign staff to each store'],
          ].map(([icon, text]) => (
            <View key={text} style={s.featureRow}>
              <Text style={s.featureIcon}>{icon}</Text>
              <Text style={s.featureText}>{text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.btn}>
          <Text style={s.btnTxt}>Coming Soon — Request Early Access</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  emptyCard:   { backgroundColor: Colors.surface, borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  emptyIcon:   { fontSize: 48, marginBottom: 14 },
  emptyTitle:  { fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 8, textAlign: 'center' },
  emptySub:    { fontSize: 13, color: Colors.fg2, textAlign: 'center', lineHeight: 20 },
  featureCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  featureHead: { fontSize: 12, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  featureText: { fontSize: 13, color: Colors.fg },
  btn:         { backgroundColor: Colors.accentDim, borderRadius: 14, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)' },
  btnTxt:      { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
