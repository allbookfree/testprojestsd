'use client';

import { useLocalStorage } from './use-local-storage';

export interface ApiKey {
  id: string;
  key: string;
  note: string;
}

export const DEFAULT_SETTINGS = {
  apiKeys: [] as ApiKey[],
  model: 'googleai/gemini-2.5-flash',
  useAutoMetadata: true,
  titleLength: 15,
  descriptionLength: 100,
  keywordCount: 40,
};

export type AppSettings = typeof DEFAULT_SETTINGS;

export function useSettings() {
  // v2 uses a new data structure for API keys with notes.
  return useLocalStorage<AppSettings>('image_meta_pro_settings_v2', DEFAULT_SETTINGS);
}
