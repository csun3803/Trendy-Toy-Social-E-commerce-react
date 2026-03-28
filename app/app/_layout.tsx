import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { checkAndRefreshToken } from '@/utils/jwtHelper';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    checkAndRefreshToken(5); // 提前5分钟刷新 token
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="shop/[id]" />
        <Stack.Screen name="series/[id]" />
        <Stack.Screen name="tujian" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}