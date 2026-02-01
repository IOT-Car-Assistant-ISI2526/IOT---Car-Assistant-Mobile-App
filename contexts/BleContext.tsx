import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { BleManager, Device, State, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Buffer } from 'buffer';
import { useAuth } from './AuthContext';


const WIFI_SERVICE_UUID = '000000ff-0000-1000-8000-00805f9b34fb';
const SSID_CHARACTERISTIC_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';
const PASSWORD_CHARACTERISTIC_UUID = '0000ff03-0000-1000-8000-00805f9b34fb';
const WIFI_SWITCH_CHARACTERISTIC_UUID = '0000ff04-0000-1000-8000-00805f9b34fb';
const HCSR04_CTRL_CHARACTERISTIC_UUID = '0000ff05-0000-1000-8000-00805f9b34fb';
const HCSR04_DATA_CHARACTERISTIC_UUID = '0000ff06-0000-1000-8000-00805f9b34fb';
const ALERT_CHARACTERISTIC_UUID = '0000ff07-0000-1000-8000-00805f9b34fb';
const ENGINE_DIAGNOSTICS_CTRL_UUID = '0000ff08-0000-1000-8000-00805f9b34fb';
const ENGINE_DIAGNOSTICS_DATA_UUID = '0000ff09-0000-1000-8000-00805f9b34fb';
const TIMESTAMP_CHARACTERISTIC_UUID = '0000ff0a-0000-1000-8000-00805f9b34fb';
const METADATA_CHARACTERISTIC_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';
const ALERT_MONITOR_TRANSACTION_ID = 'alert-monitor';
const HCSR04_MONITOR_TRANSACTION_ID = 'hcsr04-monitor';
const DIAGNOSTICS_MONITOR_TRANSACTION_ID = 'diagnostics-monitor';

interface BleContextType {
  isConnected: boolean;
  deviceName: string | null;
  deviceId: string | null;
  isScanning: boolean;
  scannedDevices: Device[];
  error: string | null;
  scanForDevices: () => Promise<void>;
  stopScan: () => void;
  startAlertMonitoring: () => Promise<void>;
  connectDevice: (device: Device) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  connectedDevice: Device | null;
  writeSsid: (ssid: string) => Promise<void>;
  writePassword: (password: string) => Promise<void>;
  triggerWifiSwitch: () => Promise<void>;
  hcsr04Distance: number | null;
  isHcsr04Streaming: boolean;
  startHcsr04Streaming: () => Promise<void>;
  stopHcsr04Streaming: () => Promise<void>;
  setAlertCallback: (callback: (message: string) => void) => void;
  isDiagnosing: boolean;
  engineTemperatures: number[];
  startEngineDiagnostics: () => Promise<void>;
  stopEngineDiagnostics: () => Promise<void>;

  bmp280Temperature: number | null;
  veml770Illuminance: number | null;
  lastEngineAlertTemp: number | null;
}

const BleContext = createContext<BleContextType | undefined>(undefined);

