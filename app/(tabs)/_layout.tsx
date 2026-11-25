import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border, height: 60, paddingBottom: 8 },
      tabBarActiveTintColor: Colors.accent,
      tabBarInactiveTintColor: Colors.fg2,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
    }}>
      <Tabs.Screen name="index"      options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⊞</Text> }} />
      <Tabs.Screen name="orders"     options={{ title: 'Orders',    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text> }} />
      <Tabs.Screen name="operations" options={{ title: 'Ops',       tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚡</Text> }} />
      <Tabs.Screen name="wallet"     options={{ title: 'Wallet',    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💳</Text> }} />
      <Tabs.Screen name="account"    options={{ title: 'Account',   tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text> }} />
    </Tabs>
  );
}
