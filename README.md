# ingest_to_obsidian

A small Node.js tool that copies files from a source directory into an Obsidian vault subfolder on a daily schedule. It tracks what it has already ingested via a manifest, so re-runs only copy new or changed files.

## Requirements

- Node.js 22+ (uses `import.meta.dirname`)
- npm
- One of: Linux, macOS, WSL (cron), or Windows (`schtasks`)

## Install

```bash
npm install
npm run install-tool
```

`install-tool` builds the TypeScript and then walks you through an interactive setup:

1. **Source directory** — where files to ingest live. Created on confirm if missing.
2. **Obsidian vault directory** — must already exist.
3. **Subfolder within vault** — defaults to `Inbox`. Created if missing.
4. **Daily run time** — `HH:MM` 24h, defaults to `06:00`.
5. **Set up scheduled task?** — installs a cron entry (Linux/macOS/WSL) or a `schtasks` job named `IngestToObsidian` (Windows).
6. **Run initial ingestion now?** — optional first pass.

The answers are written to `config.json` in the project root.

## Usage

After setup, the scheduler runs ingestion automatically each day. To run manually:

```bash
npm run ingest
```

Each run:

- lists files (non-recursive) in `sourceDir`
- skips any file whose size + mtime + hash match the manifest entry
- copies new or changed files into `<vaultDir>/<subfolder>`
- appends a timestamp to the filename if a name collision exists in the destination
- updates `manifest.json` and prints a summary

Logs from scheduled runs go to `ingest.log` in the project root (Unix scheduler only).

## Files

- `config.json` — saved settings from `install-tool`
- `manifest.json` — record of ingested files (hash, size, mtime, ingestedAt)
- `ingest.log` — scheduled run output (Unix)

## Reconfiguring

Re-run `npm run install-tool` to overwrite `config.json` and reinstall the schedule. Existing entries are replaced, not duplicated.

## Uninstall the schedule

The cron entry is tagged with `# ingest_to_obsidian`; remove it with `crontab -e`. On Windows: `schtasks /delete /tn "IngestToObsidian" /f`.
