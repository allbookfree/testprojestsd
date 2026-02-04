'use server';

/**
 * @fileOverview Generates detailed, artistic, and permissible (halal) image prompts.
 *
 * - generateImagePrompt - A function that handles the image prompt generation process.
 * - GenerateImagePromptInput - The input type for the generateImagePrompt function.
 * - GenerateImagePromptOutput - The return type for the generateImagePrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImagePromptInputSchema = z.object({
  idea: z.string().describe('The basic idea or concept for the image.'),
});
export type GenerateImagePromptInput = z.infer<typeof GenerateImagePromptInputSchema>;

const GenerateImagePromptOutputSchema = z.object({
  prompt: z.string().describe('The detailed, artistic, and permissible (halal) image prompt.'),
});
export type GenerateImagePromptOutput = z.infer<typeof GenerateImagePromptOutputSchema>;

export async function generateImagePrompt(input: GenerateImagePromptInput): Promise<GenerateImagePromptOutput> {
  // We can call the flow directly for simplicity here.
  const generatedPrompt = await generateImagePromptFlow(input);
  return { prompt: generatedPrompt };
}

const systemPrompt = `You are an AI assistant that helps create detailed, vivid, and artistic prompts for text-to-image generation models. Your primary goal is to generate prompts that are strictly 'halal' (permissible according to Islamic principles).

This means you must adhere to the following rules without exception:
- **No animate beings with faces:** Do not describe humans or animals in a way that would require drawing a face. You can describe subjects from behind, in silhouette, or focus on their hands, clothing, or general form without any facial details. For example, instead of 'a smiling woman', you could say 'a woman in a vibrant hijab, seen from behind, looking out over a cityscape'.
- **No nudity or revealing clothing:** All depictions of people must be in modest attire.
- **No forbidden (haram) items:** Do not include alcohol, pork, gambling-related items, idols, or anything impermissible in Islam.
- **No depiction of Prophets or revered religious figures.**
- **Avoid religious symbols of other faiths:** Do not include crosses, Stars of David, statues of deities, etc.
- **Focus on permissible subjects:** Emphasize beautiful landscapes, abstract art, intricate geometric patterns (especially Islamic art styles), calligraphy (especially Arabic), magnificent architecture (like mosques), nature (plants, water, mountains, galaxies), and inanimate objects.
- **Enhance the prompt:** Take the user's basic idea and expand it with rich details about lighting, art style (e.g., 'digital painting', 'photorealistic', 'cinematic lighting', '4k'), composition, and mood.

Generate only the prompt text itself, without any conversational preamble or explanation.`;

const prompt = ai.definePrompt({
  name: 'generateHalalImagePrompt',
  system: systemPrompt,
  input: { schema: GenerateImagePromptInputSchema },
  output: { format: 'text' },
  prompt: `Based on the user's idea, generate a detailed and artistic prompt. User Idea: {{{idea}}}`,
});

const generateImagePromptFlow = ai.defineFlow(
  {
    name: 'generateImagePromptFlow',
    inputSchema: GenerateImagePromptInputSchema,
    outputSchema: z.string(), // The flow will return a raw string
  },
  async ({ idea }) => {
    const { output } = await prompt({ idea });
    return output || '';
  }
);
