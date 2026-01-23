import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BleProvider } from '@/contexts/BleContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AlertPopup } from '@/components/AlertPopup';
import { BleAlertBridge } from '@/components/BleAlertBridge';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[colorScheme ?? 'light'].background }}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ animationEnabled: !isLoggedIn }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        {isLoggedIn && (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="connect-device" options={{ headerShown: false }} />
            <Stack.Screen name="measurements" options={{ headerShown: false }} />
            <Stack.Screen name="parking-mode" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
      <BleAlertBridge />
      <AlertPopup />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <BleProvider>
      <AlertProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AlertProvider>
    </BleProvider>
  );
}

//           <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//             <Stack>
//               <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//               <Stack.Screen name="connect-device" options={{ headerShown: false }} />
//               <Stack.Screen name="measurements" options={{ headerShown: false }} />
//               <Stack.Screen name="parking-mode" options={{ headerShown: false }} />
//               <Stack.Screen name="settings" options={{ headerShown: false }} />
//               <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
//             </Stack>
//             <StatusBar style="auto" />
//           </ThemeProvider>