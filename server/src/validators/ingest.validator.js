import { z } from "zod";

export const ingestSchema = z.object({
  url: z
    .string({
      required_error: "Website URL is required.",
    })
    .trim()
    .url("Please provide a valid URL.")
    .refine(
      (url) => {
        const protocol = new URL(url).protocol;
        return protocol === "http:" || protocol === "https:";
      },
      {
        message: "Only HTTP and HTTPS URLs are allowed.",
      }
    ),
});