import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { fmtDate } from '../lib/format';
import { useOrders, useBulkLabel } from '../hooks/useOrders';
import { BASE_URL } from '../lib/api';
import type { Order } from '../lib/types';

type PrintType = 'labels' | 'invoices' | 'both';

function OrderSelectRow({ order, selected, onToggle }: {
  order: Order; selected: boolean; onToggle: (id: string) => void;
}) {
  return (
    <TouchableOpacity style={[or.row, selected && or.rowSelected]} onPress={() => onToggle(order.id)} activeOpacity={0.75}>
      <View style={[or.checkbox, selected && or.checkboxOn]}>
        {selected && <Text style={or.checkTxt}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={or.orderNum}>#{order.orderNumber}</Text>
        <Text style={or.meta} numberOfLines={1}>
          {order.receiverName} · {order.receiverCity}
        </Text>
        {order.awbNumber && <Text style={or.awb}>AWB: {order.awbNumber}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={or.courier}>{order.courierPartner ?? '—'}</Text>
        {order.createdAt && <Text style={or.date}>{fmtDate(order.createdAt)}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const or = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: Colors.surface },
  rowSelected:  { backgroundColor: Colors.accentDim },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2 },
  checkboxOn:   { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkTxt:     { fontSize: 12, color: '#fff', fontWeight: '700' },
  orderNum:     { fontSize: 13, fontWeight: '600', color: Colors.fg, marginBottom: 2 },
  meta:         { fontSize: 11, color: Colors.fg2 },
  awb:          { fontSize: 10, color: Colors.fg3, marginTop: 1 },
  courier:      { fontSize: 11, fontWeight: '600', color: Colors.fg2 },
  date:         { fontSize: 10, color: Colors.fg3 },
});

export default function ClubbedPrintScreen() {
  const router = useRouter();
  const { data: orders, isLoading } = useOrders();
  const bulkLabelMut = useBulkLabel();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printType, setPrintType] = useState<PrintType>('both');

  const eligible = useMemo(() =>
    (orders ?? []).filter(o => o.awbNumber),
    [orders]
  );

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map(o => o.id)));
    }
  };

  const handlePrint = () => {
    if (selected.size === 0) {
      Alert.alert('No Orders Selected', 'Please select at least one order to print.');
      return;
    }
    const ids = Array.from(selected);
    if (printType === 'labels' || printType === 'both') {
      bulkLabelMut.mutate(ids, {
        onSuccess: (data) => {
          if (data?.url) Linking.openURL(data.url);
        },
        onError: () => {
          const url = `${BASE_URL}/api/orders/bulk-label?ids=${ids.join(',')}`;
          Linking.openURL(url);
        },
      });
    }
    if (printType === 'invoices' || printType === 'both') {
      const url = `${BASE_URL}/api/orders/bulk-invoice?ids=${ids.join(',')}`;
      Linking.openURL(url);
    }
  };

  if (isLoading) return <ActivityIndicator color={Colors.accent} style={{ flex: 1, backgroundColor: Colors.bg }} />;

  const allSelected = selected.size === eligible.length && eligible.length > 0;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Clubbed Label & Invoice</Text>
      </View>

      {/* Print type selector */}
      <View style={s.typeRow}>
        {([['labels', 'Labels Only'], ['invoices', 'Invoices Only'], ['both', 'Labels + Invoices']] as [PrintType, string][]).map(([t, label]) => (
          <TouchableOpacity
            key={t}
            style={[s.typeChip, printType === t && s.typeChipOn]}
            onPress={() => setPrintType(t)}
            activeOpacity={0.7}
          >
            <Text style={[s.typeTxt, printType === t && s.typeTxtOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Select all / count */}
      <View style={s.selectBar}>
        <TouchableOpacity style={s.selectAllBtn} onPress={selectAll} activeOpacity={0.7}>
          <View style={[s.selectAllCheck, allSelected && s.selectAllCheckOn]}>
            {allSelected && <Text style={or.checkTxt}>✓</Text>}
          </View>
          <Text style={s.selectAllTxt}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
        <Text style={s.selectedCount}>
          {selected.size} / {eligible.length} selected
        </Text>
      </View>

      <FlatList
        data={eligible}
        keyExtractor={o => String(o.id)}
        renderItem={({ item }) => (
          <OrderSelectRow order={item} selected={selected.has(item.id)} onToggle={toggle} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
        contentContainerStyle={eligible.length === 0 ? { flex: 1, alignItems: 'center', justifyContent: 'center' } : { paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>No Shipped Orders</Text>
            <Text style={s.emptySub}>Orders with AWB numbers will appear here for bulk printing</Text>
          </View>
        }
      />

      {/* Bottom action */}
      {eligible.length > 0 && (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.printBtn, (selected.size === 0 || bulkLabelMut.isPending) && { opacity: 0.5 }]}
            onPress={handlePrint}
            disabled={selected.size === 0 || bulkLabelMut.isPending}
            activeOpacity={0.85}
          >
            {bulkLabelMut.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.printBtnTxt}>↓ Download {selected.size > 0 ? `${selected.size} ` : ''}{printType === 'labels' ? 'Labels' : printType === 'invoices' ? 'Invoices' : 'Labels & Invoices'}</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:         { fontSize: 26, color: Colors.accent, fontWeight: '300', lineHeight: 30 },
  title:           { fontSize: 17, fontWeight: '700', color: Colors.fg },

  typeRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 7, padding: 12, paddingBottom: 8 },
  typeChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  typeChipOn:      { backgroundColor: Colors.accent, borderColor: Colors.accent },
  typeTxt:         { fontSize: 12, fontWeight: '600', color: Colors.fg2 },
  typeTxtOn:       { color: '#fff' },

  selectBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surface, borderBottomWidth: 1, borderTopWidth: 1, borderColor: Colors.border },
  selectAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllCheck:  { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2 },
  selectAllCheckOn:{ backgroundColor: Colors.accent, borderColor: Colors.accent },
  selectAllTxt:    { fontSize: 13, fontWeight: '600', color: Colors.fg },
  selectedCount:   { fontSize: 12, color: Colors.fg2 },

  empty:           { alignItems: 'center', padding: 48 },
  emptyIcon:       { fontSize: 40, marginBottom: 14 },
  emptyTitle:      { fontSize: 17, fontWeight: '700', color: Colors.fg, marginBottom: 6 },
  emptySub:        { fontSize: 13, color: Colors.fg2, textAlign: 'center' },

  bottomBar:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 28, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  printBtn:        { backgroundColor: Colors.accent, borderRadius: 16, padding: 16, alignItems: 'center' },
  printBtnTxt:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});
