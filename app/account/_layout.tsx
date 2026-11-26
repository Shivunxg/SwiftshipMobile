import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function AccountLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.fg,
      headerTitleStyle: { fontWeight: '700', fontSize: 16 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: Colors.bg },
    }} />
  );
}