export function BleProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
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
  const [bmp280Temperature, setBmp280Temperature] = useState<number | null>(null);
  const [veml770Illuminance, setVeml770Illuminance] = useState<number | null>(null);
  const [lastEngineAlertTemp, setLastEngineAlertTemp] = useState<number | null>(null);

  const disconnectDevice = async () => {
    operationInProgressRef.current = false;

    console.log('isHcsr04Streaming:', isHcsr04Streaming);
    console.log('connectedDeviceRef.current:', connectedDeviceRef.current);
    console.log('managerRef.current:', managerRef.current);

    // Don't call remove() on subscriptions - causes native crash
    // Just clear refs and let native cleanup happen automatically
    hcsr04SubscriptionRef.current = null;
    alertSubscriptionRef.current = null;
    diagnosticsMonitorRef.current = null;

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
      
      // Don't call remove() or destroy() - they cause native crashes
      // Native BLE library handles cleanup automatically
      // Just clear refs to prevent JavaScript from trying to use them
      alertSubscriptionRef.current = null;
      hcsr04SubscriptionRef.current = null;
      diagnosticsMonitorRef.current = null;
      subscriptionRef.current = null;
      connectedDeviceRef.current = null;
      managerRef.current = null;
      
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
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
    return true;
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
            const exists = prevDevices.some((d) => d.id === device.id);
            if (!exists && device.name) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });

      setTimeout(() => {
        stopScan();
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

  const startAlertMonitoring = async () => {
    if (!connectedDeviceRef.current) {
      console.warn('Cannot start alert monitoring: no device connected');
      return;
    }

    try {
      const alertSubscription = connectedDeviceRef.current.monitorCharacteristicForService(
        WIFI_SERVICE_UUID,
        ALERT_CHARACTERISTIC_UUID,
        (error, char) => {
          if (!isMountedRef.current) {
            return;
          }

          if (error) {
            console.error('Alert notification error:', error);
            return;
          }

          if (char && char.value) {
            try {
              const buffer = Buffer.from(char.value, 'base64');
              const message = buffer.toString('utf8').trim();
              console.log('Alert received:', message);

              let modifiedMessage = message;
              if (message.startsWith('VEML7700')) {
                modifiedMessage = 'Visibility is low. If road is clear, high beam headlights are recommended.';
                const valueMatch = message.match(/VEML7700:\s*(\d+\.\d)/);
                if (valueMatch) {
                  setVeml770Illuminance(parseFloat(valueMatch[1]));
                }
              } else if (message.startsWith('BMP280')) {
                modifiedMessage = 'Risk of ice. Drive carefully.';
                const valueMatch = message.match(/BMP280:\s*(-?\d+\.\d)/);
                if (valueMatch) {
                  setBmp280Temperature(parseFloat(valueMatch[1]));
                }
              } else if (message.startsWith('MAX6675')) {
                const valueMatch = message.match(/MAX6675:\s*(\d+\.\d)/);
                if (valueMatch) {
                  const temp = parseFloat(valueMatch[1]);
                  setLastEngineAlertTemp(temp);
                  if (temp > 60) {
                    modifiedMessage = 'Engine overheating';
                  } else {
                      modifiedMessage = '--';
                  }
                }
              } else if (message.startsWith('MAC:')) {
                const macMatch = message.match(/MAC:\s*([A-Fa-f0-9]{12})/);
                if (macMatch) {
                  const macAddress = macMatch[1];
                  console.log('MAC address received:', macAddress);

                  fetch('http://10.240.166.41:5000/api/devices/claim', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: token ? `Bearer ${token}` : '',
                    },
                    body: JSON.stringify({mac_address: macAddress }),
                  })
                    .then((response) => {
                      if (!response.ok) {
                        throw new Error('Failed to send MAC address');
                      }
                      console.log('MAC address sent successfully');
                    })
                    .catch((error) => {
                      console.error('Error sending MAC address:', error);
                    });

                  console.log('MAC address sent to server');
                }
              }

                if (onAlertReceivedRef.current && modifiedMessage !== '--') {
                try {
                  onAlertReceivedRef.current(modifiedMessage);
                } catch (callbackErr) {
                    console.error('Alert callback error:', callbackErr);
                }
              }
            } catch (parseErr) {
              console.warn('Failed to parse alert message:', parseErr);
            }
          }
        },
        ALERT_MONITOR_TRANSACTION_ID
      );

      if (alertSubscription) {
        alertSubscriptionRef.current = alertSubscription;
      } else {
        console.log('Alert subscription is null');
      }
    } catch (err: any) {
      console.error('Failed to subscribe to alert notifications:', err);
    }
  };


  const syncTimestamp = async (device: Device) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);

      const buffer = Buffer.alloc(4);
      buffer.writeUInt32LE(timestamp, 0);

      const base64Data = buffer.toString('base64');

      await device.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        TIMESTAMP_CHARACTERISTIC_UUID,
        base64Data
      );
      
      console.log('Timestamp synced via BLE:', timestamp);
      console.log('Timestamp bytes (little-endian):', Array.from(buffer));
    } catch (err: any) {
      console.error('Failed to sync timestamp:', err);
      console.warn('Device will use fallback timestamp (BUILD_TIMESTAMP + uptime)');
    }
  };


  const sendMetadata = async (device: Device, note?: string) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);

      const noteBuffer = note ? Buffer.from(note, 'utf8') : Buffer.alloc(0);
      const totalSize = 4 + noteBuffer.length;
      const buffer = Buffer.alloc(totalSize);

      buffer.writeUInt32LE(timestamp, 0);

      if (note) {
        noteBuffer.copy(buffer, 4);
      }

      const base64Data = buffer.toString('base64');

      await device.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        METADATA_CHARACTERISTIC_UUID,
        base64Data
      );

      console.log('Metadata sent via BLE - Timestamp:', timestamp, note ? `Note: "${note}"` : '(no note)');
      console.log('Metadata bytes (timestamp + note):', Array.from(buffer));
    } catch (err: any) {
      console.error('Failed to send metadata:', err);
      console.warn('Device will use fallback timestamp (BUILD_TIMESTAMP + uptime)');
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

      const connectedDevice = await device.connect();

      await connectedDevice.discoverAllServicesAndCharacteristics();

      await sendMetadata(connectedDevice, 'Connected from app');

      if (isMountedRef.current) {
        setConnectedDevice(connectedDevice);
        setIsConnected(true);
        setDeviceName(device.name || 'Unknown Device');
        setDeviceId(device.id);
      }
      connectedDeviceRef.current = connectedDevice;

      connectedDevice.onDisconnected(() => {
        operationInProgressRef.current = false;
        connectedDeviceRef.current = null;

        // Stop alert monitoring - just clear refs, don't call .remove()
        if (alertSubscriptionRef.current) {
          alertSubscriptionRef.current = null;
        }

        // Clear other subscription refs
        if (hcsr04SubscriptionRef.current) {
          hcsr04SubscriptionRef.current = null;
        }

        if (diagnosticsMonitorRef.current) {
          diagnosticsMonitorRef.current = null;
        }

        // Defer state updates to allow native disconnect to complete first
        setTimeout(() => {
          if (!isMountedRef.current) {
            return;
          }
          try {
            setIsConnected(false);
            setDeviceName(null);
            setDeviceId(null);
            setConnectedDevice(null);
            setHcsr04Distance(null);
            setIsHcsr04Streaming(false);
            setIsDiagnosing(false);
            setEngineTemperatures([]);
          } catch (err) {
            console.error('Error resetting state after disconnection:', err);
          }
        }, 0);
      });

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
      console.warn('Attempted to write SSID, but no device is connected.');
      return;
    }
    try {
      const base64Ssid = Buffer.from(ssid).toString('base64');
      await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        SSID_CHARACTERISTIC_UUID,
        base64Ssid
      );
      console.log('SSID written successfully');
    } catch (err: any) {
      console.error('Failed to write SSID:', err);
      if (err.message?.includes('disconnected')) {
        console.warn('Device disconnected during SSID write.');
      }
    }
  };

  const writePassword = async (password: string) => {
    if (!connectedDeviceRef.current) {
      console.warn('Attempted to write password, but no device is connected.');
      return;
    }
    try {
      const base64Password = Buffer.from(password).toString('base64');
      await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        PASSWORD_CHARACTERISTIC_UUID,
        base64Password
      );
      console.log('Password written successfully');
    } catch (err: any) {
      console.error('Failed to write password:', err);
      if (err.message?.includes('disconnected')) {
        console.warn('Device disconnected during password write.');
      }
    }
  };

  const triggerWifiSwitch = async () => {
    if (!connectedDeviceRef.current) {
      console.warn('Attempted to trigger WiFi switch, but no device is connected.');
      return;
    }
    try {
      const value = Buffer.from('1').toString('base64');
      await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        WIFI_SWITCH_CHARACTERISTIC_UUID,
        value
      );
      console.log('WiFi switch triggered successfully');
    } catch (err: any) {
      console.error('Failed to trigger WiFi switch:', err);
      if (err.message?.includes('disconnected')) {
        console.warn('Device disconnected during WiFi switch trigger.');
      }
    }
  };

  const startHcsr04Streaming = async () => {
    if (!connectedDeviceRef.current) {
      console.warn('Attempted to start HCSR04 streaming, but no device is connected.');
      return;
    }
    try {
      // Don't call remove() - just clear ref
      if (hcsr04SubscriptionRef.current) {
        hcsr04SubscriptionRef.current = null;
      }

      await connectedDeviceRef.current.discoverAllServicesAndCharacteristics();

      const chars = await connectedDeviceRef.current.characteristicsForService(WIFI_SERVICE_UUID);
      const hasData = chars?.some((c) => (c.uuid || '').toLowerCase() === HCSR04_DATA_CHARACTERISTIC_UUID);
      const hasCtrl = chars?.some((c) => (c.uuid || '').toLowerCase() === HCSR04_CTRL_CHARACTERISTIC_UUID);
      if (!hasCtrl || !hasData) {
        console.warn('HCSR04 characteristics not found.');
        return;
      }

      const value = Buffer.from('1').toString('base64');
      await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(
        WIFI_SERVICE_UUID,
        HCSR04_CTRL_CHARACTERISTIC_UUID,
        value
      );
      console.log('HCSR04 streaming started');

      const characteristic = await connectedDeviceRef.current.monitorCharacteristicForService(
        WIFI_SERVICE_UUID,
        HCSR04_DATA_CHARACTERISTIC_UUID,
        (error, char) => {
          if (!isMountedRef.current) return;

          if (error) {
            console.error('HCSR04 notification error:', error);
            if (error.message?.includes('disconnected')) {
              console.warn('Device disconnected during HCSR04 streaming.');
              setIsConnected(false);
              setIsHcsr04Streaming(false);
              connectedDeviceRef.current = null;
            }
            return;
          }

          if (char && char.value) {
            try {
              console.log('Raw data received from ESP32:', char.value);

              const buffer = Buffer.from(char.value, 'base64');
              if (buffer.length >= 2) {
                const distance = buffer[0] | (buffer[1] << 8);

                if (distance < 0 || distance > 10000) {
                  console.warn('Invalid distance value received:', distance);
                  return;
                }

                setHcsr04Distance(distance);
                console.log('HCSR04 distance:', distance, 'cm');
              } else {
                console.warn('Received data is too short to parse:', buffer);
              }
            } catch (parseErr) {
              console.error('Failed to parse HCSR04 data:', parseErr);
            }
          } else {
            console.warn('Received empty or invalid characteristic data.');
          }
        },
        HCSR04_MONITOR_TRANSACTION_ID
      );

      hcsr04SubscriptionRef.current = characteristic;
      setIsHcsr04Streaming(true);
    } catch (err: any) {
      console.error('Failed to start HCSR04 streaming:', err);
      if (err.message?.includes('disconnected')) {
        console.warn('Device disconnected during HCSR04 streaming setup.');
        setIsConnected(false);
        connectedDeviceRef.current = null;
      }
    }
  };

  const stopHcsr04Streaming = async () => {
    try {
      // Don't call remove() - just clear ref
      hcsr04SubscriptionRef.current = null;


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

     // Don't call remove() - just clear ref
     if (diagnosticsMonitorRef.current) {
       diagnosticsMonitorRef.current = null;
     }


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
          },
          DIAGNOSTICS_MONITOR_TRANSACTION_ID
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
     // Don't call remove() - just clear ref
     if (diagnosticsMonitorRef.current) {
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
        startAlertMonitoring,
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
        bmp280Temperature,
        veml770Illuminance,
        lastEngineAlertTemp,
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
