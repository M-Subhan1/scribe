import { OpenAI } from "openai";
import { SupabaseClient } from "@supabase/supabase-js";
import { loadConfig } from "./utils";

const config = loadConfig();

export const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export const supabase = new SupabaseClient(
  config.supabaseProjectUrl,
  config.supabaseServiceRole,
);
