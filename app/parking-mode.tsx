import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/Header';
import { ActionButton } from '@/components/ActionButton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBle } from '@/contexts/BleContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ParkingModeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isConnected } = useBle();

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.disabledContainer}>
          <ThemedText type="title" style={styles.disabledTitle}>Parking Mode</ThemedText>
          <ThemedText style={styles.disabledText}>
            This feature requires a BLE device to be connected. Please connect a device first.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <IconSymbol name="parking.fill" size={100} color={colors.tint} />
        </View>

        <ThemedText type="title" style={styles.title}>Parking Mode</ThemedText>
        <ThemedText style={styles.description}>
          Monitor your vehicle while parked. Get alerts for movement, temperature changes, and more.
        </ThemedText>

        <View style={[styles.card, { backgroundColor: colors.cardTeal }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Parking Status</ThemedText>
          <View style={styles.divider} />
          
          <View style={styles.statusRow}>
            <ThemedText style={styles.statusLabel}>Status:</ThemedText>
            <View style={styles.statusBadge}>
              <ThemedText style={styles.statusText}>Active</ThemedText>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Location:</ThemedText>
            <ThemedText style={styles.infoValue}>GPS: 52.2297° N, 21.0122° E</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Parked Since:</ThemedText>
            <ThemedText style={styles.infoValue}>2024-01-15 10:00</ThemedText>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <ActionButton text="Enable Parking Mode" />
          <ActionButton text="Disable Parking Mode" variant="small" backgroundColor={colors.buttonRed} />
        </View>
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
  card: {
    borderRadius: 25,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  cardTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    flex: 1,
  },
  infoValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionsContainer: {
    width: '100%',
    gap: 15,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  disabledTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  disabledText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
  },
});

