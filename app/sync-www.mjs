import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
// usage: node sync-www.mjs [targetDir]  (default app/www)
const targetDir = path.resolve(process.cwd(), process.argv[2] || path.join(__dirname, 'www'));
const rawDir = path.resolve(rootDir, 'assets', 'raw');

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

let fileCount = 0;
let totalBytes = 0;

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  const stat = fs.statSync(src);
  fileCount++;
  totalBytes += stat.size;
}

function copyDirectory(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      if (path.resolve(srcPath) === rawDir) {
        continue;
      }
      copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath);
    }
  }
}

const itemsToCopy = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'js',
  'css',
  'icons',
  'assets'
];

for (const item of itemsToCopy) {
  const src = path.join(rootDir, item);
  const dest = path.join(targetDir, item);

  if (!fs.existsSync(src)) {
    continue;
  }

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDirectory(src, dest);
  } else if (stat.isFile()) {
    copyFile(src, dest);
  }
}

const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
console.log(`Synced ${fileCount} files (${totalMB} MB) to ${targetDir}`);
