'use client';

import { useLocalStorage } from './use-local-storage';

export interface ApiKey {
  id: string;
  key: string;
  note: string;
}

export type CreativityLevel = 'Conservative' | 'Balanced' | 'Creative';

export const DEFAULT_SETTINGS = {
  apiKeys: [] as ApiKey[],
  model: 'googleai/gemini-2.5-flash',
  useAutoMetadata: true,
  titleLength: 15,
  descriptionLength: 100,
  keywordCount: 40,
  creativityLevel: 'Balanced' as CreativityLevel,
};

export type AppSettings = typeof DEFAULT_SETTINGS;

export function useSettings() {
  // v2 uses a new data structure for API keys with notes.
  return useLocalStorage<AppSettings>('image_meta_pro_settings_v2', DEFAULT_SETTINGS);
}
