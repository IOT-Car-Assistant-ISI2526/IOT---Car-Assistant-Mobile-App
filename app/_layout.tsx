import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { BleProvider } from '@/contexts/BleContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { AlertPopup } from '@/components/AlertPopup';
import { BleAlertBridge } from '@/components/BleAlertBridge';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <BleProvider>

      <AlertProvider>
        <BleAlertBridge />
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="connect-device" options={{ headerShown: false }} />
            <Stack.Screen name="measurements" options={{ headerShown: false }} />
            <Stack.Screen name="parking-mode" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
          <AlertPopup />
        </ThemeProvider>
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
