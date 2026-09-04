import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../src/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateOpenApi() {
  const app = await buildApp();
  await app.ready();

  const openapiSpec = app.swagger();
  const outputPath = resolve(__dirname, '../openapi.json');

  writeFileSync(outputPath, JSON.stringify(openapiSpec, null, 2), 'utf-8');
  console.log(`✅ OpenAPI specification exported to ${outputPath}`);

  await app.close();
}

generateOpenApi().catch((err) => {
  console.error('❌ Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
