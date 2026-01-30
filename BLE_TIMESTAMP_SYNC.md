# BLE Timestamp Synchronization - Implementation

## ✅ Implementation Complete

The BLE timestamp synchronization has been successfully integrated into the React Native application.

## What Was Changed

### 1. Added Timestamp Characteristic UUID
- **File**: `contexts/BleContext.tsx`
- **UUID**: `0x0000FF0A` (Full: `0000ff0a-0000-1000-8000-00805f9b34fb`)
- **Location**: Added to UUID constants at the top of the file

### 2. Created `syncTimestamp()` Function
The function:
- Gets current Unix timestamp: `Math.floor(Date.now() / 1000)`
- Creates 4-byte buffer with uint32_t (little-endian format)
- Writes timestamp to characteristic 0xFF0A
- Includes error handling with fallback notification

### 3. Integrated into Connection Flow
- **Timing**: Immediately after `discoverAllServicesAndCharacteristics()`
- **Sequence**:
  1. Connect to device
  2. Discover services/characteristics
  3. **→ Sync timestamp** ← NEW
  4. Set connected state
  5. Subscribe to alert notifications

## How It Works

```typescript
// Step 1: Get Unix timestamp
const timestamp = Math.floor(Date.now() / 1000);

// Step 2: Create 4-byte buffer (little-endian)
const buffer = Buffer.alloc(4);
buffer.writeUInt32LE(timestamp, 0);

// Step 3: Send to ESP32 via characteristic 0xFF0A
await device.writeCharacteristicWithoutResponseForService(
  WIFI_SERVICE_UUID,           // 0x00FF
  TIMESTAMP_CHARACTERISTIC_UUID, // 0xFF0A
  buffer.toString('base64')
);
```

## ESP32 Expected Behavior

After receiving the timestamp, ESP32 should:
1. Receive 4 bytes (little-endian uint32_t)
2. Call `sntp_client_set_timestamp(timestamp)`
3. Log: `I (timestamp) SNTP_CLIENT: Timestamp synced via BLE: 1706558400`
4. All measurements from this point forward will have correct timestamps

## Fallback Mechanism

If timestamp sync fails (connection lost, characteristic not available):
- Function logs warning but doesn't throw
- ESP32 will use fallback: `BUILD_TIMESTAMP + uptime`
- Device continues to operate normally with relative timestamps

## Testing

### 1. Check Console Logs
After connecting to device, you should see:
```
Timestamp synced via BLE: 1738281234
Timestamp bytes (little-endian): [210, 123, 169, 103]
```

### 2. Check ESP32 Serial Monitor
```
I (12345) SNTP_CLIENT: Timestamp synced via BLE: 1738281234
```

### 3. Verify Measurements
All measurements collected after connection should have correct timestamps matching phone's time.

## Troubleshooting

### Timestamp Not Syncing
1. Check if characteristic 0xFF0A exists on ESP32
2. Verify WRITE permission is enabled on 0xFF0A
3. Check ESP32 serial logs for errors
4. Ensure ESP32 firmware handles the characteristic

### Wrong Timestamp on ESP32
1. Verify little-endian format is used
2. Check buffer has exactly 4 bytes
3. Verify Unix timestamp (seconds, not milliseconds)

### Connection Issues
1. Ensure Bluetooth permissions are granted
2. Check if device is in range
3. Verify device is advertising service 0x00FF

## Technical Specifications

- **Service UUID**: `0x00FF` (Full: `000000ff-0000-1000-8000-00805f9b34fb`)
- **Characteristic UUID**: `0xFF0A` (Full: `0000ff0a-0000-1000-8000-00805f9b34fb`)
- **Data Format**: uint32_t (4 bytes, little-endian)
- **Content**: Unix timestamp (seconds since 1970-01-01 00:00:00 UTC)
- **Write Type**: Write without response
- **Timing**: Immediately after device discovery

## Example Timestamp Data

For timestamp `1738281234` (2026-01-30 12:00:34 UTC):

**Decimal**: `1738281234`
**Hex**: `0x67A97BD2`
**Little-Endian Bytes**: `[0xD2, 0x7B, 0xA9, 0x67]`
**Decimal Bytes**: `[210, 123, 169, 103]`

## Code Location

All changes are in: `contexts/BleContext.tsx`
- Line ~7-16: UUID constants
- Line ~305-335: `syncTimestamp()` function
- Line ~348: Function call in connection flow

## Next Steps

1. ✅ Timestamp sync is implemented
2. Test with ESP32 device
3. Verify logs on both sides
4. Confirm measurements have correct timestamps
5. Monitor for any sync failures in production

---

**Status**: ✅ Ready for Testing
**Version**: 1.0
**Date**: 2026-01-30
