import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/auth-store';

interface RowProps {
  icon: string;
  label: string;
  sub?: string;
  chevron?: boolean;
  onPress?: () => void;
  danger?: boolean;
}

function Row({ icon, label, sub, chevron = true, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {chevron && <Text style={s.rowChev}>›</Text>}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.group}>
      <Text style={s.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { name, companyName, walletBalance, logout } = useAuth();

  const handleLogout = () => Alert.alert(
    'Log Out',
    'You will be signed out of SwiftShip.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]
  );

  const nav = (path: string) => () => router.push(path as any);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>

        {/* Profile Hero */}
        <View style={s.hero}>
          <View style={s.av}><Text style={s.avTxt}>{name[0]?.toUpperCase() ?? '?'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroName}>{name}</Text>
            <Text style={s.heroComp}>{companyName}</Text>
            <View style={s.heroBadge}><Text style={s.heroBadgeTxt}>● Active</Text></View>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={nav('/account/details')}>
            <Text style={s.editBtnTxt}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Balance Strip */}
        <View style={s.balStrip}>
          <View>
            <Text style={s.balLbl}>Wallet Balance</Text>
            <Text style={s.balVal}>₹{walletBalance.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={s.walletBtn} onPress={() => router.push('/(tabs)/wallet')}>
            <Text style={s.walletBtnTxt}>View Wallet →</Text>
          </TouchableOpacity>
        </View>

        {/* Profile */}
        <Section title="Profile">
          <Row icon="👤" label="Account Details"    sub="Name, email, phone, address"  onPress={nav('/account/details')} />
          <Row icon="🏦" label="Bank Details"       sub="Account & IFSC for settlements" onPress={nav('/account/bank')} />
          <Row icon="🔒" label="Change Password"    onPress={nav('/account/password')} />
        </Section>

        {/* Business */}
        <Section title="Business">
          <Row icon="🏪" label="Sub Store"          sub="Manage pickup locations"      onPress={() => Alert.alert('Coming Soon', 'Sub Store management coming soon')} />
          <Row icon="👥" label="Staff Person"       sub="Manage your team members"     onPress={() => Alert.alert('Coming Soon', 'Staff management coming soon')} />
          <Row icon="💼" label="Collection Person"  sub="Assign COD collectors"        onPress={() => Alert.alert('Coming Soon', 'Collection person management coming soon')} />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <Row icon="🔔" label="Notifications"  sub="Manage push alerts"       onPress={nav('/account/notifications')} />
        </Section>

        {/* Help */}
        <Section title="Help & Support">
          <Row icon="💬" label="Contact Support"    sub="WhatsApp, call or email us"   onPress={nav('/account/support')} />
          <Row icon="📄" label="Terms & Conditions" onPress={() => Alert.alert('Terms & Conditions', 'Please visit swiftship.co.in/terms for our full terms and conditions.')} />
          <Row icon="🔐" label="Privacy Policy"     onPress={() => Alert.alert('Privacy Policy', 'Please visit swiftship.co.in/privacy for our privacy policy.')} />
        </Section>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutIcon}>⎋</Text>
          <Text style={s.logoutTxt}>Log Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>SwiftShip v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  hero:         { flexDirection: 'row', alignItems: 'center', gap: 14, margin: 16, backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border },
  av:           { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avTxt:        { color: '#fff', fontWeight: '800', fontSize: 24 },
  heroName:     { fontSize: 16, fontWeight: '700', color: Colors.fg, marginBottom: 2 },
  heroComp:     { fontSize: 12, color: Colors.fg2, marginBottom: 6 },
  heroBadge:    { alignSelf: 'flex-start', backgroundColor: Colors.successDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  heroBadgeTxt: { fontSize: 11, fontWeight: '600', color: Colors.success },
  editBtn:      { backgroundColor: Colors.surface2, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  editBtnTxt:   { fontSize: 12, fontWeight: '600', color: Colors.fg2 },
  balStrip:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#064E3B', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  balLbl:       { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 3 },
  balVal:       { fontSize: 20, fontWeight: '700', color: '#fff' },
  walletBtn:    { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  walletBtnTxt: { fontSize: 12, fontWeight: '600', color: '#fff' },
  group:        { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  groupTitle:   { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  rowIcon:      { fontSize: 18, width: 28, textAlign: 'center' },
  rowLabel:     { fontSize: 13, fontWeight: '600', color: Colors.fg },
  rowSub:       { fontSize: 11, color: Colors.fg2, marginTop: 1 },
  rowChev:      { fontSize: 18, color: Colors.fg3 },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginBottom: 8, padding: 15, backgroundColor: Colors.errorDim, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  logoutIcon:   { fontSize: 18, color: Colors.error },
  logoutTxt:    { color: Colors.error, fontSize: 15, fontWeight: '700' },
  version:      { textAlign: 'center', fontSize: 11, color: Colors.fg3, marginTop: 4 },
});
