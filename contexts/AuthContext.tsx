import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';

// Update this to your server URL
const API_URL = 'http://10.87.216.41:5000';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    isMountedRef.current = true;

    // Always start with not logged in - skip token check
    if (isMountedRef.current) {
      setIsLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const login = async (user: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // Validation
    if (user.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    if (pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    try {
      console.log('Logging in to:', `${API_URL}/api/auth/login`);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: user,
          password: pass
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Login failed: ${response.status}`;
        console.warn('Login failed:', errorMsg);
        return { success: false, error: errorMsg };
      }

      const { access_token, user_id, username: returnedUsername } = data;

      if (!access_token) {
        console.error('No access_token in response:', data);
        return { success: false, error: 'Invalid server response' };
      }

      // Store token and user info securely
      await SecureStore.setItemAsync('access_token', access_token);
      await SecureStore.setItemAsync('user_id', String(user_id));
      await SecureStore.setItemAsync('username', returnedUsername || user);

      if (isMountedRef.current) {
        setToken(access_token);
        setUsername(returnedUsername || user);
        setIsLoggedIn(true);
      }

      console.log('Login successful');
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Network error';
      console.error('Login error:', err);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('access_token').catch(() => {});
      await SecureStore.deleteItemAsync('user_id').catch(() => {});
      await SecureStore.deleteItemAsync('username').catch(() => {});

      if (isMountedRef.current) {
        setToken(null);
        setUsername(null);
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error('Logout error:', err);
      if (isMountedRef.current) {
        setToken(null);
        setUsername(null);
        setIsLoggedIn(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

