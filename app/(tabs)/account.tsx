import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/auth-store';

interface RowProps {
  label: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
  value?: string;
}

function Row({ label, sub, onPress, danger, value }: RowProps) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      <Text style={[s.rowChev, danger && { color: Colors.error }]}>›</Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.group}>
      <Text style={s.groupTitle}>{title}</Text>
      <View style={s.groupCard}>{children}</View>
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
  const soon = (name: string) => () => Alert.alert('Coming Soon', `${name} will be available soon.`);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Account</Text>
        </View>

        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.av}><Text style={s.avTxt}>{name[0]?.toUpperCase() ?? '?'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{name}</Text>
            <Text style={s.profileComp}>{companyName}</Text>
            <View style={s.activeBadge}><Text style={s.activeTxt}>Active</Text></View>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={nav('/account/details')}>
            <Text style={s.editBtnTxt}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Balance strip */}
        <TouchableOpacity style={s.balStrip} onPress={() => router.push('/(tabs)/wallet')} activeOpacity={0.85}>
          <View>
            <Text style={s.balLbl}>Wallet Balance</Text>
            <Text style={s.balVal}>₹{walletBalance.toLocaleString('en-IN')}</Text>
          </View>
          <Text style={s.balCta}>View Wallet  ›</Text>
        </TouchableOpacity>

        {/* Profile */}
        <Section title="Profile">
          <Row label="Account Details"   sub="Name, email, phone, address"     onPress={nav('/account/details')} />
          <Row label="Bank Details"      sub="Account & IFSC for settlements"  onPress={nav('/account/bank')} />
          <Row label="Change Password"                                          onPress={nav('/account/password')} />
        </Section>

        {/* Business */}
        <Section title="Business">
          <Row label="Sub Store"         sub="Manage pickup locations"          onPress={soon('Sub Store')} />
          <Row label="Staff Person"      sub="Manage your team members"         onPress={soon('Staff management')} />
          <Row label="Collection Person" sub="Assign COD collectors"            onPress={soon('Collection persons')} />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <Row label="Notifications"     sub="Manage push alerts"               onPress={nav('/account/notifications')} />
        </Section>

        {/* Help */}
        <Section title="Help & Support">
          <Row label="Contact Support"   sub="WhatsApp, call or email us"       onPress={nav('/account/support')} />
          <Row label="Terms & Conditions"                                        onPress={nav('/account/terms')} />
          <Row label="Privacy Policy"                                            onPress={nav('/account/privacy')} />
        </Section>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutTxt}>Log Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>SwiftShip v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  pageHeader:  { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: Colors.fg },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, margin: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  av:          { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avTxt:       { color: '#fff', fontWeight: '800', fontSize: 22 },
  profileName: { fontSize: 16, fontWeight: '700', color: Colors.fg, marginBottom: 2 },
  profileComp: { fontSize: 12, color: Colors.fg2, marginBottom: 6 },
  activeBadge: { alignSelf: 'flex-start', backgroundColor: Colors.successDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.success}30` },
  activeTxt:   { fontSize: 11, fontWeight: '600', color: Colors.success },
  editBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface2 },
  editBtnTxt:  { fontSize: 12, fontWeight: '600', color: Colors.fg2 },

  balStrip:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.accent, borderRadius: 14, padding: 16 },
  balLbl:      { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  balVal:      { fontSize: 20, fontWeight: '700', color: '#fff' },
  balCta:      { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  group:       { marginHorizontal: 16, marginBottom: 16 },
  groupTitle:  { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  groupCard:   { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  row:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel:    { fontSize: 14, fontWeight: '500', color: Colors.fg, marginBottom: 1 },
  rowSub:      { fontSize: 11, color: Colors.fg2 },
  rowValue:    { fontSize: 13, color: Colors.fg2, marginRight: 8 },
  rowChev:     { fontSize: 20, color: Colors.fg3 },

  logoutBtn:   { marginHorizontal: 16, marginBottom: 10, padding: 15, backgroundColor: '#FFF5F5', borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FECaCa' },
  logoutTxt:   { color: Colors.error, fontSize: 15, fontWeight: '700' },
  version:     { textAlign: 'center', fontSize: 11, color: Colors.fg3, marginTop: 4 },
});
