import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const templatePath = resolve(root, 'src/environments/environment.mobile.template.ts');
const outputPath = resolve(root, 'src/environments/environment.mobile.generated.ts');
const defaultDebugUrl = 'http://10.0.2.2:8080/api/v1';
const rawApiUrl = (process.env.MOBILE_API_URL || defaultDebugUrl).trim();

let parsed;
try {
  parsed = new URL(rawApiUrl);
} catch {
  console.error('MOBILE_API_URL debe ser una URL absoluta, por ejemplo https://app.midominio.com/api/v1');
  process.exit(1);
}

if (!['http:', 'https:'].includes(parsed.protocol)) {
  console.error('MOBILE_API_URL solo admite http o https.');
  process.exit(1);
}

if (process.env.MOBILE_RELEASE === 'true' && parsed.protocol !== 'https:') {
  console.error('Para una compilación release MOBILE_API_URL debe usar HTTPS.');
  process.exit(1);
}

const normalized = rawApiUrl.replace(/\/+$/, '');
const template = await readFile(templatePath, 'utf8');
await writeFile(outputPath, template.replace('__MOBILE_API_URL__', normalized), 'utf8');
console.log(`Configuración móvil generada para ${normalized}`);
