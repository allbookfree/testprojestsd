'use server';

import { defineFlow, generate } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// Schemas for the metadata generation flow
export const GenerateImageMetadataInput = z.object({
  imageUri: z.string(),
  apiKeys: z.array(z.string()).min(1),
  model: z.string().optional(),
  useAutoMetadata: z.boolean(),
  titleLength: z.number(),
  descriptionLength: z.number(),
  keywordCount: z.number(),
  creativityLevel: z.number(),
});

export const GenerateImageMetadataOutput = z.object({
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
});

// The prompt for the AI model
const metadataPrompt = `
  You are an expert in stock photography metadata. Your task is to generate a compelling title, a detailed description, and relevant keywords for the provided image.

  **Instructions:**
  1.  **Analyze the Image:** Carefully examine the image at the given URI.
  2.  **Generate Title:** Create a concise, descriptive, and commercially appealing title, approximately {{titleLength}} characters long.
  3.  **Generate Description:** Write a detailed and engaging description of the image, including key subjects, context, and potential uses. Aim for approximately {{descriptionLength}} characters.
  4.  **Generate Keywords:** List the {{keywordCount}} most relevant keywords. Include conceptual, subject, and technical terms. Do not include proper nouns or brand names.
  5.  **Creativity:** Adjust your response style based on the creativity level (0.1 for literal, 1.0 for highly creative): {{creativityLevel}}.
  6.  **Format:** Return the output as a single, valid JSON object with the keys "title", "description", and "keywords".

  **Image URI:** {{imageUri}}
`;

// The main flow for generating image metadata
export const generateImageMetadata = defineFlow(
  {
    name: 'generateImageMetadata',
    inputSchema: GenerateImageMetadataInput,
    outputSchema: GenerateImageMetadataOutput,
  },
  async (input) => {
    // Create a temporary plugin instance with the user-provided API key.
    const dynamicGoogleAI = googleAI({ apiKey: input.apiKeys });
    const modelName = input.model || 'gemini-1.5-flash'; 

    const llmResponse = await generate({
      // Use the model from the temporary, dynamically configured plugin.
      model: dynamicGoogleAI.model(modelName),
      prompt: metadataPrompt,
      input: {
        imageUri: input.imageUri,
        titleLength: input.titleLength,
        descriptionLength: input.descriptionLength,
        keywordCount: input.keywordCount,
        creativityLevel: input.creativityLevel,
      },
      config: {
        temperature: input.creativityLevel,
        responseFormat: 'json',
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error('Failed to get a valid response from the AI model.');
    }

    const validation = GenerateImageMetadataOutput.safeParse(output);
    if (!validation.success) {
      console.error('Metadata output validation failed:', validation.error.issues);
      throw new Error(`Output validation failed: ${validation.error.message}`);
    }

    return validation.data;
  }
);
