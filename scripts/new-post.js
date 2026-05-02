// scripts/new-post.js
// usage: node scripts/new-post.js "Title of the post"

import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, '..', 'posts');

const title = process.argv.slice(2).join(' ');
if (!title) {
  console.error('usage: node scripts/new-post.js "Title of the post"');
  process.exit(1);
}

const date = localDateStamp();
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const filename = `${date}-${slug}.md`;
const filepath = join(POSTS_DIR, filename);

if (existsSync(filepath)) {
  console.error(`exists: ${filepath}`);
  process.exit(1);
}

const body = `---
title: ${title}
date: ${date}
tags: []
draft: true
---

write here.
`;

writeFileSync(filepath, body);
console.log(`created: posts/${filename}`);

function localDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
