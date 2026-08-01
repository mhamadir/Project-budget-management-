import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      if (value instanceof Function) {
        setStoredValue(prev => {
          const next = value(prev);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(next));
          }
          return next;
        });
      } else {
        setStoredValue(value);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

export function formatCurrency(amountUSD: number, currency: 'USD' | 'IQD', exchangeRate: number) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountUSD);
  } else {
    const amountIQD = (amountUSD / 100) * exchangeRate;
    return new Intl.NumberFormat('en-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amountIQD);
  }
}
