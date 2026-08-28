import { copyFile, mkdir } from 'node:fs/promises';
import { platform } from 'node:os';

await mkdir(new URL('../dist/bin/', import.meta.url), { recursive: true });
const suffix = platform() === 'win32' ? '.exe' : '';
await copyFile(
  new URL(`../target/release/clean-env${suffix}`, import.meta.url),
  new URL(`../dist/bin/clean-env${suffix}`, import.meta.url),
);
