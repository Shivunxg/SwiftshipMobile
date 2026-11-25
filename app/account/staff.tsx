import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export default function StaffScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>👥</Text>
          <Text style={s.emptyTitle}>Staff Management</Text>
          <Text style={s.emptySub}>Add and manage team members who can access your SwiftShip account with restricted permissions.</Text>
        </View>

        <View style={s.featureCard}>
          <Text style={s.featureHead}>Staff Roles Available</Text>
          {[
            { role: 'Manager', desc: 'Full access except billing & bank details', color: Colors.accent },
            { role: 'Operations', desc: 'Create orders, manage NDR and RTO', color: Colors.success },
            { role: 'Finance', desc: 'View wallet, transactions, settlements', color: Colors.warning },
            { role: 'Read Only', desc: 'View orders and reports only', color: Colors.fg2 },
          ].map(r => (
            <View key={r.role} style={s.roleRow}>
              <View style={[s.roleDot, { backgroundColor: r.color }]} />
              <View>
                <Text style={s.roleTitle}>{r.role}</Text>
                <Text style={s.roleDesc}>{r.desc}</Text>
              </View>
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
  roleRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  roleDot:     { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  roleTitle:   { fontSize: 13, fontWeight: '600', color: Colors.fg, marginBottom: 2 },
  roleDesc:    { fontSize: 12, color: Colors.fg2 },
  btn:         { backgroundColor: Colors.accentDim, borderRadius: 14, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)' },
  btnTxt:      { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
