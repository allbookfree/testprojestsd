/**
 * @fileOverview Generates detailed, artistic, and permissible (halal) image prompts in bulk.
 * This file implements a key-rotation strategy for Google AI API keys and provides advanced options for prompt generation to ensure uniqueness.
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
  creativity: z.enum(['low', 'medium', 'high', 'maximum']).optional().default('medium').describe('The desired level of creativity and uniqueness.'),
  generateNegativePrompts: z.boolean().optional().default(false).describe('Whether to generate negative prompts to avoid certain elements.'),
  avoidRepetition: z.boolean().optional().default(true).describe('Instructs the AI to actively avoid generating repetitive or very similar prompts.'),
});
export type GenerateImagePromptInput = z.infer<typeof GenerateImagePromptInputSchema>;

const PromptWithNegativeSchema = z.object({
    prompt: z.string().describe('The detailed, artistic, and permissible (halal) image prompt.'),
    negativePrompt: z.string().optional().describe('A prompt describing elements to avoid in the image.'),
});

const GenerateImagePromptOutputSchema = z.object({
  prompts: z.array(PromptWithNegativeSchema).describe('An array of generated prompts, which may include negative prompts.'),
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
  const modelToUse = input.model || 'googleai/gemini-1.5-flash'; // Updated model

  // Construct the dynamic prompt text based on input options
  let promptText = `Based on the user's idea, generate {{{count}}} unique and detailed prompts. User Idea: {{{idea}}}.`;

  if (input.avoidRepetition) {
      promptText += `\n\n**Important Requirement**: Each prompt must be significantly different from the others. Avoid simple variations of the same concept. Focus on diverse subjects, compositions, camera angles, lighting, and artistic styles to ensure every prompt is unique.`;
  }

  const creativityMap = {
      low: 'stick closely to the user idea, with minimal artistic embellishment.',
      medium: 'add some artistic flair and interesting details, while staying true to the core concept.',
      high: 'be very creative, exploring unconventional angles, compositions, and artistic interpretations. Feel free to depart from the literal interpretation of the idea.',
      maximum: 'generate highly imaginative, abstract, and experimental prompts that push the boundaries of creativity.',
  };

  // Safely access creativity level, defaulting to medium if not provided
  const creativityLevel = input.creativity || 'medium';
  promptText += `\n\n**Creativity Level**: You must follow this level of creativity: '${creativityLevel}'. ${creativityMap[creativityLevel]}`;
  
  if (input.generateNegativePrompts) {
      promptText += `\n\nFor each prompt, you MUST also generate a corresponding "negativePrompt" that lists elements to exclude (e.g., "ugly, tiling, poorly drawn hands, boring, sketch, lacklustre, repetitive"). This helps avoid clichés and unwanted features.`;
  }

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
          prompt: promptText,
          // Add temperature based on creativity
          config: {
            temperature: {
              'low': 0.2,
              'medium': 0.5,
              'high': 0.8,
              'maximum': 1.0,
            }[creativityLevel]
          }
      });

      const { output } = await dynamicPrompt(input);
      
      if (output && output.prompts && output.prompts.length > 0) {
        // Ensure that even if the AI doesn't return a prompt, we return an empty object instead of null/undefined
        // And ensure that we return the correct number of prompts
        const sanitizedPrompts = output.prompts.slice(0, input.count).map(p => ({
          prompt: p.prompt || 'No prompt generated.',
          negativePrompt: p.negativePrompt,
        }));
        
        return { prompts: sanitizedPrompts }; // Success!
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
        // For other errors, it might be a prompt-related issue, let's log it.
        console.error(`An error occurred during prompt generation: ${e.message}`);
        // Decide if we should re-throw or continue. For now, we continue to allow other keys to be tried.
        // throw e; 
      }
    }
  }
  
  if (lastError) {
    // If all keys failed, throw a comprehensive error.
    throw new Error(`All API keys failed or an unrecoverable error occurred. Last error: ${lastError.message}`);
  }
  
  // Ensure we always return the correct shape, even if all attempts fail.
  return { prompts: [] };
}
