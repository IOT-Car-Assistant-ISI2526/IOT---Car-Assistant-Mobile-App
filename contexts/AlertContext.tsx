import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AlertContextType {
  showAlert: (message: string) => void;
  currentAlert: string | null;
  dismissAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [currentAlert, setCurrentAlert] = useState<string | null>(null);

  const showAlert = (message: string) => {
    if (typeof message !== 'string' || message.trim().length === 0) {
      return;
    }
    setCurrentAlert(message);
  };

  const dismissAlert = () => {
    setCurrentAlert(null);
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        currentAlert,
        dismissAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

