import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const SECTIONS = [
  {
    title: 'Information We Collect',
    icon: '📋',
    body: 'We collect your name, email, phone, business details, shipping addresses, and payment information when you register and use our services.',
  },
  {
    title: 'How We Use Your Data',
    icon: '⚙️',
    body: 'Your data is used to process shipments, facilitate COD collections, calculate settlements, provide customer support, and improve our platform.',
  },
  {
    title: 'Data Sharing',
    icon: '🤝',
    body: 'We share necessary data with our courier partners to fulfil deliveries. We do not sell your personal data to third parties. Payment data is shared only with our payment gateway.',
  },
  {
    title: 'Data Security',
    icon: '🔒',
    body: 'All data is encrypted in transit (TLS) and at rest. Bank account details are stored with AES-256 encryption and are never displayed in full.',
  },
  {
    title: 'Your Rights',
    icon: '✅',
    body: 'You may request access, correction, or deletion of your personal data at any time by contacting support@swiftship.co.in. Data is retained for 7 years for regulatory compliance.',
  },
  {
    title: 'Cookies & Analytics',
    icon: '🍪',
    body: 'Our mobile app uses anonymous analytics to understand usage patterns and improve the product. No personally identifiable data is included in analytics.',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.headerCard}>
          <Text style={s.headerIcon}>🔐</Text>
          <Text style={s.headerTitle}>Privacy Policy</Text>
          <Text style={s.headerSub}>Last updated: January 2025</Text>
        </View>

        <View style={s.introCard}>
          <Text style={s.introText}>SwiftShip is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.</Text>
        </View>

        {SECTIONS.map(sec => (
          <View key={sec.title} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardIcon}>{sec.icon}</Text>
              <Text style={s.cardTitle}>{sec.title}</Text>
            </View>
            <Text style={s.cardBody}>{sec.body}</Text>
          </View>
        ))}

        <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL('https://swiftship.co.in/privacy')}>
          <Text style={s.linkTxt}>View Full Policy on Website →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  headerCard:  { alignItems: 'center', paddingVertical: 24, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerIcon:  { fontSize: 40, marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.fg, marginBottom: 4 },
  headerSub:   { fontSize: 12, color: Colors.fg2 },
  introCard:   { margin: 16, marginBottom: 8, backgroundColor: Colors.accentDim, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  introText:   { fontSize: 13, color: Colors.fg2, lineHeight: 20 },
  card:        { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardHead:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon:    { fontSize: 20 },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: Colors.fg },
  cardBody:    { fontSize: 13, color: Colors.fg2, lineHeight: 20 },
  linkBtn:     { marginHorizontal: 16, padding: 14, backgroundColor: Colors.accentDim, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  linkTxt:     { color: Colors.accent, fontSize: 13, fontWeight: '600' },
});
