import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-store';
import { Colors } from '../../constants/colors';

type LoginMode = 'password' | 'otp';

export default function LoginScreen() {
  const [mode, setMode] = useState<LoginMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const login = useAuth(s => s.login);

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (mode === 'password' && !password) { setError('Password is required'); return; }
    if (mode === 'otp' && !otp) { setError('OTP is required'); return; }
    setLoading(true);
    try {
      await login(email.trim(), mode === 'password' ? password : otp);
    } catch (e) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={s.card}>
              {/* Package icon */}
              <View style={s.pkgIcon}>
                <Text style={{ fontSize: 26 }}>📦</Text>
              </View>
              <Text style={s.brand}>SwiftShip</Text>
              <Text style={s.tagline}>Merchant Logistics &amp; Shipping Portal</Text>

              {/* Password / OTP toggle */}
              <View style={s.tabToggle}>
                <TouchableOpacity
                  style={[s.tabBtn, mode === 'password' && s.tabBtnOn]}
                  onPress={() => setMode('password')}
                  activeOpacity={0.75}
                >
                  <Text style={[s.tabBtnTxt, mode === 'password' && s.tabBtnTxtOn]}>Password</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabBtn, mode === 'otp' && s.tabBtnOn]}
                  onPress={() => setMode('otp')}
                  activeOpacity={0.75}
                >
                  <Text style={[s.tabBtnTxt, mode === 'otp' && s.tabBtnTxtOn]}>OTP Login</Text>
                </TouchableOpacity>
              </View>

              {/* Email */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Email Address</Text>
                <View style={s.inputBox}>
                  <Text style={s.inputIcon}>✉</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@company.com"
                    placeholderTextColor={Colors.fg3}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {mode === 'password' ? (
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Password</Text>
                  <View style={s.inputBox}>
                    <Text style={s.inputIcon}>🔒</Text>
                    <TextInput
                      style={s.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.fg3}
                      secureTextEntry={!showPass}
                    />
                    <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={s.eyeBtn}>{showPass ? '🙈' : '👁'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>One-Time Password</Text>
                  <View style={s.inputBox}>
                    <Text style={s.inputIcon}>🔑</Text>
                    <TextInput
                      style={s.input}
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="Enter OTP sent to your email"
                      placeholderTextColor={Colors.fg3}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              )}

              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorTxt}>{error}</Text>
                </View>
              ) : null}

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

              <View style={s.orRow}>
                <View style={s.orLine} />
                <Text style={s.orTxt}>or</Text>
                <View style={s.orLine} />
              </View>

              <TouchableOpacity style={s.googleBtn} activeOpacity={0.8}>
                <Text style={s.googleG}>G</Text>
                <Text style={s.googleTxt}>Continue with Google</Text>
              </TouchableOpacity>

              <Text style={s.legal}>
                By signing in, you agree to SwiftShip Merchant{'\n'}Terms of Service and Privacy Policy.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.bg },
  safe:          { flex: 1 },
  kav:           { flex: 1 },
  scroll:        { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, paddingVertical: 32 },

  card:          { width: '100%', maxWidth: 400, backgroundColor: Colors.surface, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },

  pkgIcon:       { width: 60, height: 60, borderRadius: 18, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  brand:         { fontSize: 24, fontWeight: '800', color: Colors.fg, textAlign: 'center', letterSpacing: -0.4, marginBottom: 4 },
  tagline:       { fontSize: 12, color: Colors.fg2, textAlign: 'center', marginBottom: 20 },

  tabToggle:     { flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 3, marginBottom: 18, gap: 3 },
  tabBtn:        { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabBtnOn:      { backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  tabBtnTxt:     { fontSize: 13, fontWeight: '600', color: Colors.fg2 },
  tabBtnTxtOn:   { color: Colors.fg },

  fieldWrap:     { marginBottom: 14 },
  fieldLabel:    { fontSize: 11, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1.5, borderColor: '#D1D5DB', paddingHorizontal: 12, gap: 8 },
  inputIcon:     { fontSize: 14, color: Colors.fg3 },
  input:         { flex: 1, height: 46, fontSize: 14, color: Colors.fg },
  eyeBtn:        { fontSize: 15, padding: 4 },

  errorBox:      { backgroundColor: '#FFF1F0', borderRadius: 10, borderWidth: 1, borderColor: '#FECDD3', padding: 11, marginBottom: 12 },
  errorTxt:      { fontSize: 13, color: Colors.error, fontWeight: '500' },

  loginBtn:      { backgroundColor: '#2563EB', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 18 },
  loginBtnTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },

  orRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  orLine:        { flex: 1, height: 1, backgroundColor: Colors.border },
  orTxt:         { fontSize: 11, fontWeight: '600', color: Colors.fg3, textTransform: 'uppercase', letterSpacing: 0.5 },

  googleBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: Colors.surface },
  googleG:       { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  googleTxt:     { fontSize: 14, fontWeight: '600', color: '#374151' },

  legal:         { fontSize: 10, color: Colors.fg3, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});
