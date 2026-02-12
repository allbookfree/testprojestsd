'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { লেখা } from './prompt-templates'; // Assuming 'লেখা' contains the prompt strings

// Schemas for inputs and outputs (no changes needed here)
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

// Helper to create and call the model
async function callGenerativeModel(client: GoogleGenerativeAI, modelName: string, prompt: string, input: any, temperature: number, json = false) {
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature,
      ...(json && { responseMimeType: 'application/json' }),
    },
  });

  // Replace placeholders in the prompt
  let filledPrompt = prompt;
  for (const key in input) {
    filledPrompt = filledPrompt.replace(new RegExp(`{{${key}}}`, 'g'), input[key]);
  }

  const result = await model.generateContent(filledPrompt);
  const response = result.response;
  return response.text();
}

// Rewritten helper async functions
async function runMarketResearch(input: z.infer<typeof গবেষণাSchema>, client: GoogleGenerativeAI, modelName: string) {
  const output = await callGenerativeModel(client, modelName, লেখা.গবেষক, input, 0.5);
  return output ?? '';
}

async function runCreativeDirection(input: z.infer<typeof ধারণাSchema>, client: GoogleGenerativeAI, modelName: string) {
  const outputText = await callGenerativeModel(client, modelName, লেখা.সৃজনশীল, input, 0.8, true);
  try {
    const parsed = JSON.parse(outputText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse creative concepts:", e, "Raw output:", outputText);
    return [];
  }
}

async function runPromptRefinement(input: z.infer<typeof চূড়ান্তপ্রম্পটSchema>, client: GoogleGenerativeAI, modelName: string) {
  const outputText = await callGenerativeModel(client, modelName, লেখা.পরিমার্জক, input, 0.4, true);
  try {
    const parsed = JSON.parse(outputText);
    return parsed.prompts && Array.isArray(parsed.prompts) ? parsed : { prompts: [] };
  } catch (e) {
    console.error("Failed to parse refined prompts:", e, "Raw output:", outputText);
    return { prompts: [] };
  }
}

// Main orchestration function (rewritten from genkit flow)
export async function ઉત્પાદન(input: z.infer<typeof mainInputSchema>, streamingCallback?: (data: any) => void) {
  const { idea, count, imageStyle, generateNegativePrompts, apiKeys, model } = input;

  const genAI = new GoogleGenerativeAI(apiKeys[0]);
  const modelToUse = model || 'gemini-1.5-flash';

  // Step 1: Market Research
  const researchSummary = await runMarketResearch({ idea, imageStyle }, genAI, modelToUse);
  if (streamingCallback) streamingCallback({ step: 'research-complete', prompts: [] });

  // Step 2: Creative Direction
  const creativeConcepts = await runCreativeDirection({ researchSummary, count }, genAI, modelToUse);
  if (streamingCallback) streamingCallback({ step: 'creation-complete', prompts: creativeConcepts.map((c: string) => ({ prompt: c })) });

  // Step 3: Quality Control & Refinement
  const finalPrompts = await runPromptRefinement({ creativeConcepts, idea, imageStyle, generateNegativePrompts }, genAI, modelToUse);
  if (streamingCallback) streamingCallback({ step: 'refinement-complete', prompts: finalPrompts.prompts });

  return finalPrompts;
}

// Main input schema for the new function
export const mainInputSchema = z.object({
  idea: z.string(),
  count: z.number(),
  imageStyle: z.string(),
  generateNegativePrompts: z.boolean(),
  apiKeys: z.array(z.string()).min(1),
  model: z.string().optional(),
});
