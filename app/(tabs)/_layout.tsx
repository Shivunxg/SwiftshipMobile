import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Colors } from '../../constants/colors';

function TabIcon({ emoji, color, focused }: { emoji: string; color: string; focused: boolean }) {
  return (
    <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: focused ? `${color}18` : 'transparent' }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: 68,
        paddingBottom: 10,
        paddingTop: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 10,
      },
      tabBarActiveTintColor: Colors.accent,
      tabBarInactiveTintColor: Colors.fg3,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 1 },
    }}>
      <Tabs.Screen name="index"      options={{ title: 'Home',       tabBarIcon: ({ color, focused }) => <TabIcon emoji="🏠" color={color} focused={focused} /> }} />
      <Tabs.Screen name="orders"     options={{ title: 'Orders',     tabBarIcon: ({ color, focused }) => <TabIcon emoji="📦" color={color} focused={focused} /> }} />
      <Tabs.Screen name="operations" options={{ title: 'Operations', tabBarIcon: ({ color, focused }) => <TabIcon emoji="⚙️" color={color} focused={focused} /> }} />
      <Tabs.Screen name="wallet"     options={{ title: 'Wallet',     tabBarIcon: ({ color, focused }) => <TabIcon emoji="💰" color={color} focused={focused} /> }} />
      <Tabs.Screen name="account"    options={{ title: 'Account',    tabBarIcon: ({ color, focused }) => <TabIcon emoji="👤" color={color} focused={focused} /> }} />
    </Tabs>
  );
}
