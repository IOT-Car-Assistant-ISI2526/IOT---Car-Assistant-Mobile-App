import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header } from '@/components/Header';
import { SafeDrivingCard } from '@/components/cards/SafeDrivingCard';
import { WeatherAlertCard } from '@/components/cards/WeatherAlertCard';
import { EngineAlertCard } from '@/components/cards/EngineAlertCard';
import { ActionButton } from '@/components/ActionButton';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SafeDrivingCard />
        <ActionButton text="See previous week" />
        <EngineAlertCard />
        <ActionButton text="Examine" variant="small" backgroundColor={colors.buttonRed} />
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
    gap: 15,
  },
});
