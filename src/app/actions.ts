'use server';

import { generate } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

import { generateImageMetadata, GenerateImageMetadataOutput } from '@/ai/flows/generate-image-metadata';
import { generateImagePrompt, GenerateImagePromptInput, GenerateImagePromptOutput } from '@/ai/flows/generate-image-prompt';
import type { AppSettings, ApiKey } from '@/hooks/use-settings';
import type { ApiKeyTestResult } from '@/app/types';

export async function runGenerateImageMetadata(
  imageUri: string,
  settings: AppSettings
): Promise<GenerateImageMetadataOutput | { error: string }> {
  try {
    if (!imageUri) {
      return { error: 'Image data is missing.' };
    }
    const apiKeys = settings.apiKeys.map((k: ApiKey) => k.key);
    return await generateImageMetadata({
      imageUri,
      apiKeys: apiKeys,
      model: settings.model,
      useAutoMetadata: settings.useAutoMetadata,
      titleLength: settings.titleLength,
      descriptionLength: settings.descriptionLength,
      keywordCount: settings.keywordCount,
      creativityLevel: settings.creativityLevel,
    });
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: errorMessage };
  }
}

type GenerateImagePromptOptions = {
  imageStyle: 'photorealistic' | 'vector';
  generateNegativePrompts: boolean;
};

export async function runGenerateImagePrompt(
  idea: string,
  count: number,
  settings: AppSettings,
  options: GenerateImagePromptOptions
): Promise<GenerateImagePromptOutput | { error: string }> {
  try {
    if (!idea) return { error: 'Idea is missing.' };
    if (count <= 0) return { error: 'Number of prompts must be greater than zero.' };

    const apiKeys = settings.apiKeys.map((k: ApiKey) => k.key);
    const input: GenerateImagePromptInput = {
      idea,
      count,
      apiKeys,
      model: settings.model,
      imageStyle: options.imageStyle,
      generateNegativePrompts: options.generateNegativePrompts,
    };

    return await generateImagePrompt(input);
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate prompt: ${errorMessage}` };
  }
}

export async function testApiKey(apiKey: string): Promise<ApiKeyTestResult> {
  if (!apiKey) {
    return { success: false, status: 'invalid', error: 'API key is empty.' };
  }
  try {
    // Create a temporary plugin instance with the key to test.
    // This does NOT interfere with the global Genkit configuration.
    const testPlugin = googleAI({ apiKey, maxRetries: 0 });

    // Use the model from the temporary plugin for the test generation.
    await generate({
      model: testPlugin.model('gemini-1.5-flash'),
      prompt: 'test',
      config: { maxOutputTokens: 1 },
    });

    return { success: true, status: 'valid' };
  } catch (e: any) {
    let errorMessage = 'An unknown error occurred.';
    let status: 'invalid' | 'rate-limited' = 'invalid';
    if (e.message) {
      const lowerCaseMessage = e.message.toLowerCase();
      if (lowerCaseMessage.includes('api key not valid')) {
        errorMessage = 'The provided API key is not valid. Please check the key and try again.';
        status = 'invalid';
      } else if (lowerCaseMessage.includes('rate limit') || lowerCaseMessage.includes('quota')) {
        status = 'rate-limited';
        errorMessage = 'The key is valid but has run out of its free quota.';
      } else {
        errorMessage = e.message;
      }
    }
    return { success: false, status, error: errorMessage };
  }
}
