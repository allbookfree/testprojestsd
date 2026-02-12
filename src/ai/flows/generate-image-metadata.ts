'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Schemas remain the same for input and output validation
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

const metadataPrompt = `
  You are an expert in stock photography metadata. Your task is to generate a compelling title, a detailed description, and relevant keywords for the provided image.

  **Instructions:**
  1.  **Analyze the Image:** Carefully examine the image at the given URI.
  2.  **Generate Title:** Create a concise, descriptive, and commercially appealing title, approximately {{titleLength}} characters long.
  3.  **Generate Description:** Write a detailed and engaging description of the image, including key subjects, context, and potential uses. Aim for approximately {{descriptionLength}} characters.
  4.  **Generate Keywords:** List the {{keywordCount}} most relevant keywords. Include conceptual, subject, and technical terms. Do not include proper nouns or brand names.
  5.  **Creativity:** Adjust your response style based on the creativity level (0.1 for literal, 1.0 for highly creative): {{creativityLevel}}.
  6.  **Format:** Return the output as a single, valid JSON object with the keys "title", "description", and "keywords".
`;

// A simple async function to replace the genkit flow
export async function generateImageMetadata(input: z.infer<typeof GenerateImageMetadataInput>): Promise<z.infer<typeof GenerateImageMetadataOutput>> {
  // 1. Validate the input
  const validatedInput = GenerateImageMetadataInput.parse(input);

  // 2. Initialize the Google AI client
  const genAI = new GoogleGenerativeAI(validatedInput.apiKeys[0]);
  const modelName = validatedInput.model || 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: validatedInput.creativityLevel,
      responseMimeType: 'application/json',
    },
  });

  // 3. Prepare the prompt with dynamic values
  const filledPrompt = metadataPrompt
    .replace('{{titleLength}}', String(validatedInput.titleLength))
    .replace('{{descriptionLength}}', String(validatedInput.descriptionLength))
    .replace('{{keywordCount}}', String(validatedInput.keywordCount))
    .replace('{{creativityLevel}}', String(validatedInput.creativityLevel));

  // 4. Prepare the image part for the model
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg', // Assuming JPEG, adjust if necessary
      data: validatedInput.imageUri.split(',')[1], // Extract base64 data
    },
  };

  // 5. Generate content
  const result = await model.generateContent([filledPrompt, imagePart]);
  const response = result.response;
  const text = response.text();

  // 6. Parse and validate the output
  const jsonOutput = JSON.parse(text);
  const validatedOutput = GenerateImageMetadataOutput.parse(jsonOutput);

  return validatedOutput;
}
