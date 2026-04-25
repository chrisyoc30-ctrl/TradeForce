import { readFile } from "fs/promises";
import path from "path";

export async function readPublicMarkdown(filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), "public", filename);
  return readFile(filePath, "utf8");
}
