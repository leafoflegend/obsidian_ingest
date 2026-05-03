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
