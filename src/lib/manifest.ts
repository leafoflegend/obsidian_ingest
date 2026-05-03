import { readFileSync, writeFileSync, statSync, createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { getManifestPath } from "./config.js";

export interface ManifestEntry {
  hash: string;
  size: number;
  mtime: string;
  ingestedAt: string;
}

export interface Manifest {
  version: number;
  entries: Record<string, ManifestEntry>;
}

export function loadManifest(): Manifest {
  const manifestPath = getManifestPath();
  try {
    const raw = readFileSync(manifestPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.version === 1 && parsed.entries) {
      return parsed as Manifest;
    }
  } catch {
    // File doesn't exist or is corrupt -- start fresh
  }
  return { version: 1, entries: {} };
}

export function saveManifest(manifest: Manifest): void {
  const manifestPath = getManifestPath();
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
}

export function computeHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Determines if a file needs to be ingested.
 * Fast-path: if size+mtime match the manifest entry, skip hashing.
 * Returns the hash if ingestion is needed.
 */
export async function needsIngestion(
  filePath: string,
  existingEntry: ManifestEntry | undefined
): Promise<{ needed: boolean; hash: string }> {
  const stat = statSync(filePath);
  const size = stat.size;
  const mtime = stat.mtime.toISOString();

  // Fast path: size+mtime unchanged means file hasn't been modified
  if (existingEntry && existingEntry.size === size && existingEntry.mtime === mtime) {
    return { needed: false, hash: existingEntry.hash };
  }

  // Compute hash to check for actual content change
  const hash = await computeHash(filePath);

  if (existingEntry && existingEntry.hash === hash) {
    // Content is the same even though mtime changed (e.g. file was touched)
    return { needed: false, hash };
  }

  return { needed: true, hash };
}
