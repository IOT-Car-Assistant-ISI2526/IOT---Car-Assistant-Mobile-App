import { useEffect } from 'react';
import { useBle } from '@/contexts/BleContext';
import { useAlert } from '@/contexts/AlertContext';

/**
 * Bridge component that connects BLE alert notifications to the AlertContext.
 * This should be rendered once at the root level.
 */
export function BleAlertBridge() {
  const { setAlertCallback } = useBle();
  const { showAlert } = useAlert();

  useEffect(() => {
    // Register the callback so BLE alerts trigger the alert popup
    setAlertCallback(showAlert);

    // Cleanup on unmount
    return () => {
      setAlertCallback(() => {});
    };
  }, [setAlertCallback, showAlert]);

  return null;
}

