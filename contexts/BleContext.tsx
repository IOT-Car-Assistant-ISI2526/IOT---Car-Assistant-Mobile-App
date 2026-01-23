import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { BleManager, Device, State, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Buffer } from 'buffer';

// UUIDs for BLE connection
const WIFI_SERVICE_UUID = '000000ff-0000-1000-8000-00805f9b34fb';
const SSID_CHARACTERISTIC_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';
const PASSWORD_CHARACTERISTIC_UUID = '0000ff03-0000-1000-8000-00805f9b34fb';
const WIFI_SWITCH_CHARACTERISTIC_UUID = '0000ff04-0000-1000-8000-00805f9b34fb';
const HCSR04_CTRL_CHARACTERISTIC_UUID = '0000ff05-0000-1000-8000-00805f9b34fb';
const HCSR04_DATA_CHARACTERISTIC_UUID = '0000ff06-0000-1000-8000-00805f9b34fb';
const ALERT_CHARACTERISTIC_UUID = '0000ff07-0000-1000-8000-00805f9b34fb';
const ENGINE_DIAGNOSTICS_CTRL_UUID = '0000ff08-0000-1000-8000-00805f9b34fb';
const ENGINE_DIAGNOSTICS_DATA_UUID = '0000ff09-0000-1000-8000-00805f9b34fb';

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
  writeSsid: (ssid: string) => Promise<void>;
  writePassword: (password: string) => Promise<void>;
  triggerWifiSwitch: () => Promise<void>;
  // HCSR04 sensor functions
  hcsr04Distance: number | null;
  isHcsr04Streaming: boolean;
  startHcsr04Streaming: () => Promise<void>;
  stopHcsr04Streaming: () => Promise<void>;
  // Alert functions
  setAlertCallback: (callback: (message: string) => void) => void;
  // Engine Diagnostics
  isDiagnosing: boolean;
  engineTemperatures: number[];
  startEngineDiagnostics: () => Promise<void>;
  stopEngineDiagnostics: () => Promise<void>;

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
  const [hcsr04Distance, setHcsr04Distance] = useState<number | null>(null);
  const [isHcsr04Streaming, setIsHcsr04Streaming] = useState(false);
  const managerRef = useRef<BleManager | null>(null);
  const subscriptionRef = useRef<any>(null);
  const connectedDeviceRef = useRef<Device | null>(null);
  const diagnosticsMonitorRef = useRef<any>(null);
  const hcsr04SubscriptionRef = useRef<any>(null);
  const alertSubscriptionRef = useRef<any>(null);
  const onAlertReceivedRef = useRef<((message: string) => void) | null>(null);
  const isMountedRef = useRef(true);
  const operationInProgressRef = useRef(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [engineTemperatures, setEngineTemperatures] = useState<number[]>([]);

  const disconnectDevice = async () => {
    operationInProgressRef.current = false;

    // Stop HCSR04 streaming and cleanup subscription
    if (hcsr04SubscriptionRef.current) {
      try {
        hcsr04SubscriptionRef.current.remove();
      } catch (err: any) {
        console.error('Error removing HCSR04 subscription:', err);
      }
      hcsr04SubscriptionRef.current = null;
    }

    // Cleanup alert subscription
    if (alertSubscriptionRef.current) {
      try {
        alertSubscriptionRef.current.remove();
      } catch (err: any) {
        console.error('Error removing alert subscription:', err);
      }
      alertSubscriptionRef.current = null;
    }

    // Cleanup diagnostics subscription
    if (diagnosticsMonitorRef.current) {
      try {
        diagnosticsMonitorRef.current.remove();
      } catch (err: any) {
        console.error('Error removing diagnostics subscription:', err);
      }
      diagnosticsMonitorRef.current = null;
    }

    // Write '0' to stop streaming if device is still connected
    if (connectedDeviceRef.current && isHcsr04Streaming) {
      try {
        const value = Buffer.from('0').toString('base64');
        await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
          WIFI_SERVICE_UUID,
          HCSR04_CTRL_CHARACTERISTIC_UUID,
          value
        );
      } catch (err: any) {
        console.error('Error stopping HCSR04 streaming:', err);
      }
    }

    if (connectedDeviceRef.current && managerRef.current) {
      try {
        await connectedDeviceRef.current.cancelConnection();
      } catch (err: any) {
        console.error('Disconnect error:', err);
      }
    }

    if (isMountedRef.current) {
      setIsConnected(false);
      setDeviceName(null);
      setDeviceId(null);
      setConnectedDevice(null);
      setHcsr04Distance(null);
      setIsHcsr04Streaming(false);
      setIsDiagnosing(false);
      setEngineTemperatures([]);
      setError(null);
    }
    connectedDeviceRef.current = null;
  };

  // Initialize BLE Manager
  useEffect(() => {
    isMountedRef.current = true;
    managerRef.current = new BleManager();

    const subscription = managerRef.current.onStateChange((state) => {
      if (!isMountedRef.current) return;

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
      isMountedRef.current = false;
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
      if (isMountedRef.current) {
        setError('BLE Manager not initialized');
      }
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      if (isMountedRef.current) {
        setError('Bluetooth permissions are required to scan for devices');
      }
      Alert.alert(
        'Permission Required',
        'Bluetooth permissions are required to scan for devices. Please grant permissions in app settings.',
      );
      return;
    }

    try {
      if (isMountedRef.current) {
        setError(null);
        setIsScanning(true);
        setScannedDevices([]);
      }

      const state = await managerRef.current.state();
      if (state !== State.PoweredOn) {
        if (isMountedRef.current) {
          setError('Bluetooth is not enabled. Please turn on Bluetooth.');
          setIsScanning(false);
        }
        return;
      }

      // Start scanning
      managerRef.current.startDeviceScan(null, null, (error, device) => {
        if (!isMountedRef.current) return;

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
        if (isMountedRef.current) {
          stopScan();
        }
      }, 10000);
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to start scanning');
        setIsScanning(false);
      }
    }
  };

  const stopScan = () => {
    if (managerRef.current) {
      managerRef.current.stopDeviceScan();
    }
    if (isMountedRef.current) {
      setIsScanning(false);
    }
  };

  const connectDevice = async (device: Device) => {
    if (!managerRef.current) {
      setError('BLE Manager not initialized');
      return;
    }

    try {
      if (isMountedRef.current) {
        setError(null);
      }
      stopScan();

      // Connect to device
      const connectedDevice = await device.connect();

      // Discover services and characteristics
      await connectedDevice.discoverAllServicesAndCharacteristics();

      if (isMountedRef.current) {
        setConnectedDevice(connectedDevice);
        setIsConnected(true);
        setDeviceName(device.name || 'Unknown Device');
        setDeviceId(device.id);
      }
      connectedDeviceRef.current = connectedDevice;

      // Monitor connection state - FIRST priority, mark device as disconnected BEFORE cleanup
      connectedDevice.onDisconnected(() => {
        console.log('Device disconnected detected');
        operationInProgressRef.current = false;
        connectedDeviceRef.current = null; // Mark as disconnected FIRST to prevent further ops

        // Cleanup HCSR04 subscription
        if (hcsr04SubscriptionRef.current) {
          try {
            hcsr04SubscriptionRef.current.remove();
          } catch (err) {
            console.error('Error removing HCSR04 subscription:', err);
          }
          hcsr04SubscriptionRef.current = null;
        }

        // Cleanup alert subscription
        if (alertSubscriptionRef.current) {
          try {
            alertSubscriptionRef.current.remove();
          } catch (err) {
            console.error('Error removing alert subscription:', err);
          }
          alertSubscriptionRef.current = null;
        }

        // Cleanup diagnostics subscription
        if (diagnosticsMonitorRef.current) {
          try {
            diagnosticsMonitorRef.current.remove();
          } catch (err) {
            console.error('Error removing diagnostics subscription:', err);
          }
          diagnosticsMonitorRef.current = null;
        }

        if (!isMountedRef.current) return;

        setIsConnected(false);
        setDeviceName(null);
        setDeviceId(null);
        setConnectedDevice(null);
        setHcsr04Distance(null);
        setIsHcsr04Streaming(false);
        setIsDiagnosing(false);
        setEngineTemperatures([]);
      });

      // Subscribe to alert notifications automatically when connected
      try {
        const alertSubscription = connectedDevice.monitorCharacteristicForService(
          WIFI_SERVICE_UUID,
          ALERT_CHARACTERISTIC_UUID,
          (error, char) => {
            if (!isMountedRef.current) return;

            if (error) {
              console.error('Alert notification error:', error);
              return;
            }

            if (char && char.value) {
              try {
                // Parse alert message from base64
                const buffer = Buffer.from(char.value, 'base64');
                const message = buffer.toString('utf8').trim();
                console.log('Alert received:', message);

                // Call the alert callback if set
                if (onAlertReceivedRef.current) {
                  onAlertReceivedRef.current(message);
                }
              } catch (parseErr) {
                console.warn('Failed to parse alert message:', parseErr);
              }
            }
          }
        );

        if (alertSubscription) {
          alertSubscriptionRef.current = alertSubscription;
          console.log('Alert notifications subscribed');
        }
      } catch (err: any) {
        console.error('Failed to subscribe to alert notifications:', err);
        // Don't throw - alerts are optional
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to connect to device');
        setIsConnected(false);
        setDeviceName(null);
        setDeviceId(null);
        setConnectedDevice(null);
      }
      connectedDeviceRef.current = null;
    }
  };

  const writeSsid = async (ssid: string) => {
    if (!connectedDeviceRef.current) {
      throw new Error('No connected device');
    }
    try {
      const base64Ssid = Buffer.from(ssid).toString('base64');
      if (!connectedDeviceRef.current) {
        throw new Error('Device disconnected before write');
      }
      await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        SSID_CHARACTERISTIC_UUID,
        base64Ssid
      );
      console.log('SSID written successfully');
    } catch (err: any) {
      console.error('Failed to write SSID:', err);
      if (isMountedRef.current) {
        setIsConnected(false);
      }
      connectedDeviceRef.current = null;
      throw new Error(`Failed to write SSID: ${err.message}`);
    }
  };

  const writePassword = async (password: string) => {
    if (!connectedDeviceRef.current) {
      throw new Error('No connected device');
    }
    try {
      const base64Password = Buffer.from(password).toString('base64');
      if (!connectedDeviceRef.current) {
        throw new Error('Device disconnected before write');
      }
      await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        PASSWORD_CHARACTERISTIC_UUID,
        base64Password
      );
      console.log('Password written successfully');
    } catch (err: any) {
      console.error('Failed to write password:', err);
      if (isMountedRef.current) {
        setIsConnected(false);
      }
      connectedDeviceRef.current = null;
      throw new Error(`Failed to write password: ${err.message}`);
    }
  };

  const triggerWifiSwitch = async () => {
    if (!connectedDeviceRef.current) {
      throw new Error('No connected device');
    }
    try {
      const value = Buffer.from('1').toString('base64');
      if (!connectedDeviceRef.current) {
        throw new Error('Device disconnected before write');
      }
      await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        WIFI_SWITCH_CHARACTERISTIC_UUID,
        value
      );
      console.log('WiFi switch triggered successfully');
    } catch (err: any) {
      console.error('Failed to trigger WiFi switch:', err);
      if (isMountedRef.current) {
        setIsConnected(false);
      }
      connectedDeviceRef.current = null;
      throw new Error(`Failed to trigger WiFi switch: ${err.message}`);
    }
  };

  const startHcsr04Streaming = async () => {
    if (!connectedDeviceRef.current) {
      throw new Error('No connected device');
    }
    try {
      // Clean up any previous subscription (defensive; prevents double-monitoring crashes)
      if (hcsr04SubscriptionRef.current) {
        try {
          hcsr04SubscriptionRef.current.remove();
        } catch (e) {
          console.warn('Error cleaning up previous subscription:', e);
        }
        hcsr04SubscriptionRef.current = null;
      }

      // Defensive: ensure services/characteristics are discovered (Android can be flaky if we do this only once)
      await connectedDeviceRef.current.discoverAllServicesAndCharacteristics();

      // Defensive: verify the DATA characteristic exists before trying to monitor (turns hard crashes into a handled error)
      const chars = await connectedDeviceRef.current.characteristicsForService(WIFI_SERVICE_UUID);
      const hasData = chars?.some((c) => (c.uuid || '').toLowerCase() === HCSR04_DATA_CHARACTERISTIC_UUID);
      const hasCtrl = chars?.some((c) => (c.uuid || '').toLowerCase() === HCSR04_CTRL_CHARACTERISTIC_UUID);
      if (!hasCtrl || !hasData) {
        throw new Error('HCSR04 characteristics not found. Is the ESP32 firmware exposing FF05/FF06 under service 00FF?');
      }

      // Write '1' to CTRL characteristic to start streaming
      const value = Buffer.from('1').toString('base64');
      await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        HCSR04_CTRL_CHARACTERISTIC_UUID,
        value
      );
      console.log('HCSR04 streaming started');

      // Monitor the DATA characteristic for notifications
      const characteristic = await connectedDeviceRef.current.monitorCharacteristicForService(
        WIFI_SERVICE_UUID,
        HCSR04_DATA_CHARACTERISTIC_UUID,
        (error, char) => {
          if (!isMountedRef.current) return;

          if (error) {
            console.error('HCSR04 notification error:', error);
            // Check if device disconnected
            if (error.message?.includes('disconnected') || error.message?.includes('Device was not connected')) {
              if (isMountedRef.current) {
                setIsConnected(false);
                setIsHcsr04Streaming(false);
              }
              connectedDeviceRef.current = null;
            }
            return;
          }

          if (char && char.value) {
            try {
              // Parse little-endian uint16 from base64
              const buffer = Buffer.from(char.value, 'base64');
              if (buffer.length >= 2) {
                // Little-endian: first byte is LSB, second byte is MSB
                const distance = buffer[0] | (buffer[1] << 8);
                setHcsr04Distance(distance);
                console.log('HCSR04 distance:', distance, 'cm');
              }
            } catch (parseErr) {
              console.warn('Failed to parse HCSR04 data:', parseErr);
            }
          }
        }
      );

      hcsr04SubscriptionRef.current = characteristic;
      if (isMountedRef.current) {
        setIsHcsr04Streaming(true);
      }
    } catch (err: any) {
      console.error('Failed to start HCSR04 streaming:', err);
      if (isMountedRef.current) {
        setIsHcsr04Streaming(false);
      }
      // Check if device disconnected
      if (err.message?.includes('disconnected') || err.message?.includes('Device was not connected')) {
        if (isMountedRef.current) {
          setIsConnected(false);
        }
        connectedDeviceRef.current = null;
        throw new Error('Device disconnected');
      }
      throw new Error(`Failed to start HCSR04 streaming: ${err.message}`);
    }
  };

  const stopHcsr04Streaming = async () => {
    try {
      // Cancel notification subscription
      if (hcsr04SubscriptionRef.current) {
        try {
          hcsr04SubscriptionRef.current.remove();
        } catch (e) {
          console.warn('Error removing subscription:', e);
        }
        hcsr04SubscriptionRef.current = null;
      }

      // Write '0' to CTRL characteristic to stop streaming
      if (connectedDeviceRef.current) {
        try {
          const value = Buffer.from('0').toString('base64');
          await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
            WIFI_SERVICE_UUID,
            HCSR04_CTRL_CHARACTERISTIC_UUID,
            value
          );
          console.log('HCSR04 streaming stopped');
        } catch (writeErr: any) {
          // Device disconnected - that's okay, we're stopping anyway
          if (writeErr.message?.includes('disconnected') || writeErr.message?.includes('Device was not connected')) {
            console.log('Device disconnected, skipping stop command');
          } else {
            console.warn('Error sending stop command:', writeErr);
          }
        }
      }

      setIsHcsr04Streaming(false);
      setHcsr04Distance(null);
    } catch (err: any) {
      console.error('Failed to stop HCSR04 streaming:', err);
      if (isMountedRef.current) {
        setIsHcsr04Streaming(false);
      }
      throw new Error(`Failed to stop HCSR04 streaming: ${err.message}`);
    }
  };

 const startEngineDiagnostics = async () => {
   if (!connectedDeviceRef.current) throw new Error('No device connected');

   try {
     if (isMountedRef.current) {
       setError(null);
       setEngineTemperatures([]);
     }

     // Ensure services are discovered
     try {
       await connectedDeviceRef.current.discoverAllServicesAndCharacteristics();
     } catch (discoverErr) {
       console.error('Failed to discover services:', discoverErr);
       if (isMountedRef.current) {
         setIsConnected(false);
       }
       connectedDeviceRef.current = null;
       throw new Error('Device disconnected during discovery');
     }

     // Remove previous subscription if exists
     if (diagnosticsMonitorRef.current) {
       try { diagnosticsMonitorRef.current.remove(); } catch {}
       diagnosticsMonitorRef.current = null;
     }

     // Start diagnostics by writing '1'
     try {
       await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
         WIFI_SERVICE_UUID,
         ENGINE_DIAGNOSTICS_CTRL_UUID,
         Buffer.from('1').toString('base64')
       );
     } catch (writeErr: any) {
       console.error('Failed to write diagnostics control:', writeErr);
       if (isMountedRef.current) {
         setIsConnected(false);
       }
       connectedDeviceRef.current = null;
       throw new Error('Device disconnected during write');
     }

     // Subscribe to data notifications
    try {
      diagnosticsMonitorRef.current =
        connectedDeviceRef.current.monitorCharacteristicForService(
          WIFI_SERVICE_UUID,
          ENGINE_DIAGNOSTICS_DATA_UUID,
          (err, char) => {
            if (!isMountedRef.current) return;

            try {
              if (err) {
                console.error('Diagnostics error:', err);
                if (isMountedRef.current) {
                  setIsConnected(false);
                  setIsDiagnosing(false);
                }
                connectedDeviceRef.current = null;
                return;
              }

              if (char?.value) {
                try {
                  const buffer = Buffer.from(char.value, 'base64');
                  if (buffer.length >= 4) {
                    let temp: number;
                    try {
                      temp = buffer.readFloatLE(0);
                      if (isNaN(temp) || !isFinite(temp)) {
                        console.warn('Invalid temperature value, ignoring:', temp);
                        return;
                      }
                    } catch (parseErr) {
                      console.warn('Failed to parse temperature, ignoring:', parseErr);
                      return;
                    }

                    if (isMountedRef.current) {
                      setEngineTemperatures(prev => [...prev, temp].slice(-50));
                    }
                  }
                } catch (bufErr) {
                  console.warn('Buffer error:', bufErr);
                }
              }
            } catch (outerErr) {
              console.error('Unexpected error in diagnostics handler:', outerErr);
            }
          }
        );
    } catch (monitorErr: any) {
      console.error('Failed to monitor diagnostics:', monitorErr);
      if (isMountedRef.current) {
        setIsConnected(false);
        setIsDiagnosing(false);
      }
      connectedDeviceRef.current = null;
      throw new Error(`Failed to monitor diagnostics: ${monitorErr.message}`);
    }

     if (isMountedRef.current) {
       setIsDiagnosing(true);
     }
     console.log('Engine diagnostics started');
   } catch (err: any) {
     if (isMountedRef.current) {
       setIsDiagnosing(false);
     }
     console.error('Failed to start engine diagnostics:', err);
     throw err;
   }
 };

 const stopEngineDiagnostics = async () => {
   if (!connectedDeviceRef.current) return;

   try {
     if (diagnosticsMonitorRef.current) {
       try { diagnosticsMonitorRef.current.remove(); } catch {}
       diagnosticsMonitorRef.current = null;
     }

     await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
       WIFI_SERVICE_UUID,
       ENGINE_DIAGNOSTICS_CTRL_UUID,
       Buffer.from('0').toString('base64')
     );

     if (isMountedRef.current) {
       setIsDiagnosing(false);
       setEngineTemperatures([]);
     }
     console.log('Engine diagnostics stopped');
   } catch (err: any) {
     if (isMountedRef.current) {
       setIsDiagnosing(false);
     }
     console.error('Failed to stop engine diagnostics:', err);
     throw new Error(`Failed to stop diagnostics: ${err.message}`);
   }
 };


  const setAlertCallback = (callback: (message: string) => void) => {
    onAlertReceivedRef.current = callback;
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
        writeSsid,
        writePassword,
        triggerWifiSwitch,
        hcsr04Distance,
        isHcsr04Streaming,
        startHcsr04Streaming,
        stopHcsr04Streaming,
        setAlertCallback,
        isDiagnosing,
        engineTemperatures,
        startEngineDiagnostics,
        stopEngineDiagnostics,
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
