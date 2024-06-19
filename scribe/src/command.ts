import { Command } from "commander";
import { generateHandler, initHandler } from "./handler";

const program = new Command();

program
  .name("scribe")
  .description("CLI to generate word documents from pdf files")
  .version("0.0.1");

program
  .command("init")
  .description("Configure required environment variables")
  .action(initHandler);

program
  .command("generate <pdf>")
  .option("-o, --output-dir <output-dir>", "Output directory")
  .option("-r, --range <range>", "Page range to process")
  .description("Generate word document from pdf file")
  .action((filePath, { outputDir, range }) =>
    generateHandler(filePath, outputDir, range),
  );

program.parse();
