
import { GoogleGenAI } from "@google/genai";

export const suggestFilename = async (images: { data: string, mimeType: string }[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We only send the first image to save tokens and for quick analysis
    const parts = [
      { text: "Look at this image and suggest a professional, concise filename (maximum 4 words) for a PDF document containing such content. Return ONLY the suggested filename without extension." },
      { inlineData: images[0] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
    });

    return response.text?.trim().replace(/\s+/g, '_').toLowerCase() || 'my_document';
  } catch (error) {
    console.error("AI Naming error:", error);
    return 'my_document';
  }
};
