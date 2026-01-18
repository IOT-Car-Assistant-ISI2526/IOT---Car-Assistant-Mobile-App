import React from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, usePathname } from 'expo-router';
import { useBle } from '@/contexts/BleContext';

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ visible, onClose }: HamburgerMenuProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected } = useBle();
  const slideAnim = React.useRef(new Animated.Value(-300)).current;

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'house.fill',
      route: '/(tabs)',
      disabled: false,
    },
    {
      id: 'connect',
      label: 'Connect Device to BLE',
      icon: 'antenna.radiowaves.left.and.right',
      route: '/connect-device',
      disabled: false,
      showBluetoothLogo: true,
    },
    {
      id: 'measurements',
      label: 'View last measurements',
      icon: 'wrench.fill',
      route: '/measurements',
      disabled: !isConnected,
    },
    {
      id: 'parking',
      label: 'Parking Mode',
      icon: 'parking.fill',
      route: '/parking-mode',
      disabled: !isConnected,
    },
  ];

  const handleMenuItemPress = (route: string, disabled: boolean) => {
    if (disabled) return;
    onClose();
    if (route === '/(tabs)') {
      router.push('/(tabs)/' as any);
    } else {
      router.push(route as any);
    }
  };

  const isActive = (route: string) => {
    if (route === '/(tabs)') {
      return pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname === '/';
    }
    return pathname === route;
  };

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={onClose} />
        <Animated.View
          style={[
            styles.menuContainer,
            { backgroundColor: colors.background },
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
            <View style={styles.menuHeader}>
              <ThemedText type="title" style={styles.menuTitle}>Menu</ThemedText>
              <TouchableOpacity onPress={onClose}>
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              {menuItems.map((item) => {
                const active = isActive(item.route);
                const opacity = item.disabled ? 0.5 : 1;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      active && { backgroundColor: colors.tint + '20' },
                      item.disabled && styles.menuItemDisabled,
                    ]}
                    onPress={() => handleMenuItemPress(item.route, item.disabled)}
                    disabled={item.disabled}
                  >
                    <View style={styles.menuItemContent}>
                      {item.id === 'connect' ? (
                        <View style={styles.bluetoothIconContainer}>
                          <IconSymbol 
                            name="antenna.radiowaves.left.and.right" 
                            size={24} 
                            color={item.disabled ? colors.icon : (active ? colors.tint : colors.text)} 
                          />
                        </View>
                      ) : (
                        <IconSymbol 
                          name={item.icon as any} 
                          size={24} 
                          color={item.disabled ? colors.icon : (active ? colors.tint : colors.text)} 
                        />
                      )}
                      <ThemedText 
                        style={[
                          styles.menuItemText,
                          { opacity },
                          active && { color: colors.tint, fontWeight: '600' },
                        ]}
                      >
                        {item.label}
                      </ThemedText>
                    </View>
                    {item.disabled && (
                      <ThemedText style={styles.disabledLabel}>Disabled until BLE connected</ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  isActive('/settings') && { backgroundColor: colors.tint + '20' },
                ]}
                onPress={() => handleMenuItemPress('/settings', false)}
              >
                <View style={styles.menuItemContent}>
                  <IconSymbol 
                    name="gearshape.fill" 
                    size={24} 
                    color={isActive('/settings') ? colors.tint : colors.text} 
                  />
                  <ThemedText 
                    style={[
                      styles.menuItemText,
                      isActive('/settings') && { color: colors.tint, fontWeight: '600' },
                    ]}
                  >
                    Settings
                  </ThemedText>
                </View>
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
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayPressable: {
    flex: 1,
  },
  menuContainer: {
    width: '75%',
    height: '100%',
    paddingTop: 60,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  menuItems: {
    gap: 10,
    flex: 1,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 5,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  menuItemText: {
    fontSize: 16,
    flex: 1,
  },
  disabledLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 5,
    marginLeft: 39,
    fontStyle: 'italic',
  },
  bluetoothIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 10,
    marginBottom: 40,
  },
});
