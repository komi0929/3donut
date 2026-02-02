import { GoogleGenAI } from "@google/genai";
import { BACKGROUND_PROMPT, getDonutPrompt } from "../constants";
import { DonutType } from "../types";

// Switched to Flash Image model for faster generation and fewer permission restrictions
const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateGameAssets = async (
  onProgress: (msg: string) => void
): Promise<Record<string, string>> => {
  // Initialize client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const assets: Record<string, string> = {};
  
  try {
    // 1. Generate Background
    onProgress("粘土の空を作っています... (Creating Sky)");
    const bgResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: BACKGROUND_PROMPT }],
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
          // imageSize is not supported in Flash Image model, so we remove it
        }
      }
    });

    for (const part of bgResponse.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
          assets['background'] = `data:image/png;base64,${part.inlineData.data}`;
       }
    }

    // 2. Generate Donuts
    const types = Object.values(DonutType);
    
    for (const type of types) {
      onProgress(`ドーナツを焼いています... (${type})`);
      const prompt = getDonutPrompt(type);
      
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            // imageSize removed
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
           assets[type] = `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    return assets;

  } catch (error) {
    console.error("Asset generation failed:", error);
    throw error;
  }
};