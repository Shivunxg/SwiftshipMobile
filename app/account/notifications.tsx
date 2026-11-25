import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const SETTINGS = [
  { key: 'orderCreated',   label: 'New Order Created',      sub: 'When a new order is placed' },
  { key: 'orderPickedUp',  label: 'Order Picked Up',        sub: 'When courier collects the shipment' },
  { key: 'orderDelivered', label: 'Order Delivered',        sub: 'When customer receives the order' },
  { key: 'ndr',            label: 'Delivery Failed (NDR)',  sub: 'When a delivery attempt fails' },
  { key: 'rto',            label: 'RTO Initiated',          sub: 'When a return is triggered' },
  { key: 'codCollected',   label: 'COD Collected',         sub: 'When cash on delivery is collected' },
  { key: 'walletLow',      label: 'Low Wallet Balance',    sub: 'When wallet balance drops below ₹500' },
  { key: 'settlement',     label: 'COD Settlement',        sub: 'When COD amount is remitted to bank' },
];

export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SETTINGS.map(s => [s.key, true]))
  );

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={s.note}>Choose which events send you push notifications.</Text>
        <View style={s.card}>
          {SETTINGS.map((item, i) => (
            <View key={item.key} style={[s.row, i < SETTINGS.length - 1 && s.border]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLbl}>{item.label}</Text>
                <Text style={s.rowSub}>{item.sub}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: Colors.surface3, true: Colors.accent }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  note:   { fontSize: 12, color: Colors.fg2, margin: 16, marginBottom: 10 },
  card:   { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row:    { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLbl: { fontSize: 14, fontWeight: '500', color: Colors.fg, marginBottom: 2 },
  rowSub: { fontSize: 11, color: Colors.fg2 },
});
