import { SYSTEM_INSTRUCTION } from "../constants";
import { FileSystemItem, AIConfig, AIResponseSchema } from "../types";

// Declare Puter global
declare const puter: any;

// Construct context from current files
const buildContext = (files: FileSystemItem[]) => {
  const fileContext = files
    .filter(f => f.type === 'file')
    .map(f => `--- FILE: ${f.name} ---\n${(f as any).content}\n--- END FILE ---`)
    .join('\n\n');
  return `CURRENT WORKSPACE STATE:\n${fileContext}`;
};

// Helper to extract JSON object from text (robust against markdown and chatter)
const extractJson = (text: string): string => {
  // Remove generic markdown code fences first
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
  
  // Locate the outer-most JSON object brackets
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    return cleaned.substring(firstOpen, lastClose + 1);
  }
  
  return cleaned.trim();
};

// --- Puter AI Implementation (Gemini + ChatGPT Free) ---
const callPuterAI = async (prompt: string, config: AIConfig): Promise<AIResponseSchema> => {
  if (typeof puter === 'undefined') {
    throw new Error("Puter.js failed to load. Please refresh the page.");
  }

  // Combine system instruction and prompt for Puter
  const fullPrompt = `SYSTEM INSTRUCTION:\n${SYSTEM_INSTRUCTION}\n\n${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema.`;

  const options: any = { 
    model: config.model 
  };

  // Special driver handling for specific models based on snippets
  if (config.model === 'gpt-5.2-pro') {
    options.driver = 'openrouter';
  }

  // We rely on Puter's non-streaming response
  const response = await puter.ai.chat(fullPrompt, options);

  // Normalize response to string
  let text = '';
  if (typeof response === 'string') {
    text = response;
  } else if (response && typeof response === 'object') {
     // Puter V2 chat response object usually has a toString() that returns the content
     text = response.toString();
     
     // Specific check if toString returned [object Object] which implies it didn't work as expected
     // This happens sometimes with certain models/drivers in Puter
     if (text === '[object Object]') {
         if (response.message && response.message.content) {
             text = response.message.content;
         } else if (response.content) {
             text = response.content;
         } else if (response.text) {
             text = response.text;
         } else {
             // Fallback: try to stringify the whole thing to find JSON inside
             text = JSON.stringify(response);
         }
     }
  }

  if (!text) throw new Error("No response content from Puter AI");
  
  const jsonString = extractJson(text);
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON Parse Error. Raw Text:", text);
    console.error("Extracted JSON String:", jsonString);
    throw new Error(`AI returned invalid JSON. Raw output logged to console.`);
  }
};

// --- Generic OpenAI Compatible Implementation (OpenAI, DeepSeek, Grok) ---
const callOpenAICompatible = async (prompt: string, config: AIConfig, baseUrl: string): Promise<AIResponseSchema> => {
  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    { role: "user", content: prompt }
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages,
      response_format: { type: "json_object" } // Force JSON mode
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) throw new Error("No content received from API");

  // Also use extractJson here to be safe against provider quirks
  const jsonString = extractJson(content);

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON from AI:", content);
    throw new Error("AI returned invalid JSON format.");
  }
};

export const generateCodeChanges = async (
  userPrompt: string,
  currentFiles: FileSystemItem[],
  config: AIConfig
) => {
  // Only require API key if NOT using Puter (Gemini or ChatGPT Puter)
  const isPuter = config.provider === 'gemini' || config.provider === 'chatgpt_puter';
  if (!isPuter && !config.apiKey) {
    throw new Error(`API Key is missing for ${config.provider}.`);
  }

  const context = buildContext(currentFiles);
  const prompt = `${context}\n\nUSER REQUEST: ${userPrompt}`;

  try {
    switch (config.provider) {
      case 'gemini':
      case 'chatgpt_puter':
        return await callPuterAI(prompt, config);
      case 'openai':
        return await callOpenAICompatible(prompt, config, 'https://api.openai.com/v1');
      case 'deepseek':
        return await callOpenAICompatible(prompt, config, 'https://api.deepseek.com');
      case 'grok':
        return await callOpenAICompatible(prompt, config, 'https://api.x.ai/v1');
      default:
        throw new Error("Unsupported provider");
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};