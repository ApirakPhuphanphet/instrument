import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../src/app.js';
import { mqttService } from '../src/services/mqtt.service.js';

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
  await mqttService.disconnect();
  process.exit(0);
}

generateOpenApi().catch((err) => {
  console.error('❌ Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
