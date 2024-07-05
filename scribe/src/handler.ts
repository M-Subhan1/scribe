import fs from "fs";
import path from "path";
import prompts from "prompts";
import markdown from "remark-parse";
import math from "remark-math";
import docx, { type DocxOptions } from "remark-docx";
import gfm from "remark-gfm";
import cliProgress from "cli-progress";
import colors from "ansi-colors";
import sharp from "sharp";
import promiseRetry from "promise-retry";
import { unified } from "unified";

import { questions } from "./lib/questions";
import { saveConfig } from "./lib/utils";
import { pdfToImage } from "./lib/core/pdf-to-image";
import { imageToTextCompletion } from "./lib/core/image-to-text";

const mdProcessor = unified()
  .use(markdown)
  .use(gfm)
  .use(math)
  .use(docx, { output: "buffer", imageResolver: fetchImage } as DocxOptions);

async function fetchImage(
  url: string,
): Promise<{ image: ArrayBuffer; width: number; height: number }> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const image = sharp(buf);

  return new Promise((resolve, reject) => {
    image.metadata((err, metadata) => {
      if (err) reject(err);
      resolve({ image: buf, width: metadata.width!, height: metadata.height! });
    });
  });
}

export async function initHandler() {
  const response = await prompts(questions);
  saveConfig(response);
}

export async function generateHandler(
  filePath: string,
  outputDir: string | undefined,
  range: string | undefined,
) {
  outputDir = path.resolve(outputDir || process.cwd().toString());
  filePath = path.resolve(filePath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // create tasks to read all images from the pdf
  const readImageTasks = await pdfToImage(filePath, outputDir);
  // create tasks to convert images to text
  const imageToTextTasks = readImageTasks.map((readImage) => {
    return async () => {
      const { buffer } = await readImage();

      if (!buffer) {
        throw new Error("Failed to read image");
      }

      const base64Image = buffer.toString("base64");

      const content = await promiseRetry(async (retry, attempt) => {
        const completion = await imageToTextCompletion(
          `data:image/jpeg;base64,${base64Image}`,
        ).catch((error) => attempt < 3 && retry(error));

        if (!completion) {
          throw new Error("Failed to get completion");
        }

        const content = completion.choices[0].message.content;

        if (!content) {
          throw new Error("Failed to get content");
        }

        return content;
      });

      return content;
    };
  });

  // process the tasks in batches
  const startPage = range ? Math.max(parseInt(range.split("-")[0]), 1) : 1;
  const endPage = range ? parseInt(range.split("-")[1]) : Infinity;
  const batchSize = 40;
  const results: string[] = [];
  for (
    let i = Math.max(startPage - 1, 0);
    i < Math.min(endPage, imageToTextTasks.length);
    i += batchSize
  ) {
    const end = Math.min(i + batchSize, endPage);
    const batch = imageToTextTasks.slice(i, end);

    const bar = new cliProgress.SingleBar({
      clearOnComplete: true,
      format: `${colors.cyan("{bar}")} | Pages ${i + 1}-${end} | {percentage}%`,
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    });

    bar.start(100, 0);

    const batchResults = await Promise.all(
      batch.map((task) =>
        task().then((result) => {
          bar.increment(100 / batch.length);
          return result;
        }),
      ),
    );

    bar.stop();
    results.push(...batchResults);
  }

  const removeMarkdownWrapper = (text: string) => {
    return text.replace(/```markdown/, "").replace(/```/, "");
  };

  const markdown = results.map(removeMarkdownWrapper).join("\n");
  const doc = await mdProcessor.process(markdown);
  const buffer = (await doc.result) as Buffer;

  fs.writeFileSync(
    path.resolve(path.basename(filePath, ".pdf") + ".docx"),
    buffer,
  );
}
