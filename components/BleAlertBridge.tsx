import { useEffect } from 'react';
import { useBle } from '@/contexts/BleContext';
import { useAlert } from '@/contexts/AlertContext';


export function BleAlertBridge() {
  const { setAlertCallback } = useBle();
  const { showAlert } = useAlert();

  useEffect(() => {

    setAlertCallback(showAlert);

    return () => {
      setAlertCallback(() => {});
    };
  }, [setAlertCallback, showAlert]);

  return null;
}

