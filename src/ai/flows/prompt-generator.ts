'use server';

import { defineFlow, generate, run, stream } from 'genkit';
import { googleAI, ModelReference } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { লেখা } from './prompt-templates';

// Schemas for inputs and outputs
const গবেষণাSchema = z.object({
  idea: z.string(),
  imageStyle: z.string(),
});

const ধারণাSchema = z.object({
  researchSummary: z.string(),
  count: z.number(),
});

const চূড়ান্তপ্রম্পটSchema = z.object({
  creativeConcepts: z.array(z.string()),
  idea: z.string(),
  imageStyle: z.string(),
  generateNegativePrompts: z.boolean(),
});

// Helper async functions for each step
async function runMarketResearch(input: z.infer<typeof গবেষণাSchema>, model: ModelReference) {
  const llmResponse = await generate({
    model: model,
    prompt: লেখা.গবেষক,
    input: input,
    config: { temperature: 0.5 },
  });
  return llmResponse.output() ?? '';
}

async function runCreativeDirection(input: z.infer<typeof ধারণাSchema>, model: ModelReference) {
  const llmResponse = await generate({
    model: model,
    prompt: লেখা.সৃজনশীল,
    input: input,
    config: { temperature: 0.8 },
  });
  const outputText = llmResponse.output() ?? '[]';
  try {
    return JSON.parse(outputText);
  } catch (e) {
    console.error("Failed to parse creative concepts:", e, "Raw output:", outputText);
    return [];
  }
}

async function runPromptRefinement(input: z.infer<typeof চূড়ান্তপ্রম্পটSchema>, model: ModelReference) {
  const llmResponse = await generate({
    model: model,
    prompt: লেখা.পরিমার্জক,
    input: input,
    config: { temperature: 0.4 },
  });
  const outputText = llmResponse.output() ?? '{ "prompts": [] }';
  try {
    return JSON.parse(outputText);
  } catch (e) {
    console.error("Failed to parse refined prompts:", e, "Raw output:", outputText);
    return { prompts: [] };
  }
}

// Main orchestration flow
export const ઉત્પાદન = defineFlow(
  {
    name: 'উৎপাদন',
    inputSchema: z.object({
      idea: z.string(),
      count: z.number(),
      imageStyle: z.string(),
      generateNegativePrompts: z.boolean(),
      apiKeys: z.array(z.string()),
      model: z.string().optional(),
    }),
    outputSchema: z.any(),
    streamSchema: z.object({
      step: z.string(),
      prompts: z.array(z.any()),
    }),
  },
  async (input, streamingCallback) => {
    const { idea, count, imageStyle, generateNegativePrompts, apiKeys, model } = input;

    // Create a temporary, dynamically configured plugin instance.
    const dynamicGoogleAI = googleAI({ apiKey: apiKeys });
    const modelToUse = dynamicGoogleAI.model(model || 'gemini-1.5-flash');

    const researchSummary = await run('market-research', () =>
      runMarketResearch({ idea, imageStyle }, modelToUse)
    );
    if (streamingCallback) streamingCallback({ step: 'research-complete', prompts: [] });

    const creativeConcepts = await run('creative-direction', () =>
      runCreativeDirection({ researchSummary, count }, modelToUse)
    );
    if (streamingCallback) streamingCallback({ step: 'creation-complete', prompts: creativeConcepts.map((c: string) => ({ prompt: c })) });

    const finalPrompts = await run('quality-control', () =>
      runPromptRefinement({ creativeConcepts, idea, imageStyle, generateNegativePrompts }, modelToUse)
    );
    if (streamingCallback) streamingCallback({ step: 'refinement-complete', prompts: finalPrompts.prompts });

    return finalPrompts;
  }
);
