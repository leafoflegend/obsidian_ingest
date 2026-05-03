import { execSync } from "node:child_process";
import { join } from "node:path";
import { detectPlatform } from "./platform.js";

const JOB_MARKER = "# ingest_to_obsidian";

function getScriptPath(): string {
  return join(import.meta.dirname, "..", "ingest.js");
}

function getLogPath(): string {
  return join(import.meta.dirname, "..", "..", "ingest.log");
}

function parseCronTime(schedule: string): { hour: string; minute: string } {
  // Expects "HH:MM" format
  const [hour, minute] = schedule.split(":");
  return { hour: hour || "6", minute: minute || "0" };
}

function buildCronExpression(schedule: string): string {
  const { hour, minute } = parseCronTime(schedule);
  return `${minute} ${hour} * * *`;
}

function installCrontab(schedule: string): void {
  const cronExpr = buildCronExpression(schedule);
  const scriptPath = getScriptPath();
  const logPath = getLogPath();
  const cronLine = `${cronExpr} /usr/bin/env node ${scriptPath} >> ${logPath} 2>&1 ${JOB_MARKER}`;

  // Read existing crontab, remove any previous entry for this tool
  let existing = "";
  try {
    existing = execSync("crontab -l 2>/dev/null", { encoding: "utf-8" });
  } catch {
    // No existing crontab
  }

  const lines = existing.split("\n").filter((line) => !line.includes(JOB_MARKER));
  lines.push(cronLine);

  const newCrontab = lines.filter((l) => l.trim() !== "").join("\n") + "\n";
  execSync(`echo '${newCrontab.replace(/'/g, "'\\''")}' | crontab -`, { encoding: "utf-8" });
}

function installSchtasks(schedule: string): void {
  const { hour, minute } = parseCronTime(schedule);
  const scriptPath = getScriptPath();
  const timeStr = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

  execSync(
    `schtasks /create /f /tn "IngestToObsidian" /tr "node \\"${scriptPath}\\"" /sc daily /st ${timeStr}`,
    { encoding: "utf-8" }
  );
}

export function installSchedule(schedule: string): void {
  const platform = detectPlatform();

  switch (platform) {
    case "linux":
    case "macos":
    case "wsl":
      installCrontab(schedule);
      console.log(`Cron job installed (${buildCronExpression(schedule)})`);
      break;
    case "windows":
      installSchtasks(schedule);
      console.log(`Windows scheduled task "IngestToObsidian" created`);
      break;
  }
}

export function uninstallSchedule(): void {
  const platform = detectPlatform();

  switch (platform) {
    case "linux":
    case "macos":
    case "wsl": {
      let existing = "";
      try {
        existing = execSync("crontab -l 2>/dev/null", { encoding: "utf-8" });
      } catch {
        return;
      }
      const lines = existing.split("\n").filter((line) => !line.includes(JOB_MARKER));
      const newCrontab = lines.filter((l) => l.trim() !== "").join("\n") + "\n";
      execSync(`echo '${newCrontab.replace(/'/g, "'\\''")}' | crontab -`, { encoding: "utf-8" });
      console.log("Cron job removed.");
      break;
    }
    case "windows":
      try {
        execSync('schtasks /delete /tn "IngestToObsidian" /f', { encoding: "utf-8" });
        console.log("Windows scheduled task removed.");
      } catch {
        // Task didn't exist
      }
      break;
  }
}
