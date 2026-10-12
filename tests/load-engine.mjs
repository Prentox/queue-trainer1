// Loads the browser engine (a plain script) into Node for testing.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export function loadEngine() {
  const code = readFileSync(join(root, 'src', 'engine.js'), 'utf8');
  const Engine = new Function('module', code + '\nreturn Engine;')(undefined);
  Engine.load(readFileSync(join(root, 'src', 'champions.txt'), 'utf8'));
  return Engine;
}
