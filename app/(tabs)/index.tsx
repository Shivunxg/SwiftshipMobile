import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useOrders, useWallet } from '../../hooks/useOrders';
import { useAuth } from '../../lib/auth-store';
import { StatCard } from '../../components/StatCard';

export default function Dashboard() {
  const { name, userId, walletBalance } = useAuth();
  const { data: orders, refetch, isRefetching } = useOrders();
  const { data: wallet } = useWallet(userId);

  const counts = {
    new:       orders?.filter(o => o.status === 'PROCESSING').length ?? 0,
    inTransit: orders?.filter(o => o.status === 'IN_TRANSIT').length ?? 0,
    delivered: orders?.filter(o => o.status === 'DELIVERED').length ?? 0,
    ndr:       orders?.filter(o => o.status === 'DELIVERY_FAILED').length ?? 0,
    total:     orders?.length ?? 0,
    rto:       orders?.filter(o => o.status.startsWith('RTO')).length ?? 0,
  };

  const bal = wallet?.balance ?? walletBalance;
  const deliveryRate = counts.total > 0 ? ((counts.delivered / counts.total) * 100).toFixed(1) : '0.0';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.accent} />}>
        <View style={s.header}>
          <View><Text style={s.welcome}>Welcome back</Text><Text style={s.name}>Hello, {name} ▾</Text></View>
          <View style={s.av}><Text style={s.avTxt}>{name[0]?.toUpperCase()}</Text></View>
        </View>

        <Text style={s.sectionLabel}>Activity · Last 30 Days</Text>
        <View style={s.grid}>
          <StatCard value={counts.new}       label="New Orders"      color={Colors.accent} />
          <StatCard value={counts.inTransit} label="In Transit"      color={Colors.warning} />
          <StatCard value={counts.delivered} label="Delivered"       color={Colors.success} />
          <StatCard value={counts.ndr}       label="NDR"             color={Colors.error} />
          <StatCard value={counts.total}     label="Total Shipments" color={Colors.purple} />
          <StatCard value={counts.rto}       label="RTO"             color={Colors.error} />
        </View>

        <View style={s.row2}>
          <View style={s.miniCard}>
            <Text style={s.miniLbl}>Wallet Balance</Text>
            <Text style={s.miniVal}>₹{bal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.miniCard}>
            <Text style={s.miniLbl}>Delivery Rate</Text>
            <Text style={[s.miniVal, { color: Colors.success }]}>{deliveryRate}%</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  welcome:      { fontSize: 11, color: Colors.fg2 },
  name:         { fontSize: 20, fontWeight: '700', color: Colors.fg },
  av:           { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avTxt:        { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionLabel: { fontSize: 13, color: Colors.fg2, paddingHorizontal: 16, marginBottom: 8 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  row2:         { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  miniCard:     { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  miniLbl:      { fontSize: 10, color: Colors.fg2, marginBottom: 4 },
  miniVal:      { fontSize: 18, fontWeight: '700', color: Colors.fg },
});
