import { scrapeWebpage } from "./crawler.service.js";
import { generateEmbeddings } from "./embeddings.service.js";
import { addDocument } from "./collection.service.js";
import { chunkText } from "../utils/chunker.js";

const visitedUrls = new Set();

export async function ingestWebsite(url) {
  visitedUrls.clear();
  await ingest(url);
}

async function ingest(url) {
  if (visitedUrls.has(url)) {
    return;
  }

  visitedUrls.add(url);

  console.log(`📄 Ingesting: ${url}`);

  try {
    const pageData = await scrapeWebpage(url);

    const { title, description } = pageData.metadata;
    const { head, body } = pageData.content;
    const { internalLinks } = pageData.links;

    const chunks = chunkText({
      text: body,
      chunkSize: 300,
    });

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];

      const embedding = await generateEmbeddings(chunk);

      await addDocument({
        id: `${url}-${index}`,
        embedding,
        metadata: {
          url,
          title,
          description,
          head,
          body: chunk,
        },
      });

      console.log(
        `✅ Stored Chunk ${index + 1}/${chunks.length}`
      );
    }

    console.log(`✔ Finished ${url}`);

    const origin = new URL(url).origin;

    for (const link of internalLinks) {
      try {
        const nextUrl = new URL(link, origin).href;

        if (
          nextUrl.startsWith(origin) &&
          !visitedUrls.has(nextUrl)
        ) {
          await ingest(nextUrl);
        }
      } catch {
        console.warn(`⚠️ Invalid URL skipped: ${link}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to ingest ${url}`);
    console.error(error);
  }
}