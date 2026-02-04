'use server';

/**
 * @fileOverview Generates SEO-optimized metadata for image files using AI analysis.
 * This file implements a key-rotation strategy for Google AI API keys.
 *
 * - generateImageMetadata - A function that handles the image metadata generation process.
 * - GenerateImageMetadataInput - The input type for the generateImageMetadata function.
 * - GenerateImageMetadataOutput - The return type for the generateImageMetadata function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GenerateImageMetadataInputSchema = z.object({
  imageUri: z
    .string()
    .describe(
      "The image to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  apiKeys: z.array(z.string()).describe('An array of Google AI API keys to try.'),
});
export type GenerateImageMetadataInput = z.infer<typeof GenerateImageMetadataInputSchema>;

const GenerateImageMetadataOutputSchema = z.object({
  title: z.string().describe('The SEO-optimized title of the image.'),
  description: z.string().describe('The detailed description of the image.'),
  keywords: z.string().describe('Comma-separated keywords for the image.'),
  rating: z.number().describe('The rating of the image (1-5).'),
});
export type GenerateImageMetadataOutput = z.infer<typeof GenerateImageMetadataOutputSchema>;

// This is the prompt definition that will be used to create temporary prompts.
const promptDefinition = {
  name: 'generateImageMetadataPrompt_dynamic',
  input: { schema: GenerateImageMetadataInputSchema.pick({ imageUri: true }) },
  output: { schema: GenerateImageMetadataOutputSchema },
  prompt: `Analyze this image for stock photo SEO and generate the following metadata:\n\n*   Title (8-15 words, SEO-friendly)\n*   Description (50-120 words with colors/objects/mood)\n*   15-25 keywords (comma-separated, long-tail)\n*   Rating (1-5 with reason)\n\nOutput in JSON format: {\"title\": \"...\", \"description\": \"...\", \"keywords\": \"...\", \"rating\": ...}\n\nImage: {{media url=imageUri}}`,
};


export async function generateImageMetadata(input: GenerateImageMetadataInput): Promise<GenerateImageMetadataOutput> {
  // Use keys from input, but also have a fallback to the environment variable for existing setups.
  const keysToTry = [...input.apiKeys];
  if (process.env.GEMINI_API_KEY) {
      if (!keysToTry.includes(process.env.GEMINI_API_KEY)) {
        keysToTry.push(process.env.GEMINI_API_KEY);
      }
  }

  if (keysToTry.length === 0) {
    throw new Error('No Google AI API key provided. Please add one in the settings or set GEMINI_API_KEY in your .env file.');
  }

  let lastError: any = null;

  for (const key of keysToTry) {
    if (!key) continue;

    try {
      const tempAi = genkit({
        plugins: [googleAI({ apiKey: key })],
        model: 'googleai/gemini-2.5-flash',
      });

      const tempPrompt = tempAi.definePrompt(promptDefinition);

      const { output } = await tempPrompt({ imageUri: input.imageUri });

      if (output) {
        return output; // Success!
      }
    } catch (e: any) {
      lastError = e;
      // Check for common API key / quota errors.
      const errorMessage = e.message.toLowerCase();
      if (
        errorMessage.includes('api key not valid') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('429') ||
        errorMessage.includes('permission denied')
      ) {
        console.warn(`API key failed (reason: ${e.message}). Trying next key.`);
        continue; // Try the next key
      } else {
        // For other, unexpected errors, we should fail fast.
        throw e;
      }
    }
  }

  // If all keys failed, throw a comprehensive error.
  if (lastError) {
    throw new Error(`All API keys failed. Last error: ${lastError.message}`);
  }
  
  throw new Error('Could not generate metadata. Please check your API keys and try again.');
}
