import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HamburgerMenu } from '@/components/HamburgerMenu';

export function Header() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <ThemedText type="title" style={styles.headerTitle}>Travel Assistant</ThemedText>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <IconSymbol name="menu" size={32} color="white" />
        </TouchableOpacity>
      </View>
      <HamburgerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

