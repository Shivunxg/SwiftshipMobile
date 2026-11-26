import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface State { error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={s.container}>
        <Text style={s.title}>Screen Crashed</Text>
        <Text style={s.name}>{error.name}: {error.message}</Text>
        <ScrollView style={s.scroll}>
          <Text style={s.stack}>{error.stack}</Text>
        </ScrollView>
        <TouchableOpacity style={s.btn} onPress={() => this.setState({ error: null })}>
          <Text style={s.btnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 60 },
  title:     { color: '#ff4444', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  name:      { color: '#ffaa44', fontSize: 14, marginBottom: 16 },
  scroll:    { flex: 1, backgroundColor: '#0d0d1a', borderRadius: 8, padding: 12 },
  stack:     { color: '#aaa', fontSize: 11, fontFamily: 'monospace' },
  btn:       { marginTop: 16, backgroundColor: '#3B82F6', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText:   { color: '#fff', fontWeight: '600' },
});
