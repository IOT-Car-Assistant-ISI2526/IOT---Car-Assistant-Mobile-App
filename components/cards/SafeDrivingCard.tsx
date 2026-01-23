import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { StatItem } from '@/components/StatItem';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Define a type for the expected data shape from your HTTP endpoint
interface DrivingData {
  drivingScore: number;
  status: string;
  reportPeriodDays: number;
  samplesAnalyzed: number;
  harshManeuvers: number;
  detectedCollisions: number;
  dailyScores: number[]; // e.g., an array of scores for the last 7 days
}

export function SafeDrivingCard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [drivingData, setDrivingData] = useState<DrivingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // IMPORTANT: Replace with your device's actual local IP address and port
    const localUrl = 'http://192.168.1.123/driving-data';

    const fetchData = async () => {
      try {
        const response = await fetch(localUrl);
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        const data: DrivingData = await response.json();
        setDrivingData(data);
        setError(null); // Clear previous errors on success
      } catch (e: any) {
        setError(e.message);
        console.error("Failed to fetch driving data:", e);
      }
    };

    // Fetch data immediately when the component mounts
    fetchData();

    // Set up a timer to fetch data periodically
    const intervalId = setInterval(fetchData, 30000); // e.g., fetch every 30 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // The empty dependency array ensures this effect runs only once on mount

  // You can show a loading or error state
  if (error && !drivingData) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, justifyContent: 'center' }]}>
        <ThemedText style={{ textAlign: 'center', color: colors.error }}>
          Error fetching data: {error}
        </ThemedText>
      </View>
    );
  }

  if (!drivingData) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, justifyContent: 'center' }]}>
        <ThemedText style={{ textAlign: 'center' }}>Loading driving data...</ThemedText>
      </View>
    );
  }

  // Once data is loaded, render the full card
  return (
    <View style={[styles.card, { backgroundColor: colors.cardTeal }]}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Driving style assessment
      </ThemedText>

      <View style={styles.divider} />

      <View style={styles.cardBodyRow}>
        {/* LEFT SIDE */}
        <View style={styles.cardLeftColumn}>
          <ThemedText style={styles.smallLabel}>Driving score</ThemedText>
          <View style={styles.chartContainer}>
            {drivingData.dailyScores.map((h, i) => (
              <View key={i} style={[styles.chartBar, { height: h }]} />
            ))}
          </View>
          <ThemedText style={[styles.smallLabel, { alignSelf: 'center' }]}>
            Last 7 days
          </ThemedText>
          <View style={styles.driverClassContainer}>
            <ThemedText style={styles.smallLabel}>Overall score</ThemedText>
            <ThemedText style={styles.largeValue}>
              {drivingData.drivingScore.toString().padStart(2, '0')}
            </ThemedText>
            <ThemedText style={styles.smallLabel}>out of 100</ThemedText>
          </View>
        </View>

        {/* RIGHT SIDE */}
        <View style={styles.cardRightColumn}>
          <StatItem label="Status:" value={drivingData.status} />
          <StatItem label="Report period:" value={`${drivingData.reportPeriodDays} days`} />
          <StatItem label="Samples analyzed:" value={String(drivingData.samplesAnalyzed)} />
          <StatItem label="Harsh maneuvers:" value={String(drivingData.harshManeuvers)} />
          <StatItem label="Detected collisions:" value={`${drivingData.detectedCollisions} critical events`} />
        </View>
      </View>
    </View>
  );
}

// ... styles remain the same

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
