import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useChangePassword } from '../../hooks/useOrders';

export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const changePwd = useChangePassword();

  const submit = () => {
    if (!current || !next || !confirm) { Alert.alert('Error', 'All fields are required'); return; }
    if (next.length < 8)               { Alert.alert('Error', 'New password must be at least 8 characters'); return; }
    if (next !== confirm)              { Alert.alert('Error', 'Passwords do not match'); return; }
    changePwd.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => Alert.alert('Success', 'Password changed successfully', [{ text: 'OK', onPress: () => router.back() }]),
        onError: () => Alert.alert('Error', 'Current password is incorrect or request failed'),
      },
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={s.card}>
            <Text style={s.lbl}>Current Password</Text>
            <TextInput style={s.input} value={current} onChangeText={setCurrent} secureTextEntry placeholder="Enter current password" placeholderTextColor={Colors.fg3} />
            <Text style={s.lbl}>New Password</Text>
            <TextInput style={s.input} value={next} onChangeText={setNext} secureTextEntry placeholder="Min. 8 characters" placeholderTextColor={Colors.fg3} />
            <Text style={s.lbl}>Confirm New Password</Text>
            <TextInput style={s.input} value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Re-enter new password" placeholderTextColor={Colors.fg3} />
          </View>

          <View style={s.rulesBox}>
            {['At least 8 characters', 'Mix of letters and numbers', 'Avoid common passwords'].map(r => (
              <Text key={r} style={s.rule}>· {r}</Text>
            ))}
          </View>

          <TouchableOpacity style={s.btn} onPress={submit} disabled={changePwd.isPending}>
            {changePwd.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Update Password</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bg },
  card:     { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  lbl:      { fontSize: 12, fontWeight: '600', color: Colors.fg2, marginBottom: 6, marginTop: 12 },
  input:    { backgroundColor: Colors.surface2, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.fg, borderWidth: 1, borderColor: Colors.border },
  rulesBox: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  rule:     { fontSize: 12, color: Colors.fg2, marginBottom: 4 },
  btn:      { backgroundColor: Colors.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});
