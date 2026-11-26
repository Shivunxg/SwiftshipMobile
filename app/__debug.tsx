import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../lib/auth-store';
import { api } from '../lib/api';

type Result = { label: string; status: 'ok' | 'fail' | 'pending'; detail: string };

const ENDPOINTS: Array<{ label: string; call: () => Promise<unknown> }> = [
  { label: 'GET /api/merchant/profile',      call: () => api.get('/api/merchant/profile') },
  { label: 'GET /api/orders (page 0)',        call: () => api.get('/api/orders?page=0&size=5') },
  { label: 'GET /api/orders/stats',           call: () => api.get('/api/orders/stats') },
  { label: 'GET /api/payouts',                call: () => api.get('/api/payouts') },
  { label: 'GET /api/wallet/balance',         call: () => api.get('/api/wallet/balance') },
  { label: 'GET /api/couriers',               call: () => api.get('/api/couriers') },
  { label: 'GET /api/weight-disputes',        call: () => api.get('/api/weight-disputes') },
  { label: 'GET /api/ndr/orders',             call: () => api.get('/api/ndr/orders') },
  { label: 'GET /api/rto/orders',             call: () => api.get('/api/rto/orders') },
  { label: 'GET /api/invoices',               call: () => api.get('/api/invoices') },
];

export default function DebugScreen() {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>(
    ENDPOINTS.map(e => ({ label: e.label, status: 'pending', detail: '' }))
  );
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    setResults(ENDPOINTS.map(e => ({ label: e.label, status: 'pending', detail: '' })));
    for (let i = 0; i < ENDPOINTS.length; i++) {
      try {
        const res: any = await ENDPOINTS[i].call();
        const data = res?.data;
        const preview = JSON.stringify(data).slice(0, 80);
        setResults(prev => {
          const next = [...prev];
          next[i] = { label: ENDPOINTS[i].label, status: 'ok', detail: preview };
          return next;
        });
      } catch (e: any) {
        const detail = e?.response
          ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data).slice(0, 60)}`
          : e?.message ?? 'Unknown error';
        setResults(prev => {
          const next = [...prev];
          next[i] = { label: ENDPOINTS[i].label, status: 'fail', detail };
          return next;
        });
      }
    }
    setRunning(false);
  }

  useEffect(() => { runAll(); }, []);

  const ok   = results.filter(r => r.status === 'ok').length;
  const fail = results.filter(r => r.status === 'fail').length;

  return (
    <View style={s.container}>
      <Text style={s.header}>API Health Check</Text>
      {user && <Text style={s.user}>Logged in as: {user.email ?? user.username ?? JSON.stringify(user).slice(0,40)}</Text>}
      <View style={s.summary}>
        <Text style={[s.badge, { backgroundColor: '#16a34a' }]}>{ok} OK</Text>
        <Text style={[s.badge, { backgroundColor: '#dc2626' }]}>{fail} FAIL</Text>
        <Text style={[s.badge, { backgroundColor: '#6b7280' }]}>{results.filter(r=>r.status==='pending').length} pending</Text>
      </View>
      <ScrollView style={s.list}>
        {results.map((r, i) => (
          <View key={i} style={[s.row, r.status === 'fail' && s.rowFail, r.status === 'ok' && s.rowOk]}>
            <View style={s.rowTop}>
              <Text style={s.dot}>
                {r.status === 'pending' ? '⏳' : r.status === 'ok' ? '✅' : '❌'}
              </Text>
              <Text style={s.label}>{r.label}</Text>
            </View>
            {r.detail ? <Text style={s.detail}>{r.detail}</Text> : null}
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={s.btn} onPress={runAll} disabled={running}>
        {running
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnText}>Run Again</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16, paddingTop: 60 },
  header:    { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  user:      { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  summary:   { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge:     { color: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 13, fontWeight: '600' },
  list:      { flex: 1 },
  row:       { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 8 },
  rowOk:     { borderLeftWidth: 3, borderLeftColor: '#16a34a' },
  rowFail:   { borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  rowTop:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:       { fontSize: 16 },
  label:     { color: '#e2e8f0', fontSize: 13, flex: 1 },
  detail:    { color: '#94a3b8', fontSize: 11, marginTop: 4, fontFamily: 'monospace' },
  btn:       { backgroundColor: '#3B82F6', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  btnText:   { color: '#fff', fontWeight: '600', fontSize: 15 },
});
