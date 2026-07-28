

import { z } from "zod";

export const chatSchema = z.object({
  question: z
    .string({
      required_error: "Question is required.",
    })
    .trim()
    .min(1, "Question cannot be empty.")
    .max(1000, "Question is too long."),
});