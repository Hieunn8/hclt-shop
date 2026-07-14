import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const srcRoot = join(process.cwd(), 'src');
const distRoot = join(process.cwd(), 'dist', 'src');

function copySchemas(dir) {
  for (const entry of readdirSync(dir)) {
    const sourcePath = join(dir, entry);
    const stat = statSync(sourcePath);

    if (stat.isDirectory()) {
      copySchemas(sourcePath);
      continue;
    }

    if (entry !== 'schema.json') {
      continue;
    }

    const targetPath = join(distRoot, relative(srcRoot, sourcePath));
    mkdirSync(dirname(targetPath), { recursive: true });
    cpSync(sourcePath, targetPath);
  }
}

if (!existsSync(srcRoot)) {
  throw new Error(`Source directory not found: ${srcRoot}`);
}

copySchemas(srcRoot);
