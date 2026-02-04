'use server';

import { generateImageMetadata, GenerateImageMetadataOutput } from "@/ai/flows/generate-image-metadata";
import { generateImagePrompt, GenerateImagePromptOutput } from "@/ai/flows/generate-image-prompt";
import { AppSettings } from "@/hooks/use-settings";

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
        titleLength: settings.titleLength,
        descriptionLength: settings.descriptionLength,
        keywordCount: settings.keywordCount
    });
    return metadata;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate metadata: ${errorMessage}` };
  }
}

export async function runGenerateImagePrompt(
    idea: string,
    count: number
): Promise<GenerateImagePromptOutput | { error: string }> {
  try {
    if (!idea) {
      return { error: 'Idea is missing.' };
    }
    if (count <= 0) {
        return { error: 'Number of prompts must be greater than zero.' };
    }
    // The settings aren't needed here for now, but could be added later to select a model
    const result = await generateImagePrompt({ idea, count });
    return result;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate prompt: ${errorMessage}` };
  }
}
