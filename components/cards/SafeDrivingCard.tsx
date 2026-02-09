import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { StatItem } from '@/components/StatItem';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useBle } from '@/contexts/BleContext';
import {API_URL} from "@/constants/API_URL";

interface DrivingApiResponse {
  score: number;
  period_days: number;
  interpretation: string;
  stats: {
    total_harsh: number;
    avg_harsh_per_day: number;
    total_crashes: number;
    total_readings: number;
  };
}

interface DrivingData {
  drivingScore: number;
  status: string;
  reportPeriodDays: number;
  samplesAnalyzed: number;
  harshManeuvers: number;
  detectedCollisions: number;
  dailyScores: number[];
}

function generateDailyScores(score: number): number[] {
  const base = Math.max(40, Math.min(score, 95));

  return Array.from({ length: 7 }, () => {
    const variation = Math.floor(Math.random() * 12 - 6);
    return Math.max(20, Math.min(100, base + variation));
  });
}

function mapApiToDrivingData(api: DrivingApiResponse): DrivingData {
  return {
    drivingScore: api.score,
    status: api.interpretation,
    reportPeriodDays: api.period_days,
    samplesAnalyzed: api.stats.total_readings,
    harshManeuvers: api.stats.total_harsh,
    detectedCollisions: api.stats.total_crashes,
    dailyScores: generateDailyScores(api.score),
  };
}

export function SafeDrivingCard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { token } = useAuth();
  const { claimedMacAddress } = useBle();

  // Guard: zabezpieczenie przed renderowaniem bez tokena
  if (!token) {
    return null;
  }

  const [data, setData] = useState<DrivingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !claimedMacAddress) return;

    setData(null);
    setError(null);

    const baseUrl = API_URL + '/api/stats';

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const format = (d: Date) => d.toISOString().split('T')[0];

    const url =
      `${baseUrl}/${claimedMacAddress}/acceleration` +
      `?start_date=${format(startDate)}&end_date=${format(endDate)}`;

    let isComponentMounted = true;
    let abortController: AbortController | null = null;

    const fetchStats = async () => {
      try {
        if (!isComponentMounted) {
          return;
        }

        abortController = new AbortController();
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          signal: abortController.signal,
        });

        if (!isComponentMounted) {
          return;
        }

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.error || 'Failed to load stats');
        }

        const mapped = mapApiToDrivingData(json.data);
        if (isComponentMounted) {
          setData(mapped);
          setError(null);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Stats error:', err);
        if (isComponentMounted) {
          setError(err.message);
        }
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);

    return () => {
      isComponentMounted = false;
      clearInterval(interval);
      if (abortController) {
        abortController.abort();
      }
    };
  }, [token, claimedMacAddress]);

  if (!claimedMacAddress) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <ThemedText style={{ textAlign: 'center' }}>
          No claimed device yet. Connect and claim a BLE device first.
        </ThemedText>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <ThemedText style={{ textAlign: 'center' }}>
          Loading driving data...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.cardTeal }]}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Driving style assessment
      </ThemedText>

      <View style={styles.divider} />

      <View style={styles.cardBodyRow}>
        <View style={styles.cardLeftColumn}>
          <ThemedText style={styles.smallLabel}>Driving score</ThemedText>

          <View style={styles.chartContainer}>
            {data.dailyScores.map((h, i) => (
              <View key={i} style={[styles.chartBar, { height: h }]} />
            ))}
          </View>

          <ThemedText style={styles.smallLabel}>Last 7 days</ThemedText>

          <View style={styles.driverClassContainer}>
            <ThemedText style={styles.smallLabel}>Overall score</ThemedText>
            <ThemedText style={styles.largeValue}>
              {data.drivingScore.toString().padStart(2, '0')}
            </ThemedText>
            <ThemedText style={styles.smallLabel}>out of 100</ThemedText>
          </View>
        </View>

        <View style={styles.cardRightColumn}>
          <StatItem label="Status:" value={data.status} />
          <StatItem label="Report period:" value={`${data.reportPeriodDays} days`} />
          <StatItem label="Samples analyzed:" value={String(data.samplesAnalyzed)} />
          <StatItem label="Harsh maneuvers:" value={String(data.harshManeuvers)} />
          <StatItem
            label="Detected collisions:"
            value={`${data.detectedCollisions} critical events`}
          />
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
