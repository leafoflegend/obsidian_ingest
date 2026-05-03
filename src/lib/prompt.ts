import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

let rl: ReturnType<typeof createInterface> | null = null;

function getRL() {
  if (!rl) {
    rl = createInterface({ input: stdin, output: stdout });
  }
  return rl;
}

export async function ask(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await getRL().question(`${question}${suffix}: `);
  return answer.trim() || defaultValue || "";
}

// Users often wrap paths with spaces in quotes; the readline prompt preserves
// those quotes verbatim, so strip a matching surrounding pair before use.
export async function askPath(question: string, defaultValue?: string): Promise<string> {
  return stripSurroundingQuotes(await ask(question, defaultValue));
}

function stripSurroundingQuotes(input: string): string {
  if (input.length < 2) return input;
  const first = input[0];
  const last = input[input.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return input.slice(1, -1);
  }
  return input;
}

export async function confirm(question: string): Promise<boolean> {
  const answer = await getRL().question(`${question} (y/n): `);
  return answer.trim().toLowerCase().startsWith("y");
}

export function closePrompt(): void {
  if (rl) {
    rl.close();
    rl = null;
  }
}
