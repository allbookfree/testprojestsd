'use server';

import { generateImageMetadata, GenerateImageMetadataOutput } from "@/ai/flows/generate-image-metadata";
import { generateImagePrompt, GenerateImagePromptOutput } from "@/ai/flows/generate-image-prompt";
import { AppSettings } from "@/hooks/use-settings";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

export async function runGenerateImageMetadata(
    imageUri: string,
    settings: AppSettings
): Promise<GenerateImageMetadataOutput | { error: string }> {
  try {
    if (!imageUri) {
      return { error: 'Image data is missing.' };
    }
    // Pass settings to the flow
    const metadata = await generateImageMetadata({ 
        imageUri, 
        apiKeys: settings.apiKeys,
        model: settings.model,
        useAutoMetadata: settings.useAutoMetadata,
        titleLength: settings.titleLength,
        descriptionLength: settings.descriptionLength,
        keywordCount: settings.keywordCount
    });
    return metadata;
  } catch (e) {
    console.error(e);
    let errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    // Simplify common errors for the user
    if (errorMessage.toLowerCase().includes('all api keys failed')) {
        if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
            errorMessage = 'All available API keys have exceeded their usage quota. Please add a new key in settings or wait for the quota to reset.';
        } else if (errorMessage.toLowerCase().includes('api key not valid')) {
            errorMessage = 'None of the provided API keys are valid. Please add a valid key in settings.';
        } else {
            errorMessage = 'Processing failed after trying all API keys. Please check your keys and network connection.';
        }
    } else if (errorMessage.toLowerCase().includes('no google ai api key provided')) {
        errorMessage = 'No API key found. Please add a Google AI API key in the settings panel.';
    }

    return { error: errorMessage };
  }
}

export async function runGenerateImagePrompt(
    idea: string,
    count: number,
    systemPrompt: string,
    settings: AppSettings
): Promise<GenerateImagePromptOutput | { error: string }> {
  try {
    if (!idea) {
      return { error: 'Idea is missing.' };
    }
    if (count <= 0) {
        return { error: 'Number of prompts must be greater than zero.' };
    }

    const result = await generateImagePrompt({ 
        idea, 
        count, 
        systemPrompt: systemPrompt,
        apiKeys: settings.apiKeys,
        model: settings.model
    });
    return result;
  } catch (e) {
    console.error(e);
    let errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
     if (errorMessage.toLowerCase().includes('all api keys failed')) {
        if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
            errorMessage = 'All available API keys have exceeded their usage quota. Please add a new key in settings or wait for the quota to reset.';
        } else if (errorMessage.toLowerCase().includes('api key not valid')) {
            errorMessage = 'None of the provided API keys are valid. Please add a valid key in settings.';
        } else {
            errorMessage = 'Processing failed after trying all API keys. Please check your keys and network connection.';
        }
    } else if (errorMessage.toLowerCase().includes('no google ai api key provided')) {
        errorMessage = 'No API key found. Please add a Google AI API key in the settings panel.';
    }
    return { error: `Failed to generate prompt: ${errorMessage}` };
  }
}

export type ApiKeyTestResult = {
    success: boolean;
    status: 'valid' | 'invalid' | 'rate-limited';
    error?: string;
};

export async function testApiKey(apiKey: string): Promise<ApiKeyTestResult> {
  if (!apiKey) {
    return { success: false, status: 'invalid', error: 'API key is empty.' };
  }
  try {
    const tempAi = genkit({
      plugins: [googleAI({ apiKey, maxRetries: 0 })],
    });
    // A simple, low-cost operation to verify the key
    await tempAi.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: 'test',
        config: {
            maxOutputTokens: 1,
        }
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
      } else if (lowerCaseMessage.includes('permission denied') || lowerCaseMessage.includes('403')) {
        errorMessage = 'Permission denied. Make sure the Gemini API is enabled for your project.';
        status = 'invalid';
      } else if (lowerCaseMessage.includes('429') || lowerCaseMessage.includes('rate limit') || lowerCaseMessage.includes('quota')) {
        status = 'rate-limited';
        const retryMatch = e.message.match(/Please retry in ([\d.]+)s/);
        if (retryMatch && retryMatch[1]) {
            const retrySeconds = Math.ceil(parseFloat(retryMatch[1]));
            errorMessage = `Rate limit exceeded. Please try this key again in about ${retrySeconds} seconds.`;
        } else {
            errorMessage = 'Rate limit exceeded. The key is valid but has run out of its free quota. Please try again later.';
        }
      } else {
        errorMessage = e.message;
      }
    }
    return { success: false, status, error: errorMessage };
  }
}
