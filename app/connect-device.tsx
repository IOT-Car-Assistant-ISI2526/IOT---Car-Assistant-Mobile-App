import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Header } from '@/components/Header';
import { ActionButton } from '@/components/ActionButton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBle } from '@/contexts/BleContext';
import { useRouter } from 'expo-router';
import { Device } from 'react-native-ble-plx';

export default function ConnectDeviceScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const {
    isConnected,
    deviceName,
    isScanning,
    scannedDevices,
    error,
    scanForDevices,
    stopScan,
    connectDevice,
    disconnectDevice,
    writeSsid,
    writePassword,
    triggerWifiSwitch,
  } = useBle();

  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  const handleScan = async () => {
    await scanForDevices();
  };

  const handleConnect = async (device: Device) => {
    await connectDevice(device);
  };

  const handleDisconnect = async () => {
    await disconnectDevice();
  };

  const handleSendCredentials = async () => {
    if (!ssid) {
      Alert.alert('Error', 'Please enter a Wi-Fi SSID');
      return;
    }
    setIsSubmitting(true);
    try {
      await writeSsid(ssid);
      await writePassword(password);
      await triggerWifiSwitch();
      Alert.alert('Success', 'Wi-Fi credentials sent successfully!');
      setSsid('');
      setPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <IconSymbol name="antenna.radiowaves.left.and.right" size={100} color={colors.tint} />
        </View>

        <ThemedText type="title" style={styles.title}>Connect Device to BLE</ThemedText>
        <ThemedText style={styles.description}>
          {isConnected
            ? `Connected to: ${deviceName}`
            : 'Scan for available Bluetooth devices to connect'}
        </ThemedText>

        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.buttonRed }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="white" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        {isConnected ? (
          <View style={styles.connectedContainer}>
            <View style={[styles.statusCard, { backgroundColor: colors.cardTeal }]}>
              <IconSymbol name="checkmark.circle.fill" size={50} color="white" />
              <ThemedText style={styles.statusText}>Connected</ThemedText>
              <ThemedText style={styles.deviceName}>{deviceName}</ThemedText>
            </View>

            <View style={styles.wifiForm}>
              <ThemedText type="subtitle" style={styles.wifiTitle}>Configure Wi-Fi</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Enter Wi-Fi SSID"
                placeholderTextColor={colors.textSecondary}
                value={ssid}
                onChangeText={setSsid}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Enter Wi-Fi Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <ActionButton
                text={isSubmitting ? 'Sending...' : 'Send Credentials'}
                onPress={handleSendCredentials}
                variant="default"
                disabled={isSubmitting}
              />
            </View>

            <ActionButton
              text="Disconnect"
              disabled={true}
            />
          </View>
        ) : (
          <>
            <ActionButton
              text={isScanning ? 'Scanning...' : 'Scan for Devices'}
              onPress={handleScan}
              variant="default"
            />

            {isScanning && (
              <View style={styles.scanningIndicator}>
                <ActivityIndicator size="large" color={colors.tint} />
                <ThemedText style={styles.scanningText}>
                  Scanning for devices... (10 seconds)
                </ThemedText>
              </View>
            )}

            {scannedDevices.length > 0 && (
              <View style={styles.devicesList}>
                <ThemedText type="subtitle" style={styles.devicesTitle}>
                  Available Devices ({scannedDevices.length}):
                </ThemedText>
                {scannedDevices.map((device) => (
                  <TouchableOpacity
                    key={device.id}
                    style={[styles.deviceItem, { backgroundColor: colors.cardTeal }]}
                    onPress={() => handleConnect(device)}
                  >
                    <IconSymbol name="antenna.radiowaves.left.and.right" size={24} color="white" />
                    <View style={styles.deviceInfo}>
                      <ThemedText style={styles.deviceItemText}>
                        {device.name || 'Unknown Device'}
                      </ThemedText>
                      {device.rssi && (
                        <ThemedText style={styles.deviceRssi}>
                          Signal: {device.rssi} dBm
                        </ThemedText>
                      )}
                    </View>
                    <IconSymbol name="chevron.right" size={20} color="white" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!isScanning && scannedDevices.length === 0 && !error && (
              <ThemedText style={styles.noDevicesText}>
                No devices found. Make sure your BLE device is powered on and nearby.
              </ThemedText>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginVertical: 30,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    gap: 10,
    width: '100%',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  connectedContainer: {
    width: '100%',
    gap: 20,
  },
  statusCard: {
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    gap: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  deviceName: {
    color: 'white',
    fontSize: 18,
    opacity: 0.9,
  },
  scanningIndicator: {
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  scanningText: {
    opacity: 0.7,
    fontSize: 14,
  },
  devicesList: {
    width: '100%',
    marginTop: 30,
    gap: 15,
  },
  devicesTitle: {
    marginBottom: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    gap: 15,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceRssi: {
    color: 'white',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  noDevicesText: {
    marginTop: 20,
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 14,
  },
  wifiForm: {
    width: '100%',
    gap: 15,
    marginVertical: 20,
  },
  wifiTitle: {
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    width: '100%',
  },
});
