import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const CHANNELS = [
  { icon: '💬', label: 'WhatsApp Support', sub: 'Fastest response · 9am–9pm', color: Colors.whatsapp, dim: Colors.whatsappDim, action: () => Linking.openURL('whatsapp://send?phone=919999999999&text=Hi, I need help with SwiftShip') },
  { icon: '📞', label: 'Call Support',     sub: '+91 99999 99999 · 9am–6pm',  color: Colors.accent,   dim: Colors.accentDim,   action: () => Linking.openURL('tel:+919999999999') },
  { icon: '📧', label: 'Email Support',    sub: 'support@swiftship.co.in',    color: Colors.purple,   dim: Colors.purpleDim,   action: () => Linking.openURL('mailto:support@swiftship.co.in') },
];

const FAQS = [
  { q: 'How do I book a shipment?',          a: 'Go to Orders tab and tap the + button to create a new shipment.' },
  { q: 'When will COD be remitted?',         a: 'COD amounts are remitted within 2-3 working days of delivery.' },
  { q: 'How do I initiate an RTO?',          a: 'Open the order detail screen and tap "Initiate RTO".' },
  { q: 'What if delivery fails (NDR)?',      a: 'Go to Ops → NDR tab to re-attempt or initiate RTO.' },
  { q: 'How to add money to wallet?',        a: 'Go to Wallet tab and tap "+ Add Money via Razorpay".' },
];

export default function SupportScreen() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={s.sectionLbl}>Contact Us</Text>
        {CHANNELS.map(c => (
          <TouchableOpacity key={c.label} style={[s.channel, { backgroundColor: c.dim }]} onPress={c.action}>
            <Text style={s.channelIcon}>{c.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.channelLbl, { color: c.color }]}>{c.label}</Text>
              <Text style={s.channelSub}>{c.sub}</Text>
            </View>
            <Text style={{ color: c.color, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={s.sectionLbl}>Frequently Asked Questions</Text>
        <View style={s.faqCard}>
          {FAQS.map((f, i) => (
            <TouchableOpacity key={i} style={[s.faq, i < FAQS.length - 1 && s.faqBorder]} onPress={() => setOpenFaq(openFaq === i ? null : i)}>
              <View style={s.faqQ}>
                <Text style={s.faqQTxt}>{f.q}</Text>
                <Text style={s.faqChev}>{openFaq === i ? '↑' : '↓'}</Text>
              </View>
              {openFaq === i && <Text style={s.faqA}>{f.a}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  sectionLbl:  { fontSize: 11, fontWeight: '700', color: Colors.fg2, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  channel:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16 },
  channelIcon: { fontSize: 28 },
  channelLbl:  { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  channelSub:  { fontSize: 12, color: Colors.fg2 },
  faqCard:     { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  faq:         { padding: 14 },
  faqBorder:   { borderBottomWidth: 1, borderBottomColor: Colors.border },
  faqQ:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQTxt:     { fontSize: 13, fontWeight: '600', color: Colors.fg, flex: 1 },
  faqChev:     { fontSize: 14, color: Colors.fg2, marginLeft: 8 },
  faqA:        { fontSize: 12, color: Colors.fg2, marginTop: 8, lineHeight: 18 },
});
