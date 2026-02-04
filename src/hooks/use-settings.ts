'use client';

import { useLocalStorage } from './use-local-storage';

export const DEFAULT_SETTINGS = {
  apiKeys: [] as string[],
  model: 'googleai/gemini-2.5-flash',
  useAutoMetadata: false,
  titleLength: 15,
  descriptionLength: 100,
  keywordCount: 25,
};

export type AppSettings = typeof DEFAULT_SETTINGS;

export function useSettings() {
  return useLocalStorage<AppSettings>('image_meta_pro_settings', DEFAULT_SETTINGS);
}
