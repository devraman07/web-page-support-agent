import dotenv from "dotenv";
import { ChromaClient } from "chromadb";
dotenv.config();


export const dbClient = new ChromaClient({
    host : process.env.CHROMA_HOST,
    port : process.env.CHROMA_PORT,
    ssl : false,
});