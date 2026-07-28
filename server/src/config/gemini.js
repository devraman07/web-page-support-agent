import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";

export const chatclient = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});