import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import openai from "openai";
import { ChromaClient } from "chromadb";
dotenv.config();

const client = new openai();
const chromaClient = new ChromaClient({
  path: "http://localhost:8000",
});

async function main() {
  const collection = await chromaClient.getOrCreateCollection({
    name: "my_knowledge_base",
  });
}

async function scrapwebpage(url = "") {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle0" });

  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);

  const pageHead = $("head").html();
  const pageBody = $("body").html();

  const internalLinks = [];
  const externalLinks = [];

  $("a").each((_, el) => {
    const link = $(el).attr("href");
    if (link === "/") return;
    if (link.startsWith("http") || link.startsWith("https")) {
      externalLinks.push(link);
    } else {
      internalLinks.push(link);
    }
  });

  return { head: pageHead, body: pageBody, externalLinks, internalLinks };
}

async function generateVectorEmbeddings({ text }) {
  const embeddings = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: JSON.stringify(text),
    encoding_format: "float",
  });
  return embeddings.data[0].embedding;
}
function chunkText({ text, chunkSize }) {
  if (!text || chunkSize <= 0) {
    return [];
  }

  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  return chunks;
}

async function ingest(url = "") {
  const { head, body, internalLinks, externalLinks } = await scrapwebpage(url);
  const headEmbeddings = await generateVectorEmbeddings({ text: head });
  const bodyChunks = chunkText(body, 2000);
  for (chunk of bodyChunks) {
    const bodyEmbeddings = await generateVectorEmbeddings({ text: chunk });
  }
}


main().catch(console.error);