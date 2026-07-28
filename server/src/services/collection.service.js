import { dbClient } from "../config/chroma.js";

const COLLECTION_NAME = "WEB_SCRAPED_DATA_COLLECTION-1";

const customEmbedder = {
  generate: async () => {
    throw new Error(
      "Embedding function should not be invoked directly."
    );
  },
};

export async function getCollection() {
  return await dbClient.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: customEmbedder,
  });
}

export async function createCollection() {
  return await dbClient.createCollection({
    name: COLLECTION_NAME,
    embeddingFunction: customEmbedder,
  });
}

export async function deleteCollection() {
  try {
    await dbClient.deleteCollection({
      name: COLLECTION_NAME,
    });

    return true;
  } catch (error) {
    console.error("Failed to delete collection:", error.message);
    return false;
  }
}

export async function addDocument({
  id,
  embedding,
  metadata,
}) {
  const collection = await getCollection();

  await collection.add({
    ids: [id],
    embeddings: [embedding],
    metadatas: [metadata],
  });
}

export async function queryDocuments({
  embedding,
  limit = 3,
}) {
  const collection = await getCollection();

  return await collection.query({
    queryEmbeddings: [embedding],
    nResults: limit,
    include: [
      "metadatas",
      "distances",
    ],
  });
}