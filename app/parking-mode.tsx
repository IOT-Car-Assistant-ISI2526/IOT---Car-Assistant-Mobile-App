import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/Header';
import { ActionButton } from '@/components/ActionButton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBle } from '@/contexts/BleContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ParkingModeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { 
    isConnected, 
    hcsr04Distance, 
    isHcsr04Streaming,
    startHcsr04Streaming,
    stopHcsr04Streaming
  } = useBle();
  const [isLoading, setIsLoading] = useState(false);
  const [displayedDistance, setDisplayedDistance] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  const handleEnableParkingMode = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Please connect a device first');
      return;
    }

    setIsLoading(true);
    try {
      await startHcsr04Streaming();
    } catch (error: any) {
      Alert.alert('Error', `Failed to enable parking mode: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

   const handleReenableParkingMode = async () => {
      setIsLoading(true);
      try {
        await startHcsr04Streaming();
      } catch (error: any) {
        Alert.alert('Error', `Failed to re-enable parking mode: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    return () => {
      if (isHcsr04Streaming) {
        stopHcsr04Streaming().catch(console.error);
      }
    };
  }, []);
useEffect(() => {
  if (hcsr04Distance !== null) {
    setDisplayedDistance(hcsr04Distance);
    setLastUpdateTime(Date.now());
  }
}, [hcsr04Distance]);
useEffect(() => {
  const interval = setInterval(() => {
    if (Date.now() - lastUpdateTime > 9000) {
      setDisplayedDistance(null);
    }
  }, 500);

  return () => clearInterval(interval);
}, [lastUpdateTime]);


  const formatDistance = (distance: number | null): string | number => {
    if (distance === null) {
      return '--';
    }
    if (distance < 10) {
      return '< 10';
    }
    if (distance > 200) {
      return '> 200';
    }
    return distance;
  };

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.disabledContainer}>
          <ThemedText type="title" style={styles.disabledTitle}>Parking Mode</ThemedText>
          <ThemedText style={styles.disabledText}>
            This feature requires a BLE device to be connected. Please connect a device first.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>Parking Mode</ThemedText>
        <ThemedText style={styles.description}>
            Enable parking mode to start receiving real-time distance measurements.
        </ThemedText>

        <View style={[styles.card, { backgroundColor: colors.cardTeal }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Sensor Status</ThemedText>
          <View style={styles.divider} />
          
          <View style={styles.statusRow}>
            <ThemedText style={styles.statusLabel}>Status:</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: isHcsr04Streaming ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.3)' }]}>
              <ThemedText style={styles.statusText}>
                {isHcsr04Streaming ? 'Active' : 'Inactive'}
              </ThemedText>
            </View>
          </View>
          

          
          {hcsr04Distance !== null && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Warning:</ThemedText>
              <ThemedText style={[styles.infoValue, { color: hcsr04Distance < 30 ? '#ff5252' : 'white' }]}>
                {hcsr04Distance < 30 ? 'Too Close!' : hcsr04Distance < 50 ? 'Caution' : 'Safe'}
              </ThemedText>
            </View>
          )}
        </View>

        {isHcsr04Streaming && (
          <View style={styles.distanceDisplay}>
            <ThemedText type="title" style={[styles.distanceValue, { color: colors.tint }]}>
              {formatDistance(displayedDistance)}
            </ThemedText>
            <ThemedText style={styles.distanceUnit}>cm</ThemedText>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {!isHcsr04Streaming ? (
            <ActionButton 
              text={isLoading ? "Starting..." : "Enable Parking Mode"} 
              onPress={handleEnableParkingMode}
              disabled={isLoading}
            />
          ) : (
            <ActionButton 
              text={isLoading ? "Re-enabling..." : "Re-enable Parking Mode"}
              variant="small"
              backgroundColor={colors.buttonRed}
              onPress={handleReenableParkingMode}
              disabled={isLoading}
            />
          )}
        </View>
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
    alignItems: 'center',
  },
  iconContainer: {
    marginVertical: 30,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    borderRadius: 25,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  cardTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    flex: 1,
  },
  infoValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionsContainer: {
    width: '100%',
    gap: 15,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  disabledTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  disabledText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
  },
  distanceDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 220,
    marginVertical: 18,
    paddingVertical: 44,
    paddingHorizontal: 28,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  distanceValue: {
    fontSize: 96,
    fontWeight: 'bold',
    lineHeight: 100,
  },
  distanceUnit: {
    fontSize: 28,
    opacity: 0.7,
    marginTop: 5,
  },
});