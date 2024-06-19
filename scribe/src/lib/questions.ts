import { z } from "zod";
import type { PromptObject } from "prompts";
import { openAIKeySchema, supabaseServiceRoleSchema } from "./schema";

export const questions: PromptObject<string>[] = [
  {
    type: "text",
    name: "openaiApiKey",
    message: "Enter your OpenAI API key",
    validate: (value) => {
      try {
        z.string().min(1).parse(value);
        return true;
      } catch (error) {
        return "OpenAI API key is required";
      }
    },
  },
  {
    type: "text",
    name: "supabaseProjectUrl",
    message: "Enter your Supabase project URL",
    validate: (value) => {
      try {
        openAIKeySchema.parse(value);
        return true;
      } catch (error) {
        return value
          ? "Enter a valid project URL"
          : "Supabase project URL is required";
      }
    },
  },
  {
    type: "text",
    name: "supabaseServiceRole",
    message: "Enter your Supabase service role key",
    validate: (value) => {
      try {
        supabaseServiceRoleSchema.parse(value);
        return true;
      } catch (error) {
        return "Supabase Service Role key is required";
      }
    },
  },
];
