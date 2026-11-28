import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type OpsItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
};

const ITEMS: OpsItem[] = [
  { icon: 'storefront-outline',       title: 'Store Channels & OMS',      subtitle: 'Shopify, WooCommerce, Wix & OMS sync',           route: '/account/sub-store' },
  { icon: 'cloud-upload-outline',     title: 'Bulk Order Upload',          subtitle: 'Import orders via Excel or CSV',                 route: '/(tabs)/orders' },
  { icon: 'add-circle-outline',       title: 'Create Shipment',            subtitle: 'Book a new COD or Prepaid shipment',             route: '/create-shipment' },
  { icon: 'navigate-outline',         title: 'Track Shipments',            subtitle: 'Live tracking & scan history',                   route: '/tracking' },
  { icon: 'car-outline',              title: 'Courier Assignment',         subtitle: 'Compare courier rates & ship',                   route: '/courier-assignment' },
  { icon: 'flash-outline',            title: 'Bulk Courier Assign',        subtitle: 'Assign one courier across multiple orders',      route: '/bulk-assign' },
  { icon: 'pricetag-outline',         title: 'Label & Schedule Pickup',    subtitle: 'Download label and request pickup',              route: '/label-pickup' },
  { icon: 'print-outline',            title: 'Clubbed Bulk Print',         subtitle: 'Print combined labels & invoices in batch',      route: '/clubbed-print' },
  { icon: 'cash-outline',             title: 'Pending Payouts',            subtitle: 'View and release COD remittance payouts',        route: '/pending-payouts' },
  { icon: 'scale-outline',            title: 'Weight Discrepancies',       subtitle: 'Accept or dispute courier weight charges',       route: '/weight-discrepancy' },
  { icon: 'settings-outline',         title: 'Manage Couriers',            subtitle: 'Enable or pause active courier partners',        route: '/manage-couriers' },
  { icon: 'location-outline',         title: 'Warehouse Locations',        subtitle: 'Add and manage pickup addresses',                route: '/warehouses' },
  { icon: 'pulse-outline',            title: 'API Health Check',           subtitle: 'Verify all backend endpoints live',              route: '/__debug' },
];

export default function OperationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Operations</Text>
        <Text style={s.subtitle}>Dispatch, labels, settlements &amp; courier controls</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
      >
        {ITEMS.map(item => (
          <TouchableOpacity
            key={item.title}
            style={s.row}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.75}
          >
            <View style={s.iconBox}>
              <Ionicons name={item.icon} size={20} color={Colors.accent} />
            </View>
            <View style={s.textWrap}>
              <Text style={s.itemTitle}>{item.title}</Text>
              <Text style={s.itemSub}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.fg3} />
          </TouchableOpacity>
        ))}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  header:    { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  title:     { fontSize: 24, fontWeight: '800', color: Colors.fg, letterSpacing: -0.3 },
  subtitle:  { fontSize: 12, color: Colors.fg2, marginTop: 2 },

  list:      { paddingHorizontal: 16, paddingTop: 4, gap: 7 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 11, paddingHorizontal: 12 },
  iconBox:   { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textWrap:  { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '700', color: Colors.fg },
  itemSub:   { fontSize: 11, color: Colors.fg2, marginTop: 1 },
});
