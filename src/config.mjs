import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..');
export const DATA_DIR = path.join(ROOT_DIR, 'design-md');
export const INDEX_PATH = path.join(ROOT_DIR, 'index.json');
export const CUSTOM_DATA_DIR = path.join(ROOT_DIR, 'custom-design-md');

export const CONFIG = {
  version: '1.0.0',
  productName: 'OneForge Sledge',
  parentBrand: 'OneForge',
  userAgent: 'OneForge-Sledge/1.0 (+https://github.com/oneforge/sledge)',
  http: {
    timeoutMs: 15_000,
    maxRedirects: 4,
    maxDownloadBytes: 5 * 1024 * 1024, // 5 MB
  },
  server: {
    defaultPort: 3456,
    defaultHost: '127.0.0.1',
  },
  paths: {
    root: ROOT_DIR,
    data: DATA_DIR,
    index: INDEX_PATH,
    custom: CUSTOM_DATA_DIR,
    web: path.join(__dirname, 'web'),
  },
};
