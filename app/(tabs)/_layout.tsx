import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName, focusedName: IconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={22} color={color} />
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
      <Tabs.Screen name="index"      options={{ title: 'Home',       tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen name="orders"     options={{ title: 'Orders',     tabBarIcon: tabIcon('list-outline', 'list') }} />
      <Tabs.Screen name="operations" options={{ title: 'Operations', tabBarIcon: tabIcon('grid-outline', 'grid') }} />
      <Tabs.Screen name="wallet"     options={{ title: 'Wallet',     tabBarIcon: tabIcon('wallet-outline', 'wallet') }} />
      <Tabs.Screen name="account"    options={{ title: 'Account',    tabBarIcon: tabIcon('person-outline', 'person') }} />
    </Tabs>
  );
}
