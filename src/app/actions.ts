'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateImageMetadata, GenerateImageMetadataOutput } from '@/ai/flows/generate-image-metadata';
import { generateImagePrompt, GenerateImagePromptInput, GenerateImagePromptOutput } from '@/ai/flows/generate-image-prompt';
import type { AppSettings, ApiKey } from '@/hooks/use-settings';
import type { ApiKeyTestResult } from '@/app/types';

// This function already uses the new async flow, so no changes are needed.
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

// This function also uses the new async flow, so no changes are needed.
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

// Rewritten testApiKey function using the official Google AI SDK
export async function testApiKey(apiKey: string): Promise<ApiKeyTestResult> {
  if (!apiKey) {
    return { success: false, status: 'invalid', error: 'API key is empty.' };
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Note: It seems maxRetries is not directly supported in the same way. Error handling will catch retriable issues.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Perform a simple, low-token generation to test the key
    await model.generateContent('test');

    return { success: true, status: 'valid' };
  } catch (e: any) {
    let errorMessage = 'An unknown error occurred.';
    let status: 'invalid' | 'rate-limited' = 'invalid';

    // Improved error message parsing for Google AI SDK
    if (e.message) {
        const lowerCaseMessage = e.message.toLowerCase();
        if (lowerCaseMessage.includes('api key not valid') || lowerCaseMessage.includes('permission denied')) {
            errorMessage = 'The provided API key is not valid. Please check the key and try again.';
            status = 'invalid';
        } else if (lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('resource has been exhausted')) {
            status = 'rate-limited';
            errorMessage = 'The key is valid but has run out of its free quota or hit a rate limit.';
        } else {
            errorMessage = e.message;
        }
    }
    return { success: false, status, error: errorMessage };
  }
}
