'use client';

import { useState, useEffect } from 'react';

function getValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const saved = window.localStorage.getItem(key);
  if (saved !== null) {
    try {
        return JSON.parse(saved);
    } catch (e) {
        console.error("Failed to parse localStorage value", e);
        return defaultValue;
    }
  }
  return defaultValue;
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => getValue(key, defaultValue));

  useEffect(() => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch(e) {
        console.error("Failed to set localStorage value", e);
    }
  }, [key, value]);

  return [value, setValue];
}
