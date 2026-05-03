import { readFileSync } from "node:fs";

export type Platform = "linux" | "macos" | "wsl" | "windows";

export function detectPlatform(): Platform {
  if (process.platform === "win32") {
    return "windows";
  }

  if (process.platform === "darwin") {
    return "macos";
  }

  // Distinguish Linux from WSL
  try {
    const procVersion = readFileSync("/proc/version", "utf-8");
    if (procVersion.toLowerCase().includes("microsoft")) {
      return "wsl";
    }
  } catch {
    // /proc/version not readable -- assume plain Linux
  }

  return "linux";
}
