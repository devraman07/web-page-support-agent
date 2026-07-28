import { chatclient } from "../config/gemini.js";
import { generateEmbeddings } from "./embeddings.service.js";
import { queryDocuments } from "./collection.service.js";
import { buildSupportPrompt } from "../prompts/support.prompt.js";

export async function chat(question) {
  const embedding = await generateEmbeddings(question);

  const results = await queryDocuments({
    embedding,
    limit: 3,
  });

  const metadata = results.metadatas?.[0] ?? [];

  const prompt = buildSupportPrompt({
    question,
    metadata,
  });

  const response = await chatclient.models.generateContent({
    model : "gemini-3.5-flash",
    contents: prompt,
  });

  return response.text;
}