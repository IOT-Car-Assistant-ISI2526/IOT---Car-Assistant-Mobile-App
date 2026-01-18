import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

interface BleContextType {
  isConnected: boolean;
  deviceName: string | null;
  deviceId: string | null;
  isScanning: boolean;
  scannedDevices: Device[];
  error: string | null;
  scanForDevices: () => Promise<void>;
  stopScan: () => void;
  connectDevice: (device: Device) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  connectedDevice: Device | null;
}

const BleContext = createContext<BleContextType | undefined>(undefined);

export function BleProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const managerRef = useRef<BleManager | null>(null);
  const subscriptionRef = useRef<any>(null);
  const connectedDeviceRef = useRef<Device | null>(null);

  const disconnectDevice = async () => {
    if (connectedDeviceRef.current && managerRef.current) {
      try {
        await connectedDeviceRef.current.cancelConnection();
      } catch (err: any) {
        console.error('Disconnect error:', err);
      }
    }
    
    setIsConnected(false);
    setDeviceName(null);
    setDeviceId(null);
    setConnectedDevice(null);
    connectedDeviceRef.current = null;
    setError(null);
  };

  // Initialize BLE Manager
  useEffect(() => {
    managerRef.current = new BleManager();
    
    const subscription = managerRef.current.onStateChange((state) => {
      if (state === State.PoweredOn) {
        setError(null);
      } else if (state === State.PoweredOff) {
        setError('Bluetooth is turned off. Please enable Bluetooth.');
        setIsScanning(false);
        // Disconnect if connected
        if (connectedDeviceRef.current) {
          disconnectDevice();
        }
      } else if (state === State.Unauthorized) {
        setError('Bluetooth permission denied. Please grant Bluetooth permissions.');
      }
    }, true);

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      if (managerRef.current) {
        managerRef.current.destroy();
      }
    };
  }, []);

  // Request permissions
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+ requires new permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Older Android versions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        
        return (
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED ||
          granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }
    return true; // iOS permissions are handled via Info.plist
  };

  const scanForDevices = async () => {
    if (!managerRef.current) {
      setError('BLE Manager not initialized');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setError('Bluetooth permissions are required to scan for devices');
      Alert.alert(
        'Permission Required',
        'Bluetooth permissions are required to scan for devices. Please grant permissions in app settings.',
      );
      return;
    }

    try {
      setError(null);
      setIsScanning(true);
      setScannedDevices([]);

      const state = await managerRef.current.state();
      if (state !== State.PoweredOn) {
        setError('Bluetooth is not enabled. Please turn on Bluetooth.');
        setIsScanning(false);
        return;
      }

      // Start scanning
      managerRef.current.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          setError(error.message);
          setIsScanning(false);
          return;
        }

        if (device) {
          setScannedDevices((prevDevices) => {
            // Avoid duplicates
            const exists = prevDevices.some((d) => d.id === device.id);
            if (!exists && device.name) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        stopScan();
      }, 10000);
    } catch (err: any) {
      setError(err.message || 'Failed to start scanning');
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    if (managerRef.current) {
      managerRef.current.stopDeviceScan();
    }
    setIsScanning(false);
  };

  const connectDevice = async (device: Device) => {
    if (!managerRef.current) {
      setError('BLE Manager not initialized');
      return;
    }

    try {
      setError(null);
      stopScan();

      // Connect to device
      const connectedDevice = await device.connect();
      
      // Discover services and characteristics
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      setConnectedDevice(connectedDevice);
      connectedDeviceRef.current = connectedDevice;
      setIsConnected(true);
      setDeviceName(device.name || 'Unknown Device');
      setDeviceId(device.id);

      // Monitor connection state
      connectedDevice.onDisconnected(() => {
        setIsConnected(false);
        setDeviceName(null);
        setDeviceId(null);
        setConnectedDevice(null);
        connectedDeviceRef.current = null;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect to device');
      setIsConnected(false);
      setDeviceName(null);
      setDeviceId(null);
      setConnectedDevice(null);
      connectedDeviceRef.current = null;
    }
  };

  return (
    <BleContext.Provider
      value={{
        isConnected,
        deviceName,
        deviceId,
        isScanning,
        scannedDevices,
        error,
        scanForDevices,
        stopScan,
        connectDevice,
        disconnectDevice,
        connectedDevice,
      }}
    >
      {children}
    </BleContext.Provider>
  );
}

export function useBle() {
  const context = useContext(BleContext);
  if (context === undefined) {
    throw new Error('useBle must be used within a BleProvider');
  }
  return context;
}
