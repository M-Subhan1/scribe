import fs from "fs";
import os from "os";
import path from "path";
import { configSchema } from "./schema";

const configPath = path.join(os.homedir(), ".scribe");

export function loadConfig() {
  if (!fs.existsSync(configPath)) {
    console.log("Config file not found. Try running `scribe init`.");
    process.exit(1);
  }

  try {
    const rawData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return configSchema.parse(rawData);
  } catch (error) {
    console.log("Error parsing config file. Try running `scribe init`.");
    process.exit(1);
  }
}

export function saveConfig(data: Record<string, string>) {
  try {
    configSchema.parse(data);
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
