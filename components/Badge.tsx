import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

type Variant = 'success' | 'warning' | 'error' | 'accent' | 'purple';

const cfg: Record<Variant, { bg: string; color: string }> = {
  success: { bg: Colors.successDim, color: Colors.success },
  warning: { bg: Colors.warningDim, color: Colors.warning },
  error:   { bg: Colors.errorDim,   color: Colors.error },
  accent:  { bg: Colors.accentDim,  color: Colors.accent },
  purple:  { bg: Colors.purpleDim,  color: Colors.purple },
};

export function Badge({ label, variant = 'accent' }: { label: string; variant?: Variant }) {
  const { bg, color } = cfg[variant];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.text, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  text:  { fontSize: 11, fontWeight: '600' },
});
