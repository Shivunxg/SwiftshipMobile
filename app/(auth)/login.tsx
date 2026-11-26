import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-store';
import { Colors } from '../../constants/colors';

const { height: SH } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const login = useAuth(s => s.login);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
          keyboardVerticalOffset={0}
        >
          {/* Brand hero */}
          <View style={s.hero}>
            <View style={s.logoRing}>
              <View style={s.logoBg}>
                <Text style={s.logoEmoji}>⚡</Text>
              </View>
            </View>
            <Text style={s.brand}>SwiftShip</Text>
            <Text style={s.tagline}>Courier Orchestration Platform</Text>

            <View style={s.statsRow}>
              <View style={s.statPill}>
                <Text style={s.statPillTxt}>99.9% Uptime</Text>
              </View>
              <View style={s.statPill}>
                <Text style={s.statPillTxt}>20+ Couriers</Text>
              </View>
              <View style={s.statPill}>
                <Text style={s.statPillTxt}>Real-time Tracking</Text>
              </View>
            </View>
          </View>

          {/* Form card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Welcome back</Text>
            <Text style={s.cardSub}>Sign in to your merchant account</Text>

            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Email address</Text>
              <View style={s.inputBox}>
                <Text style={s.inputIcon}>✉</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="merchant@example.com"
                  placeholderTextColor={Colors.fg3}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Password</Text>
              <View style={s.inputBox}>
                <Text style={s.inputIcon}>🔒</Text>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.fg3}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.eyeBtn}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[s.loginBtn, loading && { opacity: 0.75 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.loginBtnTxt}>Sign In  →</Text>
              }
            </TouchableOpacity>

            <Text style={s.footNote}>
              Having trouble? Contact your account manager.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#0A0F1E' },
  safe:        { flex: 1 },
  kav:         { flex: 1, justifyContent: 'flex-end' },

  hero:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  logoRing:    { width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderColor: 'rgba(59,130,246,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoBg:      { width: 76, height: 76, borderRadius: 38, backgroundColor: '#1D3461', alignItems: 'center', justifyContent: 'center' },
  logoEmoji:   { fontSize: 36 },
  brand:       { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 6 },
  tagline:     { fontSize: 14, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.3, marginBottom: 24 },
  statsRow:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  statPill:    { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  statPillTxt: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

  card:        { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 36, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20 },
  cardTitle:   { fontSize: 24, fontWeight: '800', color: Colors.fg, marginBottom: 4 },
  cardSub:     { fontSize: 14, color: Colors.fg2, marginBottom: 24 },

  fieldWrap:   { marginBottom: 14 },
  fieldLabel:  { fontSize: 12, fontWeight: '600', color: Colors.fg2, marginBottom: 7 },
  inputBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, gap: 10 },
  inputIcon:   { fontSize: 16, color: Colors.fg3 },
  input:       { flex: 1, height: 50, fontSize: 15, color: Colors.fg },
  eyeBtn:      { fontSize: 16, padding: 4 },

  loginBtn:    { backgroundColor: Colors.accent, borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 18, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  loginBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  footNote:    { textAlign: 'center', fontSize: 12, color: Colors.fg3 },
});
