import fs from "fs";
import { fromPath } from "pdf2pic";
import { PDFDocument } from "pdf-lib";

export async function pdfToImage(filePath: string, outputDir: string) {
  const saveFilename = filePath.split("/").pop()?.split(".")[0];
  const options = {
    density: 100,
    saveFilename,
    savePath: outputDir,
    format: "png",
    width: 827,
    preserveAspectRatio: true,
  };

  const pdfFile = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfFile);
  const numPages = pdfDoc.getPageCount();
  const convert = fromPath(filePath, options);

  return Array.from({ length: numPages }, (_, i) => {
    return () => convert(i + 1, { responseType: "buffer" });
  });
}
