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

const autoPromptText = `You are an expert SEO specialist and metadata generator for Adobe Stock. Your task is to analyze the provided image and generate commercially valuable, and highly SEO-optimized metadata. Your goal is to maximize the image's discoverability and sales potential on Adobe Stock.

Generate the following:
*   **Title:** A powerful, commercially valuable, and SEO-friendly title that accurately describes the image's core subject and concept. The title itself should function as the primary subject line. Aim for a length that is optimal for search engines (typically 10-15 words).
*   **Description:** A detailed and engaging description of 2-4 sentences. Mention the main subjects, objects, colors, lighting, mood, and potential commercial concepts or metaphors. Write for both humans and search engines.
*   **Keywords:** A comprehensive, comma-separated list of 30 to 48 commercially valuable keywords, based on the image's content and potential use cases. The number of keywords should depend on the image's complexity. **Do NOT exceed 48 keywords under any circumstances.**
*   **Rating:** A rating from 1 to 5, with a brief justification based on its commercial viability, quality, and uniqueness.

Output MUST be in JSON format: {\"title\": \"...\", \"description\": \"...\", \"keywords\": \"...\", \"rating\": ...}

Image: {{media url=imageUri}}`;

const manualPromptText = `You are an expert SEO specialist and metadata generator for Adobe Stock. Your task is to analyze the provided image and generate commercially valuable, and highly SEO-optimized metadata according to the specified lengths.

Generate the following:
*   **Title:** A powerful and SEO-friendly title of approximately {{titleLength}} words. This title is the most critical element for search ranking.
*   **Description:** A detailed and engaging description of approximately {{descriptionLength}} words.
*   **Keywords:** A comprehensive, comma-separated list of exactly {{keywordCount}} high-value keywords. **Do NOT exceed 48 keywords under any circumstances.**
*   **Rating:** A rating from 1 to 5, based on its commercial viability and quality.

Output MUST be in JSON format: {\"title\": \"...\", \"description\": \"...\", \"keywords\": \"...\", \"rating\": ...}

Image: {{media url=imageUri}}`;

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
      
      const { output } = await tempPrompt({
        ...input
      });

      if (output) {
        const permanentKeyword = "ai image";
        let keywords: string[] = [];

        if (output.keywords) {
            // 1. Split, trim, and filter empty or whitespace-only strings
            keywords = output.keywords.split(',').map(k => k.trim()).filter(Boolean);
        }

        // 2. Remove the permanent keyword if AI already included it, to avoid duplicates
        const permanentKeywordIndex = keywords.findIndex(k => k.toLowerCase() === permanentKeyword.toLowerCase());
        if (permanentKeywordIndex > -1) {
            keywords.splice(permanentKeywordIndex, 1);
        }

        // 3. Enforce the max limit of 47 from AI + 1 permanent = 48 total
        const finalKeywords = keywords.slice(0, 47);
        
        // 4. Add the permanent keyword
        finalKeywords.push(permanentKeyword);
        
        // 5. Update the output
        output.keywords = finalKeywords.join(', ');

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
