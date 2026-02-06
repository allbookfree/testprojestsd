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

const masterPromptText = `You are a world-class SEO expert and a top-performing Adobe Stock content specialist. Your sole mission is to analyze an image and generate powerful, commercially valuable, and 100% SEO-optimized metadata. Your work directly impacts the image's discoverability and sales potential on platforms like Adobe Stock. Be precise, be strategic, and think like a buyer.

**Analysis & Strategy:**
First, deeply analyze the provided image. Identify the main subject, setting, colors, lighting, mood, composition, and any commercial concepts or metaphors it represents. Consider who would buy this image and for what purpose (e.g., website banner, blog post, advertisement).

**Metadata Generation:**
Based on your expert analysis, generate the following metadata. Output MUST be in a valid JSON format: {"title": "...", "description": "...", "keywords": "...", "rating": ...}

1.  **Title:**
    *   This is the MOST CRITICAL element for SEO.
    *   Craft a powerful, descriptive, and highly searchable title. It must function as the primary subject line.
    *   {{#if useAutoMetadata}}Aim for an optimal length of 10-15 words, balancing detail with clarity.{{else}}The title must be approximately {{titleLength}} words long.{{/if}}

2.  **Description:**
    *   Write a detailed and engaging description of 2-4 sentences.
    *   Mention the main subjects, actions, colors, lighting, mood, and potential commercial uses. Write for both humans and search engines.
    *   {{#unless useAutoMetadata}}The description must be approximately {{descriptionLength}} words long.{{/unless}}

3.  **Keywords:**
    *   This is your secret weapon. Generate a comprehensive, comma-separated list of high-value keywords.
    *   {{#if useAutoMetadata}}The number of keywords should be between 30 and 48, based on the image's complexity and commercial potential. More complex images deserve more keywords.{{else}}Generate exactly {{keywordCount}} keywords.{{/if}}
    *   **CRITICAL RULE: The total number of keywords must NOT exceed 48 under any circumstances.**
    *   Include a mix of literal keywords (e.g., 'tree', 'green', 'leaf') and conceptual keywords (e.g., 'growth', 'nature', 'sustainability').

4.  **Rating:**
    *   Provide an honest rating from 1 to 5, based on its overall quality, uniqueness, and commercial viability for Adobe Stock. A 5-star rating should be reserved for truly exceptional, high-demand images.

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

  for (const key of keysToTry) {
    if (!key) continue;

    try {
      const tempAi = genkit({
        plugins: [googleAI({ apiKey: key })],
      });

      const tempPrompt = tempAi.definePrompt({
        name: 'generateImageMetadataPrompt_dynamic_v2',
        input: { schema: GenerateImageMetadataInputSchema.omit({ apiKeys: true, model: true }) },
        output: { schema: GenerateImageMetadataOutputSchema },
        prompt: masterPromptText,
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
