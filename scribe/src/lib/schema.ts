import { z } from "zod";

export const openAIKeySchema = z.string().min(1);
export const supabaseProjectUrlSchema = z.string().url();
export const supabaseServiceRoleSchema = z.string().min(1);

export const configSchema = z.object({
  openaiApiKey: openAIKeySchema,
  supabaseProjectUrl: supabaseProjectUrlSchema,
  supabaseServiceRole: supabaseServiceRoleSchema,
});
