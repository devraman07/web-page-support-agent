import dotenv  from "dotenv";

import {z} from 'zod';


dotenv.config();

const envSchema = z.object({
    GEMINI_API_KEY : z.string().min(1, "gemini_api_key is required"),
    PORT : z.coerce.number().default(3000),
    CHROMA_HOST : z.string().default("localhost"),
    CHROMA_PORT : z.coerce.number().default(8000)
});


const parsed = envSchema.safeParse(process.env);

if(!parsed.success) {
    console.error("invalid ennviourment variables");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
