import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "./lib/config.js";
import { loadManifest, saveManifest, needsIngestion } from "./lib/manifest.js";
import { copyFileToVault } from "./lib/copy.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const manifest = loadManifest();

  const entries = readdirSync(config.sourceDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => join(config.sourceDir, e.name));

  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for (const filePath of files) {
    try {
      const existing = manifest.entries[filePath];
      const { needed, hash } = await needsIngestion(filePath, existing);

      if (!needed) {
        skipped++;
        continue;
      }

      const destPath = copyFileToVault(filePath, config.vaultDir, config.subfolder);
      const stat = statSync(filePath);

      manifest.entries[filePath] = {
        hash,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        ingestedAt: new Date().toISOString(),
      };

      copied++;
      console.log(`Copied: ${filePath} -> ${destPath}`);
    } catch (err) {
      failed++;
      console.error(`Failed: ${filePath} -- ${err instanceof Error ? err.message : err}`);
    }
  }

  saveManifest(manifest);

  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Ingestion complete: ${copied} copied, ${skipped} skipped, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
