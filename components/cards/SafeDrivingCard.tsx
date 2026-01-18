import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { StatItem } from '@/components/StatItem';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SafeDrivingCard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.cardTeal }]}>
      <ThemedText type="subtitle" style={styles.cardTitle}>Safe driving analysis</ThemedText>
      <View style={styles.divider} />
      
      <View style={styles.cardBodyRow}>
        {/* Left side: Chart and Driver Class */}
        <View style={styles.cardLeftColumn}>
          <ThemedText style={styles.smallLabel}>Economical driving</ThemedText>
          {/* Simple Chart Placeholder */}
          <View style={styles.chartContainer}>
            {[40, 60, 80, 50, 70, 30].map((h, i) => (
              <View key={i} style={[styles.chartBar, { height: h }]} />
            ))}
          </View>
          <ThemedText style={[styles.smallLabel, { alignSelf: 'center' }]}>Speed</ThemedText>
          
          <View style={styles.driverClassContainer}>
            <ThemedText style={styles.smallLabel}>Safe driving</ThemedText>
            <ThemedText style={styles.largeValue}>B</ThemedText>
            <ThemedText style={styles.smallLabel}>Driver class</ThemedText>
          </View>
        </View>

        {/* Right side: Stats */}
        <View style={styles.cardRightColumn}>
          <StatItem label="Kilometers driven this week:" value="345 km" />
          <StatItem label="Average speed:" value="55 km/h" />
          <StatItem label="Economical driving diagnosis:" value="above average" />
          <StatItem label="Safe driving diagnosis:" value="class B" />
          <StatItem label="Engine malfunction probability:" value="unlikely" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 25,
    padding: 20,
    minHeight: 300,
  },
  cardTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 10,
    width: '80%',
  },
  cardBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardLeftColumn: {
    flex: 1,
    alignItems: 'center',
  },
  cardRightColumn: {
    flex: 1.2,
    justifyContent: 'space-between',
  },
  smallLabel: {
    color: 'white',
    fontSize: 10,
    opacity: 0.9,
    marginBottom: 5,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 4,
    marginBottom: 5,
  },
  chartBar: {
    width: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
  driverClassContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  largeValue: {
    color: 'white',
    fontSize: 80,
    fontWeight: 'bold',
    lineHeight: 85,
  },
});
