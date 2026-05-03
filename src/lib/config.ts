import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Config {
  sourceDir: string;
  vaultDir: string;
  subfolder: string;
  schedule: string;
}

function getProjectRoot(): string {
  return join(import.meta.dirname, "..", "..");
}

export function getConfigPath(): string {
  return join(getProjectRoot(), "config.json");
}

export function getManifestPath(): string {
  return join(getProjectRoot(), "manifest.json");
}

export function loadConfig(): Config {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    throw new Error(`No config found at ${configPath}. Run 'npm run install-tool' first.`);
  }

  const raw = readFileSync(configPath, "utf-8");
  const parsed = JSON.parse(raw);

  if (!parsed.sourceDir || !parsed.vaultDir || !parsed.subfolder || !parsed.schedule) {
    throw new Error("config.json is missing required fields (sourceDir, vaultDir, subfolder, schedule)");
  }

  return parsed as Config;
}

export function saveConfig(config: Config): void {
  const configPath = getConfigPath();
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}
