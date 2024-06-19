import { OpenAI } from "openai";
import { openai, supabase } from "../clients";

export async function uploadImageToSupabase(
  fileName: string,
  imageBuffer: Buffer,
) {
  const { data, error } = await supabase.storage
    .from("images")
    .upload(fileName, imageBuffer, { upsert: true, contentType: "image/png" });

  if (error) throw error;
  return data.path;
}

export async function getPublicImageUrl(path: string) {
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

export async function imageToTextCompletion(imageUrl: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.6,
    messages: generatePromptMessages(imageUrl),
    n: 1,
  });

  return completion;
}

const generatePromptMessages = (imageUrl: string) => {
  return [
    {
      role: "system",
      content: `You are an accurate ocr model. You will be provided an image of a textbook page. 
        Your job is to follow the follow instructions extremely carefully:
          - extract text from the image as accurately as possible, do not paraphrase the text or add any additional information
          - ensure all headings, subheadings, and paragraphs are correctly identified
          - add a new line after each paragraph, heading, or subheading
          - for equations, return the latex representation. Wrap latex in $$ 
          - for tables, return the table in markdown format that can be parsed using markdown-it
          - for charts, diagrams, or other non-text elements, leave a placeholder in the following format: [FIGURE: <chart-number>], leave spaces above and below the placeholder
          - do not return any images or diagrams, only text
          - ensure the text is legible and formatted correctly using markdown with proper spacing and indentation
      `,
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: imageUrl },
        },
      ],
    },
  ] as OpenAI.ChatCompletionMessageParam[];
};
