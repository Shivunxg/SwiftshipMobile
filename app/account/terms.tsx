import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using SwiftShip services, you agree to be bound by these Terms and Conditions. If you do not agree, please discontinue use of our platform immediately.',
  },
  {
    title: '2. Services',
    body: 'SwiftShip provides logistics and courier management services including order booking, tracking, COD collection, and settlement services through its mobile application and web platform.',
  },
  {
    title: '3. Account Responsibility',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.',
  },
  {
    title: '4. COD & Payments',
    body: 'COD amounts collected by our courier partners are remitted to your registered bank account within 2-3 working days of delivery. SwiftShip charges a service fee as per the agreed rate card.',
  },
  {
    title: '5. Prohibited Items',
    body: 'You may not ship hazardous materials, perishables without proper declaration, counterfeit goods, illegal substances, or any items prohibited by Indian law or our carrier partners.',
  },
  {
    title: '6. Liability',
    body: 'SwiftShip\'s liability for lost or damaged shipments is limited to the declared value of goods, subject to our insurance policy. We are not liable for indirect, consequential, or punitive damages.',
  },
  {
    title: '7. Governing Law',
    body: 'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.',
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.headerCard}>
          <Text style={s.headerIcon}>📄</Text>
          <Text style={s.headerTitle}>Terms & Conditions</Text>
          <Text style={s.headerSub}>Last updated: January 2025</Text>
        </View>

        <View style={s.card}>
          {SECTIONS.map((sec, i) => (
            <View key={sec.title} style={[s.section, i < SECTIONS.length - 1 && s.sectionBorder]}>
              <Text style={s.secTitle}>{sec.title}</Text>
              <Text style={s.secBody}>{sec.body}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL('https://swiftship.co.in/terms')}>
          <Text style={s.linkTxt}>View Full Terms on Website →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  headerCard:   { alignItems: 'center', paddingVertical: 24, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerIcon:   { fontSize: 40, marginBottom: 10 },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: Colors.fg, marginBottom: 4 },
  headerSub:    { fontSize: 12, color: Colors.fg2 },
  card:         { margin: 16, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 12 },
  section:      { padding: 16 },
  sectionBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.border },
  secTitle:     { fontSize: 13, fontWeight: '700', color: Colors.fg, marginBottom: 8 },
  secBody:      { fontSize: 13, color: Colors.fg2, lineHeight: 20 },
  linkBtn:      { marginHorizontal: 16, padding: 14, backgroundColor: Colors.accentDim, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  linkTxt:      { color: Colors.accent, fontSize: 13, fontWeight: '600' },
});
