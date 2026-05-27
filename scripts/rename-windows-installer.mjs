import { existsSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const targetName = "SuperTerminal-v0.1.0-alpha-windows_x64-setup.exe";
const nsisDir = join(process.cwd(), "src-tauri", "target", "release", "bundle", "nsis");

if (!existsSync(nsisDir)) {
  console.log("No Windows NSIS bundle directory found; skipping installer rename.");
  process.exit(0);
}

const installers = readdirSync(nsisDir)
  .filter((name) => name.toLowerCase().endsWith(".exe"))
  .map((name) => {
    const path = join(nsisDir, name);
    return { name, path, mtimeMs: statSync(path).mtimeMs };
  })
  .sort((a, b) => b.mtimeMs - a.mtimeMs);

if (installers.length === 0) {
  console.log("No Windows NSIS installer found; skipping installer rename.");
  process.exit(0);
}

const targetPath = join(nsisDir, targetName);
const source = installers.find((installer) => installer.name !== targetName) ?? installers[0];

if (source.path === targetPath) {
  console.log(`Windows installer already named ${targetName}.`);
  process.exit(0);
}

if (existsSync(targetPath)) {
  rmSync(targetPath, { force: true });
}

renameSync(source.path, targetPath);
console.log(`Renamed Windows installer to ${targetName}.`);
