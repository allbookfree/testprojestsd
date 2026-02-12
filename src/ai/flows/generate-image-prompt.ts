'use server';

import { defineFlow, run } from 'genkit';
import { z } from 'zod';
import { ઉત્પાદન as multiStepPromptFlow } from './prompt-generator';

// Define the input schema for the main flow
export const GenerateImagePromptInput = z.object({
  idea: z.string().min(1, { message: 'Idea cannot be empty.' }),
  count: z.number().int().gt(0, { message: 'Count must be greater than 0.' }),
  imageStyle: z.enum(['photorealistic', 'vector']),
  generateNegativePrompts: z.boolean(),
  apiKeys: z.array(z.string()).min(1, { message: 'At least one API key is required.' }),
  model: z.string().optional(),
});

// Define the output schema for the main flow
export const GenerateImagePromptOutput = z.object({
  prompts: z.array(
    z.object({
      prompt: z.string(),
      negativePrompt: z.string().optional(),
    })
  ),
});

// The main flow that orchestrates the multi-step prompt generation
export const generateImagePrompt = defineFlow(
  {
    name: 'generateImagePrompt',
    inputSchema: GenerateImagePromptInput,
    outputSchema: GenerateImagePromptOutput,
  },
  async (input) => {
    // This flow's responsibility is to validate input and delegate to the sub-flow.
    console.log(`Delegating to multi-step flow for idea: "${input.idea}"`);

    const finalResult = await run({
      flow: multiStepPromptFlow,
      input: {
        idea: input.idea,
        count: input.count,
        imageStyle: input.imageStyle,
        generateNegativePrompts: input.generateNegativePrompts,
        apiKeys: input.apiKeys, // Pass keys down to the sub-flow
        model: input.model,
      },
    });

    // The sub-flow might return a more flexible object, so we validate it here
    // before returning to ensure the final output is clean.
    const validation = GenerateImagePromptOutput.safeParse(finalResult);
    if (!validation.success) {
      console.error('Sub-flow output validation failed:', validation.error.issues);
      throw new Error(`Output from sub-flow failed validation: ${validation.error.message}`);
    }

    return validation.data;
  }
);
