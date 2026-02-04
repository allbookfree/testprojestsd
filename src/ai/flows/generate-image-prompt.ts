/**
 * @fileOverview Generates detailed, artistic, and permissible (halal) image prompts in bulk.
 *
 * - generateImagePrompt - A function that handles the image prompt generation process.
 * - GenerateImagePromptInput - The input type for the generateImagePrompt function.
 * - GenerateImagePromptOutput - The return type for the generateImagePrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImagePromptInputSchema = z.object({
  idea: z.string().describe('The basic idea or concept for the image.'),
  count: z.number().min(1).max(200).describe('The number of unique prompts to generate.'),
  systemPrompt: z.string().describe('The master system prompt to guide the AI generation.'),
});
export type GenerateImagePromptInput = z.infer<typeof GenerateImagePromptInputSchema>;

const GenerateImagePromptOutputSchema = z.object({
  prompts: z.array(z.string()).describe('An array of detailed, artistic, and permissible (halal) image prompts.'),
});
export type GenerateImagePromptOutput = z.infer<typeof GenerateImagePromptOutputSchema>;

export async function generateImagePrompt(input: GenerateImagePromptInput): Promise<GenerateImagePromptOutput> {
  // We can call the flow directly for simplicity here.
  return await generateImagePromptFlow(input);
}

const generateImagePromptFlow = ai.defineFlow(
  {
    name: 'generateImagePromptFlow',
    inputSchema: GenerateImagePromptInputSchema,
    outputSchema: GenerateImagePromptOutputSchema,
  },
  async (input) => {
    // The prompt is now defined dynamically within the flow to allow for a custom system prompt.
    const dynamicPrompt = ai.definePrompt({
        name: 'generateHalalImagePromptsBulk_dynamic',
        system: input.systemPrompt,
        input: { schema: GenerateImagePromptInputSchema.omit({ systemPrompt: true }) },
        output: { schema: GenerateImagePromptOutputSchema },
        prompt: `Based on the user's idea, generate {{{count}}} unique and detailed prompts. User Idea: {{{idea}}}`,
    });

    const { output } = await dynamicPrompt(input);
    // Ensure we always return the correct shape, even if the AI fails.
    return output || { prompts: [] };
  }
);
