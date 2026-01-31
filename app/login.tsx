import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TextInput, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ActionButton } from '@/components/ActionButton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';


export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter username');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        router.replace('/home');
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid username or password');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="antenna.radiowaves.left.and.right" size={80} color={colors.tint} />
          <ThemedText type="title" style={styles.appTitle}>Car Assistant</ThemedText>
          <ThemedText style={styles.subtitle}>Connected Vehicle Management</ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText type="subtitle" style={styles.formTitle}>Sign In</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Username</ThemedText>
            <View style={[styles.inputContainer, { borderColor: colors.border || '#ccc' }]}>
              <IconSymbol name="person.fill" size={20} color={colors.tint} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your username"
                placeholderTextColor={colors.textSecondary || '#999'}
                value={username}
                onChangeText={setUsername}
                editable={!isLoading}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={[styles.inputContainer, { borderColor: colors.border || '#ccc' }]}>
              <IconSymbol name="lock.fill" size={20} color={colors.tint} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary || '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <IconSymbol
                  name={showPassword ? 'eye.fill' : 'eye.slash.fill'}
                  size={20}
                  color={colors.tint}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ActionButton
            text={isLoading ? 'Signing in...' : 'Sign In'}
            onPress={handleLogin}
            disabled={isLoading}
          />

          <View style={[styles.demoInfo, { backgroundColor: colors.cardTeal + '20' }]}>
            <IconSymbol name="info.circle.fill" size={16} color={colors.tint} />
            <ThemedText style={styles.demoText}>
              Demo credentials: username (min 3 chars) & password (min 6 chars)
            </ThemedText>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Secure connection to your vehicle
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  appTitle: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
  form: {
    gap: 20,
  },
  formTitle: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  demoInfo: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 10,
  },
  demoText: {
    flex: 1,
    fontSize: 12,
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});
