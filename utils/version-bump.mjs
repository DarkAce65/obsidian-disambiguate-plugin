import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

import prettier from 'prettier';

const targetVersion = process.env.npm_package_version;

const manifestPath = path.join(import.meta.dirname, '../manifest.json');
const versionsPath = path.join(import.meta.dirname, '../versions.json');

async function writeFormattedJSON(filepath, json) {
  writeFileSync(filepath, await prettier.format(JSON.stringify(json, null, 2), { filepath }));
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.version = targetVersion;
await writeFormattedJSON(manifestPath, manifest);

const versions = JSON.parse(readFileSync(versionsPath, 'utf8'));
versions[targetVersion] = manifest.minAppVersion;
await writeFormattedJSON(versionsPath, versions);
