import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ActionButtonProps {
  text: string;
  onPress?: () => void;
  variant?: 'default' | 'small';
  backgroundColor?: string;
  disabled?: boolean;
}

export function ActionButton({ text, onPress, variant = 'default', backgroundColor, disabled = false }: ActionButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const bgColor = backgroundColor || colors.cardTeal;

  return (
    <TouchableOpacity 
      style={[
        variant === 'small' ? styles.smallActionButton : styles.actionButton, 
        { backgroundColor: bgColor, opacity: disabled ? 0.5 : 1 }
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <ThemedText style={variant === 'small' ? styles.smallButtonText : styles.buttonText}>
        {text}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  smallActionButton: {
    borderRadius: 15,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: -5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
  },
});

