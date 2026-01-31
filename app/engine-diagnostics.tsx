import React from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';

import { LineChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/Header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBle } from '@/contexts/BleContext';
import { ActionButton } from '@/components/ActionButton';

const screenWidth = Dimensions.get('window').width;

export default function EngineDiagnosticsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    isConnected,
    isDiagnosing,
    engineTemperatures,
    startEngineDiagnostics,
    stopEngineDiagnostics,
    error,
  } = useBle();

  const handleStart = async () => {
    try {
      await startEngineDiagnostics();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleStop = async () => {
    await stopEngineDiagnostics();
  };

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.centeredView}>
          <ThemedText>Please connect to a BLE device first.</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const data = engineTemperatures.length
    ? engineTemperatures
    : [0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Engine Diagnostics
        </ThemedText>

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

        <LineChart
          data={{
            labels: data.map((_, i) => i.toString()),
            datasets: [{ data }],
          }}
          width={screenWidth - 40}
          height={220}
          yAxisSuffix="°C"
          chartConfig={{
            backgroundColor: colors.background,
            backgroundGradientFrom: colors.background,
            backgroundGradientTo: colors.background,
            decimalPlaces: 1,
            color: () => 'red',
            labelColor: () => '#666',
            propsForDots: {
              r: '3',
              strokeWidth: '1',
              stroke: 'red',
            },
          }}
          bezier
          style={styles.chart}
        />

        <View style={styles.buttonContainer}>
          {!isDiagnosing ? (
            <ActionButton text="Start Diagnosis" onPress={handleStart} />
          ) : (
            <ActionButton
              text="Diagnosis Running"
              disabled
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { marginBottom: 20 },
  errorText: { color: 'red', marginBottom: 10 },

  chart: {
    borderRadius: 12,
    marginVertical: 20,
  },

  buttonContainer: {
    marginTop: 20,
  },
});
