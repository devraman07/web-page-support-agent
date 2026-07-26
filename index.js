import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { GoogleGenAI } from "@google/genai";
import { ChromaClient } from "chromadb";
dotenv.config();

const client = new GoogleGenAI({});

const chromaClient = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

const WEB_COLLECTION = "WEB_SCRAPED_DATA_COLLECTION-1";

const visitedUrls = new Set();

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
    });
  }

  return browser;
}

async function scrapwebpage(url) {
  const browser = await getBrowser();

  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  const data = await page.evaluate(() => {
    const internalLinks = [];
    const externalLinks = [];

    document.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href");

      if (!href) return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:")) return;
      if (href.startsWith("tel:")) return;

      if (href.startsWith("http://") || href.startsWith("https://")) {
        externalLinks.push(href);
      } else {
        internalLinks.push(href);
      }
    });

    return {
      title: document.title,
      description:
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") || "",
      head: document.head.innerHTML,
      body: document.body.innerText,
      internalLinks,
      externalLinks,
    };
  });

  await page.close();

  return data;
}

async function generateVectorEmbeddings({ text }) {
  const response = await client.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
  });

  return response.embeddings[0].values;
}

function chunkText({ text, chunkSize = 300 }) {
  if (!text) return [];

  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  return chunks;
}

const customEmbedder = {
  generate: async () => {
    throw new Error("Embedding function should not be invoked directly.");
  },
};

let collection;

async function initCollection() {
  collection = await chromaClient.getOrCreateCollection({
    name: WEB_COLLECTION,
    embeddingFunction: customEmbedder,
  });
}

async function addToCollection({
  id,
  embedding,
  url,
  title,
  description,
  head,
  body,
}) {
  await collection.add({
    ids: [id],
    embeddings: [embedding],
    metadatas: [
      {
        url,
        title,
        description,
        head,
        body,
      },
    ],
  });
}

async function ingest(url) {
  if (visitedUrls.has(url)) return;

  visitedUrls.add(url);

  console.log(`Ingesting ${url}`);

  try {
    const { title, description, head, body, internalLinks } =
      await scrapwebpage(url);

    const chunks = chunkText({
      text: body,
      chunkSize: 300,
    });

    let index = 0;

    for (const chunk of chunks) {
      const embedding = await generateVectorEmbeddings({
        text: chunk,
      });
      console.log(
        `  Chunk ${index}: "${chunk.slice(0, 80)}..." (embedding dim: ${embedding.length})`,
      );

      await addToCollection({
        id: `${url}-${index}`,
        embedding,
        url,
        title,
        description,
        head,
        body: chunk,
      });

      index++;
    }
    console.log(`  Title: ${title}`);
    console.log(`  Description: ${description}`);
    console.log(`  Body length: ${body.length} chars`);
    console.log(`  Internal links found: ${internalLinks.length}`);

    for (const link of internalLinks) {
      try {
        const nextUrl = new URL(link, url).href;

        if (nextUrl.startsWith(new URL(url).origin)) {
          await ingest(nextUrl);
        }
      } catch (err) {}
    }

    console.log(`Finished ${url}`);
  } catch (err) {
    console.error(`Failed: ${url}`);
    console.error(err.message);
  }
}

async function chat(question) {
  const questionEmbedding = await generateVectorEmbeddings({ text: question });

  const collectionRes = await collection.query({
    nResults: 3,
    queryEmbeddings: [questionEmbedding],
    include: ["metadatas", "documents", "distances"],
  });

  const body = collectionRes.metadatas[0].map((e) => e.body);
  const head = collectionRes.metadatas[0].map((e) => e.head);
  const urls = collectionRes.metadatas[0].map((e) => e.url);

  const prompt = `
You are a professional AI customer support assistant for this website.

Instructions:
- Answer ONLY using the provided website context.
- Do not make up information.
- If the answer is not found in the context, say:
  "I couldn't find that information on this website."
- Be concise and helpful.
- Format the response using Markdown when appropriate.

Website URL:
${urls.join("\n")}

Retrieved Context:
${body.join("\n\n")}

User Question:
${question}
`;

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
  });

  const answer = response.text;
  console.log(answer);
}

(async () => {
  try {
    await initCollection();

    await chromaClient.deleteCollection({ name: WEB_COLLECTION });
    await initCollection();

    await ingest("https://raman-dev007.vercel.app/");
    await chat("how can i contact you?");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
