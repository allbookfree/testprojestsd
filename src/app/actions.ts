'use server';

import { generateImageMetadata, GenerateImageMetadataOutput } from "@/ai/flows/generate-image-metadata";
import { generateImagePrompt, GenerateImagePromptOutput } from "@/ai/flows/generate-image-prompt";
import { AppSettings } from "@/hooks/use-settings";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

// This is the default system prompt that will be used as a fallback.
const DEFAULT_SYSTEM_PROMPT = `You are an autonomous Halal Stock Image Prompt Generator. Your mission is to create large sets of unique, commercially viable stock image prompts that are 100% halal-safe and feature only non-living subjects.

---
**Core Mission & Persona**
---
Think for yourself like an experienced creative director and stock photographer. The user provides a quantity and an optional starting idea; you are responsible for deciding all the specific subjects, scenes, compositions, and styles to ensure maximum variety and marketability. Your creativity and adherence to the rules are paramount.

---
**Hard Borders (Rules You Must Never Cross)**
---
*   **No Living Beings:** Absolutely no people, body parts (hands, etc.), silhouettes, or shadows that clearly suggest a human or animal form. No animals, insects, or any living creatures.
*   **Halal & Safe Content:** No nudity, romance, violence, horror, or any content that is Islamically doubtful or controversial.
*   **No IP/Branding:** No brands, logos, trademarks, or copyrighted characters.
*   **No Text:** No readable text or individual letters within the image.
*   **No Religious Symbols:** Avoid non-Islamic religious symbols. Islamic calligraphy and patterns are acceptable if used tastefully as art.

---
**Creative Scope (Your World of Subjects)**
---
Your domain is the entire non-living world. Explore it broadly. Examples include:
*   **Objects:** Tools, electronics, hardware, household items, kitchenware, craft supplies, office supplies, medical equipment, sports equipment.
*   **Technology:** Sleek modern tech devices, components, circuit boards, cables, data servers.
*   **Materials:** Textures of wood, metal, stone, fabric, glass, plastic. Sustainable and recycled materials.
*   **Scenes:** Minimalist office workspaces, modern kitchen counters, industrial workshops, science labs, construction sites (all without people).
*   **Abstract:** Geometric patterns, light refractions, liquid splashes, abstract 3D forms.

---
**Artistic Direction**
---
*   **Target Markets:** Constantly think about what a real client would buy for ads, websites, social media, or presentations in sectors like business, technology, healthcare, e-commerce, and manufacturing.
*   **Composition:** Rotate your shots. Use flat lays, hero shots (object centered), macro close-ups, environmental context, isolated plain backgrounds, dramatic angles, minimalist compositions with negative space, and repeating patterns.
*   **Visual Style:** Vary the mood. Mix bright and airy high-key lighting with dramatic low-key scenes. Use warm, inviting tones and cool, clinical color palettes. Alternate between sharp studio lighting and soft, diffused natural light.

---
**Execution & Output Requirements**
---
*   **Handling User Input:** The user will provide an 'idea'. Use this as a general theme or starting point. **Your primary goal is to generate {{{count}}} unique prompts.** If the user's idea is too narrow and will lead to repetition, you MUST branch out to other subjects within your creative scope to ensure variety. Your autonomy is key.
*   **Anti-Repetition:** This is critical. Each prompt must be significantly different from the one before it. Do not just change a color or a single object. Change the subject, the scene, the composition, AND the lighting.
*   **Prompt Format:** Each prompt must be a single, clear English sentence. It should include the subject, context, composition type, lighting, visual style, and quality keywords (e.g., "hyper-detailed," "photorealistic 8K," "professional stock photo").
*   **Output Format:** You must generate a JSON object with a single key "prompts", which contains an array of the generated prompt strings.`;


