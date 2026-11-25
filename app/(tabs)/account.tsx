import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/auth-store';

function Row({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <Text style={s.rowIcon}>{icon}</Text>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowChev}>›</Text>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const { name, companyName, walletBalance, logout } = useAuth();

  const handleLogout = () => Alert.alert('Log Out', 'Are you sure?', [
    { text: 'Cancel' },
    { text: 'Log Out', style: 'destructive', onPress: logout },
  ]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.header}><Text style={s.title}>Account Settings</Text></View>

        <View style={s.profile}>
          <View style={s.av}><Text style={s.avTxt}>{name[0]?.toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.profName}>{name}</Text>
            <Text style={s.profComp}>{companyName}</Text>
          </View>
          <View style={s.planBadge}><Text style={{ color: Colors.success, fontSize: 11, fontWeight: '600' }}>Active</Text></View>
        </View>

        <View style={s.balCard}>
          <Text style={s.balLbl}>Wallet Balance</Text>
          <Text style={s.balVal}>₹{walletBalance.toLocaleString('en-IN')}</Text>
        </View>

        <View style={s.group}>
          <Text style={s.groupTitle}>Profile</Text>
          <Row icon="👤" label="Account Details" />
          <Row icon="🏦" label="Bank Details" />
          <Row icon="🏪" label="Sub Store" />
          <Row icon="👥" label="Staff Person" />
          <Row icon="💼" label="Collection Person" />
          <Row icon="🔒" label="Change Password" />
        </View>

        <View style={s.group}>
          <Text style={s.groupTitle}>General</Text>
          <Row icon="🔔" label="Notifications" />
        </View>

        <View style={s.group}>
          <Text style={s.groupTitle}>Help & Support</Text>
          <Row icon="💬" label="Contact Customer Service" />
        </View>

        <View style={s.group}>
          <Text style={s.groupTitle}>Legal</Text>
          <Row icon="📄" label="Terms & Conditions" />
          <Row icon="🔐" label="Privacy Policy" />
        </View>

        <TouchableOpacity style={s.logout} onPress={handleLogout}>
          <Text style={s.logoutTxt}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { padding: 16, paddingBottom: 8 },
  title:      { fontSize: 20, fontWeight: '700', color: Colors.fg },
  profile:    { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border },
  av:         { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avTxt:      { color: '#fff', fontWeight: '700', fontSize: 20 },
  profName:   { fontSize: 16, fontWeight: '700', color: Colors.fg },
  profComp:   { fontSize: 12, color: Colors.fg2, marginTop: 2 },
  planBadge:  { backgroundColor: Colors.successDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  balCard:    { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balLbl:     { fontSize: 13, color: Colors.fg2 },
  balVal:     { fontSize: 18, fontWeight: '700', color: Colors.success },
  group:      { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  groupTitle: { fontSize: 11, fontWeight: '600', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, padding: 10, paddingBottom: 6, paddingHorizontal: 14 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  rowIcon:    { fontSize: 18, width: 28, textAlign: 'center' },
  rowLabel:   { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.fg },
  rowChev:    { fontSize: 18, color: Colors.fg3 },
  logout:     { margin: 16, padding: 14, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  logoutTxt:  { color: Colors.error, fontSize: 14, fontWeight: '700' },
});
