import React, { useEffect, useState } from 'react';
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
  const {
    isConnected,
    setAlertCallback,
    lastEngineAlertTemp,
    veml770Illuminance,
    bmp280Temperature,
  } = useBle();


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
          <View style={styles.measurementRow}>
            <ThemedText style={styles.measurementLabel}>Temperature outside:</ThemedText>
            <ThemedText style={styles.measurementValue}>
              {bmp280Temperature !== null ? `${bmp280Temperature}°C` : '--'}
            </ThemedText>
          </View>

          <View style={styles.measurementRow}>
            <ThemedText style={styles.measurementLabel}>Illuminance outside:</ThemedText>
            <ThemedText style={styles.measurementValue}>
              {veml770Illuminance !== null ? `${veml770Illuminance} lx` : '--'}
            </ThemedText>
          </View>

          <View style={styles.measurementRow}>
            <ThemedText style={styles.measurementLabel}>Engine temperature:</ThemedText>
            <ThemedText style={styles.measurementValue}>
              {lastEngineAlertTemp !== null ? `${lastEngineAlertTemp}°C` : '--'}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, alignItems: 'center' },
  iconContainer: { marginVertical: 30 },
  title: { marginBottom: 20, textAlign: 'center' },
  card: { borderRadius: 25, padding: 20, width: '100%' },
  measurementRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  measurementLabel: { color: 'white', fontSize: 16, opacity: 0.9 },
  measurementValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  disabledContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  disabledTitle: { marginBottom: 20, textAlign: 'center' },
  disabledText: { textAlign: 'center', opacity: 0.7, fontSize: 16 },
});
