import React from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/contexts/AlertContext';

export function AlertPopup() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { currentAlert, dismissAlert } = useAlert();
  const slideAnim = React.useRef(new Animated.Value(-300)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (currentAlert) {
      // Show animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentAlert]);

  if (!currentAlert) {
    return null;
  }

  // Parse alert message format: "SENSOR: message"
  const parts = currentAlert.split(':');
  const sensorName = parts[0]?.trim() || 'Alert';
  const message = parts.slice(1).join(':').trim() || currentAlert;

  return (
    <Modal
      visible={!!currentAlert}
      transparent
      animationType="none"
      onRequestClose={dismissAlert}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.tint,
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.alertHeader}>
            <View style={styles.alertIconContainer}>
              <IconSymbol name="exclamationmark.triangle.fill" size={32} color={colors.tint} />
            </View>
            <View style={styles.alertTextContainer}>
              <ThemedText type="subtitle" style={styles.sensorName}>
                {sensorName}
              </ThemedText>
              <ThemedText style={styles.alertMessage}>{message}</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={dismissAlert}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  alertContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  alertTextContainer: {
    flex: 1,
  },
  sensorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: 22,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
});

