import { existsSync, mkdirSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { saveConfig } from "./lib/config.js";
import { detectPlatform } from "./lib/platform.js";
import { installSchedule } from "./lib/scheduler.js";
import { ask, askPath, confirm, closePrompt } from "./lib/prompt.js";

async function main(): Promise<void> {
  console.log("=== Ingest to Obsidian - Setup ===\n");
  console.log(`Detected platform: ${detectPlatform()}\n`);

  // Source directory
  let sourceDir = "";
  while (true) {
    sourceDir = await askPath("Source directory to ingest files from (absolute path)");
    if (!sourceDir) {
      console.log("  Please provide a path.");
      continue;
    }
    if (!isAbsolute(sourceDir)) {
      console.log(`  Path must be absolute: ${sourceDir}`);
      continue;
    }
    if (!existsSync(sourceDir)) {
      console.log(`  Directory does not exist: ${sourceDir}`);
      if (await confirm("  Create it?")) {
        mkdirSync(sourceDir, { recursive: true });
        break;
      }
      continue;
    }
    break;
  }

  // Vault directory
  let vaultDir = "";
  while (true) {
    vaultDir = await askPath("Obsidian vault directory (absolute path)");
    if (!vaultDir) {
      console.log("  Please provide a path.");
      continue;
    }
    if (!isAbsolute(vaultDir)) {
      console.log(`  Path must be absolute: ${vaultDir}`);
      continue;
    }
    if (!existsSync(vaultDir)) {
      console.log(`  Directory does not exist: ${vaultDir}`);
      continue;
    }
    break;
  }

  // Subfolder (relative to vault — quotes stripped in case the user wrapped it)
  const subfolder = await askPath("Subfolder within vault for ingested files", "Inbox");

  // Create subfolder if needed
  const destDir = resolve(vaultDir, subfolder);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
    console.log(`  Created: ${destDir}`);
  }

  // Schedule time
  const schedule = await ask("Daily run time (HH:MM, 24h format)", "06:00");

  // Validate time format
  if (!/^\d{1,2}:\d{2}$/.test(schedule)) {
    console.log("  Invalid time format. Using default 06:00.");
  }

  // Save config
  const config = { sourceDir, vaultDir, subfolder, schedule };
  saveConfig(config);
  console.log("\nConfiguration saved.\n");

  // Install scheduler
  if (await confirm("Set up daily scheduled task?")) {
    try {
      installSchedule(schedule);
    } catch (err) {
      console.error(`  Failed to install schedule: ${err instanceof Error ? err.message : err}`);
      console.log("  You can manually add a cron job to run: node dist/ingest.js");
    }
  }

  // Offer initial run
  if (await confirm("\nRun initial ingestion now?")) {
    closePrompt();
    await import("./ingest.js");
  } else {
    closePrompt();
  }

  console.log("\nSetup complete! Files will be ingested daily from:");
  console.log(`  ${sourceDir} -> ${vaultDir}/${subfolder}`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  closePrompt();
  process.exit(1);
});
