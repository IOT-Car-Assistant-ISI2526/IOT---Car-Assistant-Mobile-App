import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface StatItemProps {
  label: string;
  value: string;
  align?: 'left' | 'right';
}

export function StatItem({ label, value, align = 'right' }: StatItemProps) {
  return (
    <View style={[styles.statItem, { alignItems: align === 'right' ? 'flex-end' : 'flex-start' }]}>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  statItem: {
    marginBottom: 10,
  },
  statLabel: {
    color: 'white',
    fontSize: 10,
    opacity: 0.8,
  },
  statValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

