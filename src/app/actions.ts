'use server';

import { generateImageMetadata, GenerateImageMetadataOutput } from "@/ai/flows/generate-image-metadata";

export async function runGenerateImageMetadata(
    imageUri: string,
    apiKeys: string[]
): Promise<GenerateImageMetadataOutput | { error: string }> {
  try {
    if (!imageUri) {
      return { error: 'Image data is missing.' };
    }
    // Pass keys to the flow
    const metadata = await generateImageMetadata({ imageUri, apiKeys });
    return metadata;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate metadata: ${errorMessage}` };
  }
}
