import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-store';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuth(s => s.login);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
        <View style={s.hero}>
          <View style={s.logoBox}><Text style={s.logoIcon}>🚚</Text></View>
          <Text style={s.logoText}>SwiftShip</Text>
          <Text style={s.sub}>Courier Orchestration Platform</Text>
        </View>
        <View style={s.form}>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="merchant@example.com" placeholderTextColor={Colors.fg3} keyboardType="email-address" autoCapitalize="none" />
          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={Colors.fg3} secureTextEntry />
          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Log In</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bg },
  kav:      { flex: 1, justifyContent: 'center', padding: 24 },
  hero:     { alignItems: 'center', marginBottom: 40 },
  logoBox:  { width: 64, height: 64, backgroundColor: Colors.accent, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoIcon: { fontSize: 32 },
  logoText: { fontSize: 28, fontWeight: '700', color: Colors.fg, marginBottom: 6 },
  sub:      { fontSize: 14, color: Colors.fg2 },
  form:     { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border },
  label:    { fontSize: 12, fontWeight: '600', color: Colors.fg2, marginBottom: 6, marginTop: 14 },
  input:    { backgroundColor: Colors.surface2, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.fg, borderWidth: 1, borderColor: Colors.border },
  btn:      { backgroundColor: Colors.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  btnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});
