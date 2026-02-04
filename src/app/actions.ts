'use server';

import { generateImageMetadata, GenerateImageMetadataOutput } from "@/ai/flows/generate-image-metadata";
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
