

export function buildSupportPrompt({ question, metadata }) {
  const urls = metadata.map((m) => m.url).join("\n");

  const context = metadata
    .map((m) => m.body)
    .join("\n\n");

  return `
You are a professional AI customer support assistant.

Answer ONLY using the provided context.

If the answer cannot be found, reply:

"I couldn't find that information on this website."

Website URLs:
${urls}

Context:
${context}

Question:
${question}
`;
}