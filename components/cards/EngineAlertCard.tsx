import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBle } from '@/contexts/BleContext';


export function EngineAlertCard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { lastEngineAlertTemp, isConnected } = useBle();

  // Don't render anything if device disconnected, but don't return null - return empty fragment
  if (!isConnected) {
    return <></>;
  }

  const displayText =
    typeof lastEngineAlertTemp === 'number'
      ? `${lastEngineAlertTemp.toFixed(1)} °C`
      : '—';

  return (
    <View style={[styles.alertCard, { backgroundColor: colors.cardOrange }]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertMainInfo}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Engine state</ThemedText>
          <IconSymbol name="gearshape.fill" size={60} color="white" style={styles.alertIcon} />
          <ThemedText style={styles.mainStatusText}>current status</ThemedText>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.alertSideInfo}>
          <ThemedText style={styles.largeValue}>
            {displayText}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    borderRadius: 25,
    padding: 20,
  },
  cardTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertMainInfo: {
    flex: 1,
    alignItems: 'center',
  },
  alertSideInfo: {
    flex: 1,
    paddingLeft: 15,
    fontSize: 26,
  },
  verticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  alertIcon: {
    marginVertical: 10,
  },
  mainStatusText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  largeValue: {
    color: 'white',
    fontSize: 50,
    fontWeight: 'bold',
    lineHeight: 85,
  },
});

