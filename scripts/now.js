// scripts/now.js
// usage: node scripts/now.js "single-line update"
// prepends a dated bullet to the ## log section of pages/now.md
// and refreshes the **last updated:** line.

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NOW_FILE = join(__dirname, '..', 'pages', 'now.md');
const MARKER = '<!-- now-log -->';

const entry = process.argv.slice(2).join(' ').trim();
if (!entry) {
  console.error('usage: node scripts/now.js "single-line update"');
  process.exit(1);
}
if (entry.includes('\n')) {
  console.error('entry must be a single line');
  process.exit(1);
}

const today = localDateStamp();
const bullet = `- **${today}** — ${entry}`;

let content = readFileSync(NOW_FILE, 'utf8');

if (!content.includes(MARKER)) {
  console.error(`marker not found in ${NOW_FILE}: ${MARKER}`);
  process.exit(1);
}

content = content.replace(MARKER, `${bullet}\n${MARKER}`);
content = content.replace(
  /\*\*last updated:\*\*\s*\d{4}-\d{2}-\d{2}/,
  `**last updated:** ${today}`,
);

writeFileSync(NOW_FILE, content);
console.log(`added: ${bullet}`);

function localDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
