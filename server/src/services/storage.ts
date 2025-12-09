import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function filePath(name: string) {
  return path.join(dataDir, name + '.json');
}

export async function readJSON<T>(name: string, fallback: T): Promise<T> {
  const fp = filePath(name);
  try {
    if (!fs.existsSync(fp)) {
      await fs.promises.writeFile(fp, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const raw = await fs.promises.readFile(fp, 'utf8');
    if (!raw || raw.trim().length === 0) {
      // empty file, initialize with fallback
      await fs.promises.writeFile(fp, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error('[storage] parse error for', fp, err);
      // repair file by writing fallback
      await fs.promises.writeFile(fp, JSON.stringify(fallback, null, 2));
      return fallback;
    }
  } catch (err) {
    console.error('[storage] readJSON error', err);
    return fallback;
  }
}

export async function writeJSON<T>(name: string, data: T): Promise<void> {
  const fp = filePath(name);
  try {
    await fs.promises.writeFile(fp, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[storage] writeJSON error', err);
  }
}

export default { readJSON, writeJSON };
