#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_NAME = "@0xsero/open-queue";

const cwd = process.cwd();
const configPaths = [
  join(cwd, "opencode.json"),
  join(cwd, "opencode.jsonc"),
  join(cwd, ".opencode", "opencode.json"),
  join(cwd, ".opencode", "opencode.jsonc"),
];

function findConfig() {
  for (const p of configPaths) {
    if (existsSync(p)) return p;
  }
  return null;
}

function parseJsonc(content) {
  // Strip comments for parsing
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*/g, "");
  return JSON.parse(stripped);
}

function main() {
  console.log(`\n  Installing ${PLUGIN_NAME}...\n`);

  // Find or create config
  let configPath = findConfig();
  let config = { plugin: [] };

  if (configPath) {
    console.log(`  Found config: ${configPath}`);
    const content = readFileSync(configPath, "utf-8");
    try {
      config = parseJsonc(content);
    } catch {
      console.error(`  Error parsing config. Please add manually:\n`);
      console.log(`    "plugin": ["${PLUGIN_NAME}"]`);
      process.exit(1);
    }
  } else {
    configPath = join(cwd, "opencode.json");
    console.log(`  Creating config: ${configPath}`);
  }

  // Add plugin if not present
  if (!config.plugin) config.plugin = [];
  if (!config.plugin.includes(PLUGIN_NAME)) {
    config.plugin.push(PLUGIN_NAME);
    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    console.log(`  Added ${PLUGIN_NAME} to plugins`);
  } else {
    console.log(`  Plugin already installed`);
  }

  // Copy slash command
  const commandDir = join(cwd, ".opencode", "command");
  const commandSrc = join(__dirname, "..", "command", "queue.md");
  const commandDst = join(commandDir, "queue.md");

  if (existsSync(commandSrc)) {
    mkdirSync(commandDir, { recursive: true });
    copyFileSync(commandSrc, commandDst);
    console.log(`  Copied /queue command to ${commandDst}`);
  }

  console.log(`\n  Done! Run 'opencode' to start.\n`);
  console.log(`  Usage:`);
  console.log(`    /queue hold       - Queue messages until model is done`);
  console.log(`    /queue immediate  - Send immediately (default)`);
  console.log(`    /queue status     - Check current mode\n`);
}

main();
