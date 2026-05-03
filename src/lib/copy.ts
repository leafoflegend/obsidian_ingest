import { existsSync, cpSync, mkdirSync } from "node:fs";
import { join, basename, extname } from "node:path";

/**
 * Resolves a conflict by appending a timestamp to the filename.
 * e.g. "notes.pdf" -> "notes-2026-05-03T060000.pdf"
 */
function resolveConflict(destPath: string): string {
  const dir = join(destPath, "..");
  const ext = extname(destPath);
  const base = basename(destPath, ext);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  return join(dir, `${base}-${timestamp}${ext}`);
}

/**
 * Copies a file from source to the vault subfolder.
 * Handles filename conflicts by appending a timestamp.
 * Returns the final destination path.
 */
export function copyFileToVault(
  sourcePath: string,
  vaultDir: string,
  subfolder: string
): string {
  const destDir = join(vaultDir, subfolder);
  mkdirSync(destDir, { recursive: true });

  let destPath = join(destDir, basename(sourcePath));

  if (existsSync(destPath)) {
    destPath = resolveConflict(destPath);
  }

  cpSync(sourcePath, destPath);
  return destPath;
}
