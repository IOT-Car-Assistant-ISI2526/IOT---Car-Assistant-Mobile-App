import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Header } from '@/components/Header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBle } from '@/contexts/BleContext';

export default function MeasurementsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isConnected } = useBle();

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.disabledContainer}>
          <ThemedText type="title" style={styles.disabledTitle}>View Last Measurements</ThemedText>
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
          <IconSymbol name="wrench.fill" size={100} color={colors.tint} />
        </View>

        <ThemedText type="title" style={styles.title}>Last Measurements</ThemedText>

        <View style={[styles.card, { backgroundColor: colors.cardTeal }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Recent Data</ThemedText>
          <View style={styles.divider} />
          
          <View style={styles.measurementRow}>
            <ThemedText style={styles.measurementLabel}>Temperature:</ThemedText>
            <ThemedText style={styles.measurementValue}>22°C</ThemedText>
          </View>
          <View style={styles.measurementRow}>
            <ThemedText style={styles.measurementLabel}>Speed:</ThemedText>
            <ThemedText style={styles.measurementValue}>55 km/h</ThemedText>
          </View>
          <View style={styles.measurementRow}>
            <ThemedText style={styles.measurementLabel}>Engine RPM:</ThemedText>
            <ThemedText style={styles.measurementValue}>2500</ThemedText>
          </View>
          <View style={styles.measurementRow}>
            <ThemedText style={styles.measurementLabel}>Fuel Level:</ThemedText>
            <ThemedText style={styles.measurementValue}>75%</ThemedText>
          </View>
          <View style={styles.measurementRow}>
            <ThemedText style={styles.measurementLabel}>Timestamp:</ThemedText>
            <ThemedText style={styles.measurementValue}>2024-01-15 14:30</ThemedText>
          </View>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: 25,
    padding: 20,
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
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  measurementLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  measurementValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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

