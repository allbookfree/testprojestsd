'use server';

/**
 * @fileOverview Generates SEO-optimized metadata for image files using AI analysis.
 *
 * - generateImageMetadata - A function that handles the image metadata generation process.
 * - GenerateImageMetadataInput - The input type for the generateImageMetadata function.
 * - GenerateImageMetadataOutput - The return type for the generateImageMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageMetadataInputSchema = z.object({
  imageUri: z
    .string()
    .describe(
      "The image to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImageMetadataInput = z.infer<typeof GenerateImageMetadataInputSchema>;

const GenerateImageMetadataOutputSchema = z.object({
  title: z.string().describe('The SEO-optimized title of the image.'),
  description: z.string().describe('The detailed description of the image.'),
  keywords: z.string().describe('Comma-separated keywords for the image.'),
  rating: z.number().describe('The rating of the image (1-5).'),
});
export type GenerateImageMetadataOutput = z.infer<typeof GenerateImageMetadataOutputSchema>;

export async function generateImageMetadata(input: GenerateImageMetadataInput): Promise<GenerateImageMetadataOutput> {
  return generateImageMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageMetadataPrompt',
  input: {schema: GenerateImageMetadataInputSchema},
  output: {schema: GenerateImageMetadataOutputSchema},
  prompt: `Analyze this image for stock photo SEO and generate the following metadata:\n\n*   Title (8-15 words, SEO-friendly)\n*   Description (50-120 words with colors/objects/mood)\n*   15-25 keywords (comma-separated, long-tail)\n*   Rating (1-5 with reason)\n\nOutput in JSON format: {\"title\": \"...\", \"description\": \"...\", \"keywords\": \"...\", \"rating\": ...}\n\nImage: {{media url=imageUri}}`,
});

const generateImageMetadataFlow = ai.defineFlow(
  {
    name: 'generateImageMetadataFlow',
    inputSchema: GenerateImageMetadataInputSchema,
    outputSchema: GenerateImageMetadataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
