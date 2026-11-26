import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { fmtINR } from '../../lib/format';
import { useAuth } from '../../lib/auth-store';

interface RowProps {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
  value?: string;
  badge?: string;
  badgeColor?: string;
}

function Row({ icon, label, sub, onPress, danger, value, badge, badgeColor }: RowProps) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, danger && { backgroundColor: Colors.errorDim }]}>
        <Text style={s.rowIconTxt}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {badge ? (
        <View style={[s.rowBadge, { backgroundColor: (badgeColor ?? Colors.accent) + '20', borderColor: (badgeColor ?? Colors.accent) + '30' }]}>
          <Text style={[s.rowBadgeTxt, { color: badgeColor ?? Colors.accent }]}>{badge}</Text>
        </View>
      ) : null}
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      <Text style={[s.rowChev, danger && { color: Colors.error }]}>›</Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionCard}>{children}</View>
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

  const initials = name.split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase() || '?';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>

        {/* Profile hero */}
        <View style={s.profileHero}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{initials}</Text>
            </View>
            <View style={s.onlineDot} />
          </View>
          <Text style={s.profileName}>{name}</Text>
          <Text style={s.profileCompany}>{companyName}</Text>
          <View style={s.badgesRow}>
            <View style={s.verifiedBadge}>
              <Text style={s.verifiedTxt}>✓ Verified Merchant</Text>
            </View>
            <View style={s.activeBadge}>
              <Text style={s.activeTxt}>Active</Text>
            </View>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={nav('/account/details')} activeOpacity={0.85}>
            <Text style={s.editBtnTxt}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet card */}
        <TouchableOpacity style={s.walletCard} onPress={() => router.push('/(tabs)/wallet')} activeOpacity={0.85}>
          <View style={s.walletLeft}>
            <Text style={s.walletLbl}>Wallet Balance</Text>
            <Text style={s.walletAmt}>₹{fmtINR(walletBalance)}</Text>
          </View>
          <View style={s.walletRight}>
            <Text style={s.walletCta}>View Settlement →</Text>
          </View>
        </TouchableOpacity>

        {/* Profile section */}
        <Section title="Profile">
          <Row icon="👤" label="Account Details"   sub="Name, email, phone, address"     onPress={nav('/account/details')} />
          <Row icon="🏦" label="Bank Details"      sub="Account & IFSC for settlements"  onPress={nav('/account/bank')} />
          <Row icon="🔐" label="Change Password"   sub="Update your password"            onPress={nav('/account/password')} />
        </Section>

        {/* Business section */}
        <Section title="Business">
          <Row icon="🚚" label="Manage Couriers"   sub="Enable or disable courier partners" onPress={nav('/manage-couriers')} />
          <Row icon="🏪" label="Sub Store"         sub="Manage pickup locations"          onPress={soon('Sub Store')} badge="Soon" badgeColor={Colors.purple} />
          <Row icon="👥" label="Staff Person"      sub="Manage your team members"         onPress={soon('Staff management')} badge="Soon" badgeColor={Colors.purple} />
          <Row icon="💰" label="Collection Person" sub="Assign COD collectors"            onPress={soon('Collection persons')} badge="Soon" badgeColor={Colors.purple} />
        </Section>

        {/* Preferences section */}
        <Section title="Preferences">
          <Row icon="🔔" label="Notifications"     sub="Manage push alerts"               onPress={nav('/account/notifications')} />
        </Section>

        {/* Help section */}
        <Section title="Help & Support">
          <Row icon="💬" label="Contact Support"   sub="WhatsApp, call or email us"       onPress={nav('/account/support')} />
          <Row icon="📄" label="Terms & Conditions"                                        onPress={nav('/account/terms')} />
          <Row icon="🛡" label="Privacy Policy"                                            onPress={nav('/account/privacy')} />
        </Section>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutIcon}>→</Text>
          <Text style={s.logoutTxt}>Log Out</Text>
        </TouchableOpacity>

        <Text style={s.versionTxt}>SwiftShip v1.0  ·  Built with ❤️</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },

  profileHero:  { margin: 16, backgroundColor: Colors.surface, borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  avatarWrap:   { position: 'relative', marginBottom: 14 },
  avatar:       { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  avatarTxt:    { color: '#fff', fontWeight: '800', fontSize: 26 },
  onlineDot:    { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.success, borderWidth: 2.5, borderColor: Colors.surface },
  profileName:  { fontSize: 20, fontWeight: '800', color: Colors.fg, marginBottom: 4 },
  profileCompany:{ fontSize: 13, color: Colors.fg2, marginBottom: 14 },
  badgesRow:    { flexDirection: 'row', gap: 8, marginBottom: 18 },
  verifiedBadge:{ backgroundColor: Colors.accentDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.accent}30` },
  verifiedTxt:  { fontSize: 11, fontWeight: '600', color: Colors.accent },
  activeBadge:  { backgroundColor: Colors.successDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.success}30` },
  activeTxt:    { fontSize: 11, fontWeight: '600', color: Colors.success },
  editBtn:      { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface2 },
  editBtnTxt:   { fontSize: 13, fontWeight: '600', color: Colors.fg2 },

  walletCard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 20, backgroundColor: '#1A2744', borderRadius: 18, padding: 18 },
  walletLeft:   {},
  walletLbl:    { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 5 },
  walletAmt:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  walletRight:  {},
  walletCta:    { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  section:      { marginHorizontal: 16, marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 2 },
  sectionCard:  { backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },

  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  rowIcon:      { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  rowIconTxt:   { fontSize: 17 },
  rowLabel:     { fontSize: 14, fontWeight: '600', color: Colors.fg, marginBottom: 1 },
  rowSub:       { fontSize: 11, color: Colors.fg2 },
  rowValue:     { fontSize: 13, color: Colors.fg2, marginRight: 4 },
  rowBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, marginRight: 4 },
  rowBadgeTxt:  { fontSize: 10, fontWeight: '700' },
  rowChev:      { fontSize: 20, color: Colors.fg3 },

  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, padding: 15, backgroundColor: '#FFF5F5', borderRadius: 16, borderWidth: 1, borderColor: '#FECaCa' },
  logoutIcon:   { fontSize: 16, color: Colors.error, fontWeight: '700' },
  logoutTxt:    { color: Colors.error, fontSize: 15, fontWeight: '700' },
  versionTxt:   { textAlign: 'center', fontSize: 11, color: Colors.fg3, marginTop: 4 },
});