export async function runGenerateImageMetadata(
    imageUri: string,
    settings: AppSettings
): Promise<GenerateImageMetadataOutput | { error: string }> {
  try {
    if (!imageUri) {
      return { error: 'Image data is missing.' };
    }
    // Pass settings to the flow
    const metadata = await generateImageMetadata({ 
        imageUri, 
        apiKeys: settings.apiKeys,
        model: settings.model,
        titleLength: settings.titleLength,
        descriptionLength: settings.descriptionLength,
        keywordCount: settings.keywordCount
    });
    return metadata;
  } catch (e) {
    console.error(e);
    let errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    // Simplify common errors for the user
    if (errorMessage.toLowerCase().includes('all api keys failed')) {
        if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
            errorMessage = 'All available API keys have exceeded their usage quota. Please add a new key in settings or wait for the quota to reset.';
        } else if (errorMessage.toLowerCase().includes('api key not valid')) {
            errorMessage = 'None of the provided API keys are valid. Please add a valid key in settings.';
        } else {
            errorMessage = 'Processing failed after trying all API keys. Please check your keys and network connection.';
        }
    } else if (errorMessage.toLowerCase().includes('no google ai api key provided')) {
        errorMessage = 'No API key found. Please add a Google AI API key in the settings panel.';
    }

    return { error: errorMessage };
  }
}

export async function runGenerateImagePrompt(
    idea: string,
    count: number,
    systemPrompt: string
): Promise<GenerateImagePromptOutput | { error: string }> {
  try {
    if (!idea) {
      return { error: 'Idea is missing.' };
    }
    if (count <= 0) {
        return { error: 'Number of prompts must be greater than zero.' };
    }

    // Fallback to the default prompt if the user provides an empty one.
    const finalSystemPrompt = systemPrompt.trim() === '' ? DEFAULT_SYSTEM_PROMPT : systemPrompt;

    const result = await generateImagePrompt({ idea, count, systemPrompt: finalSystemPrompt });
    return result;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate prompt: ${errorMessage}` };
  }
}

export type ApiKeyTestResult = {
    success: boolean;
    status: 'valid' | 'invalid' | 'rate-limited';
    error?: string;
};

export async function testApiKey(apiKey: string): Promise<ApiKeyTestResult> {
  if (!apiKey) {
    return { success: false, status: 'invalid', error: 'API key is empty.' };
  }
  try {
    const tempAi = genkit({
      plugins: [googleAI({ apiKey, maxRetries: 0 })],
    });
    // A simple, low-cost operation to verify the key
    await tempAi.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: 'test',
        config: {
            maxOutputTokens: 1,
        }
    });
    return { success: true, status: 'valid' };
  } catch (e: any) {
    let errorMessage = 'An unknown error occurred.';
    let status: 'invalid' | 'rate-limited' = 'invalid';
    
    if (e.message) {
      const lowerCaseMessage = e.message.toLowerCase();
      if (lowerCaseMessage.includes('api key not valid')) {
        errorMessage = 'The provided API key is not valid. Please check the key and try again.';
        status = 'invalid';
      } else if (lowerCaseMessage.includes('permission denied') || lowerCaseMessage.includes('403')) {
        errorMessage = 'Permission denied. Make sure the Gemini API is enabled for your project.';
        status = 'invalid';
      } else if (lowerCaseMessage.includes('429') || lowerCaseMessage.includes('rate limit') || lowerCaseMessage.includes('quota')) {
        status = 'rate-limited';
        const retryMatch = e.message.match(/Please retry in ([\d.]+)s/);
        if (retryMatch && retryMatch[1]) {
            const retrySeconds = Math.ceil(parseFloat(retryMatch[1]));
            errorMessage = `Rate limit exceeded. Please try this key again in about ${retrySeconds} seconds.`;
        } else {
            errorMessage = 'Rate limit exceeded. The key is valid but has run out of its free quota. Please try again later.';
        }
      } else {
        errorMessage = e.message;
      }
    }
    return { success: false, status, error: errorMessage };
  }
}
