import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props { value: string | number; label: string; color?: string; }

export function StatCard({ value, label, color = Colors.fg }: Props) {
  return (
    <View style={s.card}>
      <Text style={[s.value, { color }]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:  { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: Colors.border },
  value: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 11, color: Colors.fg2, fontWeight: '500' },
});
