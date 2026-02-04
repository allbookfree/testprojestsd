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
  model: z.string().optional().describe('The AI model to use for generation.'),
  useAutoMetadata: z.boolean().optional().describe('Whether the AI should decide lengths.'),
  titleLength: z.number().optional().describe('The maximum number of words for the title.'),
  descriptionLength: z.number().optional().describe('The maximum number of words for the description.'),
  keywordCount: z.number().optional().describe('The desired number of keywords.'),
});
export type GenerateImageMetadataInput = z.infer<typeof GenerateImageMetadataInputSchema>;

const GenerateImageMetadataOutputSchema = z.object({
  title: z.string().describe('The SEO-optimized title of the image.'),
  description: z.string().describe('The detailed description of the image.'),
  keywords: z.string().describe('Comma-separated keywords for the image.'),
  rating: z.number().describe('The rating of the image (1-5).'),
});
export type GenerateImageMetadataOutput = z.infer<typeof GenerateImageMetadataOutputSchema>;

const autoPromptText = `Analyze this image for stock photo SEO and generate the following metadata. For title, description, and keywords, use your expert judgment to decide the optimal length and quantity for maximum marketability based on the image's content. Do not make them too short or too long.

*   Title (SEO-friendly)
*   Description (with colors/objects/mood)
*   Keywords (comma-separated, long-tail)
*   Rating (1-5 with reason)

Output in JSON format: {\"title\": \"...\", \"description\": \"...\", \"keywords\": \"...\", \"rating\": ...}

Image: {{media url=imageUri}}`;

const manualPromptText = `Analyze this image for stock photo SEO and generate the following metadata:\n\n*   Title (approx. {{titleLength}} words, SEO-friendly)\n*   Description (approx. {{descriptionLength}} words, with colors/objects/mood)\n*   {{keywordCount}} keywords (comma-separated, long-tail)\n*   Rating (1-5 with reason)\n\nOutput in JSON format: {\"title\": \"...\", \"description\": \"...\", \"keywords\": \"...\", \"rating\": ...}\n\nImage: {{media url=imageUri}}`;

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
  const modelToUse = input.model || 'googleai/gemini-2.5-flash';
  const promptText = input.useAutoMetadata ? autoPromptText : manualPromptText;

  for (const key of keysToTry) {
    if (!key) continue;

    try {
      const tempAi = genkit({
        plugins: [googleAI({ apiKey: key })],
      });

      const tempPrompt = tempAi.definePrompt({
        name: 'generateImageMetadataPrompt_dynamic',
        input: { schema: GenerateImageMetadataInputSchema.omit({ apiKeys: true, model: true }) },
        output: { schema: GenerateImageMetadataOutputSchema },
        prompt: promptText,
        model: modelToUse
      });
      
      const {
        imageUri,
        titleLength = 15,
        descriptionLength = 100,
        keywordCount = 25
      } = input;

      const { output } = await tempPrompt({
        ...input
      });

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
