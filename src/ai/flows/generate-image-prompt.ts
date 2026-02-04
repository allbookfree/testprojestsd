/**
 * @fileOverview Generates detailed, artistic, and permissible (halal) image prompts in bulk.
 * This file implements a key-rotation strategy for Google AI API keys.
 *
 * - generateImagePrompt - A function that handles the image prompt generation process.
 * - GenerateImagePromptInput - The input type for the generateImagePrompt function.
 * - GenerateImagePromptOutput - The return type for the generateImagePrompt function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GenerateImagePromptInputSchema = z.object({
  idea: z.string().describe('The basic idea or concept for the image.'),
  count: z.number().min(1).max(200).describe('The number of unique prompts to generate.'),
  systemPrompt: z.string().describe('The master system prompt to guide the AI generation.'),
  apiKeys: z.array(z.string()).describe('An array of Google AI API keys to try.'),
  model: z.string().optional().describe('The AI model to use for generation.'),
});
export type GenerateImagePromptInput = z.infer<typeof GenerateImagePromptInputSchema>;

const GenerateImagePromptOutputSchema = z.object({
  prompts: z.array(z.string()).describe('An array of detailed, artistic, and permissible (halal) image prompts.'),
});
export type GenerateImagePromptOutput = z.infer<typeof GenerateImagePromptOutputSchema>;

export async function generateImagePrompt(input: GenerateImagePromptInput): Promise<GenerateImagePromptOutput> {
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

      const dynamicPrompt = tempAi.definePrompt({
          name: 'generateHalalImagePromptsBulk_dynamic',
          system: input.systemPrompt,
          input: { schema: GenerateImagePromptInputSchema.omit({ systemPrompt: true, apiKeys: true, model: true }) },
          output: { schema: GenerateImagePromptOutputSchema },
          model: modelToUse,
          prompt: `Based on the user's idea, generate {{{count}}} unique and detailed prompts. User Idea: {{{idea}}}`,
      });

      const { output } = await dynamicPrompt(input);
      
      if (output && output.prompts) {
        return output; // Success!
      }
    } catch (e: any) {
      lastError = e;
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
        throw e; // For other errors, fail fast.
      }
    }
  }
  
  if (lastError) {
    throw new Error(`All API keys failed. Last error: ${lastError.message}`);
  }
  
  // Ensure we always return the correct shape, even if the AI fails.
  return { prompts: [] };
}
