import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatItem } from '@/components/StatItem';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function WeatherAlertCard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.alertCard, { backgroundColor: colors.cardTeal }]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertMainInfo}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Weather alert</ThemedText>
          <IconSymbol name="cloud.fill" size={60} color="white" style={styles.alertIcon} />
          <ThemedText style={styles.mainStatusText}>clear</ThemedText>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.alertSideInfo}>
          <StatItem label="Average temperature:" value="14°C" align="right" />
          <StatItem label="Black ice chance:" value="unlikely" align="right" />
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
});

