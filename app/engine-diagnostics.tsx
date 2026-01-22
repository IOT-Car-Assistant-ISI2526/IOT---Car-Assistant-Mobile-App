import React from 'react';
import { View, ScrollView, SafeAreaView, StyleSheet, Dimensions } from 'react-native';
import { LineChart, Grid, YAxis, XAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { G, Line, Text } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/Header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBle } from '@/contexts/BleContext';
import { ActionButton } from '@/components/ActionButton';

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

  const data = engineTemperatures.length ? engineTemperatures : [0];

  // Optional tooltip for latest value
  const Tooltip = ({ x, y, data }: any) => {
    if (!data.length) return null;
    const lastIndex = data.length - 1;
    return (
      <G key="tooltip">
        <Line
          x1={x(lastIndex)}
          x2={x(lastIndex)}
          y1={0}
          y2={y(data[lastIndex])}
          stroke="rgba(255,0,0,0.5)"
          strokeWidth={1}
        />
        <Text
          x={x(lastIndex)}
          y={y(data[lastIndex]) - 10}
          fontSize={12}
          fill="red"
          alignmentBaseline="middle"
          textAnchor="middle"
        >
          {data[lastIndex].toFixed(1)}°C
        </Text>
      </G>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>Engine Diagnostics</ThemedText>

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

        <View style={{ flexDirection: 'row', height: 220, marginBottom: 20 }}>
          <YAxis
            data={data}
            contentInset={{ top: 20, bottom: 20 }}
            svg={{ fontSize: 12, fill: 'white' }}
            numberOfTicks={5}
            formatLabel={(value) => `${value.toFixed(0)}°C`}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <LineChart
              style={{ flex: 1 }}
              data={data}
              svg={{ stroke: 'red', strokeWidth: 2 }}
              contentInset={{ top: 20, bottom: 20 }}
              curve={shape.curveMonotoneX}
            >
              <Grid />
              <Tooltip data={data} />
            </LineChart>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!isDiagnosing ? (
            <ActionButton text="Start Diagnosis" onPress={handleStart} />
          ) : (
            <ActionButton text="Stop Diagnosis" onPress={handleStop} backgroundColor={colors.buttonRed} />
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
  buttonContainer: { marginTop: 20 },
});
