import { chatclient } from "../config/gemini.js";

export async function generateEmbeddings(text) {
  if (!text) {
    throw new Error("Text is required to generate embeddings.");
  }

  const response = await chatclient.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
  });

  return response.embeddings[0].values;
}