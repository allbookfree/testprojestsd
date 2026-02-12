'use server';

import { z } from 'zod';
import { ઉત્પાદન as multiStepPromptFlow, mainInputSchema as multiStepInputSchema } from './prompt-generator';

// Input and output schemas remain the same
export const GenerateImagePromptInput = z.object({
  idea: z.string().min(1, { message: 'Idea cannot be empty.' }),
  count: z.number().int().gt(0, { message: 'Count must be greater than 0.' }),
  imageStyle: z.enum(['photorealistic', 'vector']),
  generateNegativePrompts: z.boolean(),
  apiKeys: z.array(z.string()).min(1, { message: 'At least one API key is required.' }),
  model: z.string().optional(),
});

export const GenerateImagePromptOutput = z.object({
  prompts: z.array(
    z.object({
      prompt: z.string(),
      negativePrompt: z.string().optional(),
    })
  ),
});

// Rewritten main function (previously a genkit flow)
export async function generateImagePrompt(input: z.infer<typeof GenerateImagePromptInput>): Promise<z.infer<typeof GenerateImagePromptOutput>> {
  // 1. Validate the main input
  const validatedInput = GenerateImagePromptInput.parse(input);

  console.log(`Delegating to multi-step flow for idea: "${validatedInput.idea}"`);

  // 2. Directly call the rewritten sub-flow function
  const finalResult = await multiStepPromptFlow({
    idea: validatedInput.idea,
    count: validatedInput.count,
    imageStyle: validatedInput.imageStyle,
    generateNegativePrompts: validatedInput.generateNegativePrompts,
    apiKeys: validatedInput.apiKeys,
    model: validatedInput.model,
  });

  // 3. Validate the output from the sub-flow
  const validation = GenerateImagePromptOutput.safeParse(finalResult);
  if (!validation.success) {
    console.error('Sub-flow output validation failed:', validation.error.issues);
    throw new Error(`Output from sub-flow failed validation: ${validation.error.message}`);
  }

  return validation.data;
}
