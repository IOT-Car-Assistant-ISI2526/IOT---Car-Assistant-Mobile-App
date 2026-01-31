import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header } from '@/components/Header';
import { SafeDrivingCard } from '@/components/cards/SafeDrivingCard';
import { WeatherAlertCard } from '@/components/cards/WeatherAlertCard';
import { EngineAlertCard } from '@/components/cards/EngineAlertCard';
import { ActionButton } from '@/components/ActionButton';
import { useRouter } from 'expo-router';
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/login" />;
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
