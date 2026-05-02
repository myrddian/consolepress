// scripts/build.js
// Markdown posts and pages -> static HTML.
// Run: node scripts/build.js

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import matter from 'gray-matter';
import SITE from '../site.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'posts');
const PUBLIC_DIR = join(ROOT, 'public');
const TEMPLATE_DIR = join(ROOT, 'templates');
const PAGES_DIR = join(ROOT, 'pages');
const STATIC_DIR = join(ROOT, 'static');

marked.use({
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
  },
});

const fmtDate = (d) => {
  if (typeof d === 'string') return d.slice(0, 10);
  if (d instanceof Date) return formatUtcDate(d);
  return formatUtcDate(new Date(d));
};
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const tmpl = (name) => readFileSync(join(TEMPLATE_DIR, name), 'utf8');
const render = (template, vars) =>
  template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
const usedRoutes = new Map();
const themeStylesheetLink = renderThemeStylesheetLink(SITE.theme);
const sharedBaseVars = {
  language: escapeHtml(SITE.language || 'en'),
  site_title: escapeHtml(SITE.title),
  prompt: escapeHtml(SITE.prompt || 'writer@console:~$'),
  location: escapeHtml(SITE.location || 'internet'),
  theme_stylesheet_link: themeStylesheetLink,
};

reserveRoute('/', 'index');
reserveRoute('/posts/', 'posts archive');

if (existsSync(PUBLIC_DIR)) rmSync(PUBLIC_DIR, { recursive: true });
mkdirSync(PUBLIC_DIR, { recursive: true });
mkdirSync(join(PUBLIC_DIR, 'posts'), { recursive: true });

// ---- read posts ----

const postFiles = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
const posts = postFiles.map(f => {
  const raw = readFileSync(join(POSTS_DIR, f), 'utf8');
  const { data, content } = matter(raw);
  if (!data.title) throw new Error(`${f}: missing title in frontmatter`);
  if (!data.date) throw new Error(`${f}: missing date in frontmatter`);
  const slug = data.slug || slugify(data.title);
  const url = `/posts/${slug}/`;
  const draft = data.draft === true;
  if (!draft) reserveRoute(url, `post ${f}`);
  return {
    title: data.title,
    date: data.date,
    tags: data.tags || [],
    draft,
    slug,
    url,
    html: marked.parse(content),
  };
}).filter(p => !p.draft)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// ---- render individual posts ----

const postTemplate = tmpl('post.html');
const baseTemplate = tmpl('base.html');

const renderTags = (tags) => tags.map(t =>
  `<span class="tag ${slugify(t)}">${escapeHtml(t)}</span>`
).join('');

for (const p of posts) {
  const postBody = render(postTemplate, {
    title: escapeHtml(p.title),
    date: fmtDate(p.date),
    content: p.html,
    tags: renderTags(p.tags),
  });
  const html = render(baseTemplate, {
    ...sharedBaseVars,
    title: escapeHtml(`${p.title} — ${SITE.title}`),
    description: escapeHtml(SITE.description),
    url: escapeHtml(`${SITE.url}${p.url}`),
    body: postBody,
  });
  const dir = join(PUBLIC_DIR, 'posts', p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

// ---- render index ----

const indexTemplate = tmpl('index.html');
const postsTemplate = tmpl('posts.html');

const renderRows = (list) => list.map(p => `
    <div class="post-row">
      <span class="post-date">${fmtDate(p.date)}</span>
      <a class="post-link" href="${p.url}">${escapeHtml(p.title)}</a>
    </div>`).join('');

const recentLimit = 3;
const recentPosts = posts.slice(0, recentLimit);
const indexBody = render(indexTemplate, {
  count: posts.length,
  recent_count: recentPosts.length,
  posts: renderRows(recentPosts),
  prompt: escapeHtml(SITE.prompt || 'writer@console:~$'),
  intro: escapeHtml(SITE.intro || ''),
  intro_secondary: escapeHtml(SITE.intro_secondary || ''),
});
const indexHtml = render(baseTemplate, {
  ...sharedBaseVars,
  title: escapeHtml(SITE.title),
  description: escapeHtml(SITE.description),
  url: escapeHtml(SITE.url),
  body: indexBody,
});
writeFileSync(join(PUBLIC_DIR, 'index.html'), indexHtml);

// ---- render posts archive (/posts/) ----

const archiveBody = render(postsTemplate, {
  count: posts.length,
  posts: renderRows(posts),
  prompt: escapeHtml(SITE.prompt || 'writer@console:~$'),
});
const archiveHtml = render(baseTemplate, {
  ...sharedBaseVars,
  title: escapeHtml(`posts — ${SITE.title}`),
  description: escapeHtml(`all posts on ${SITE.title}`),
  url: escapeHtml(`${SITE.url}/posts/`),
  body: archiveBody,
});
writeFileSync(join(PUBLIC_DIR, 'posts', 'index.html'), archiveHtml);

// ---- render standalone pages (about, now, contact, etc.) ----

if (existsSync(PAGES_DIR)) {
  const pageFiles = readdirSync(PAGES_DIR).filter(f => f.endsWith('.md'));
  for (const f of pageFiles) {
    const raw = readFileSync(join(PAGES_DIR, f), 'utf8');
    const { data, content } = matter(raw);
    const slug = data.slug || f.replace(/\.md$/, '');
    const url = `${SITE.url}/${slug}/`;
    reserveRoute(`/${slug}/`, `page ${f}`);
    const html = marked.parse(content);
    const pageBody = `
      <article class="post">
        <header class="post-header">
          <h1 class="post-title">${escapeHtml(data.title || slug)}</h1>
        </header>
        <div class="post-content">${html}</div>
        <footer class="post-footer">
          <a href="/" class="back-link">← back to ~</a>
        </footer>
      </article>`;
    const fullHtml = render(baseTemplate, {
      ...sharedBaseVars,
      title: escapeHtml(`${data.title || slug} — ${SITE.title}`),
      description: escapeHtml(data.description || SITE.description),
      url: escapeHtml(url),
      body: pageBody,
    });
    const dir = join(PUBLIC_DIR, slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), fullHtml);
  }
}

// ---- copy static assets ----

if (existsSync(STATIC_DIR)) {
  copyDirSync(STATIC_DIR, PUBLIC_DIR);
}

// ---- rss feed ----

const rssItems = posts.slice(0, 20).map(p => `
  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${SITE.url}${p.url}</link>
    <guid>${SITE.url}${p.url}</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <description>${escapeXml(p.html)}</description>
  </item>`).join('');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${SITE.title}</title>
  <link>${SITE.url}</link>
  <description>${SITE.description}</description>
  <language>${escapeXml(SITE.language || 'en')}</language>
  ${rssItems}
</channel>
</rss>`;
writeFileSync(join(PUBLIC_DIR, 'feed.xml'), rss);

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function formatUtcDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function reserveRoute(route, source) {
  const existing = usedRoutes.get(route);
  if (existing) {
    throw new Error(`duplicate route ${route}: ${existing} and ${source}`);
  }
  usedRoutes.set(route, source);
}

function copyDirSync(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function renderThemeStylesheetLink(theme) {
  if (!theme || theme === 'default') return '';

  const filename = theme.endsWith('.css') ? theme : `${theme}.css`;
  const filepath = join(STATIC_DIR, filename);
  if (!existsSync(filepath)) {
    throw new Error(`theme stylesheet not found: static/${filename}`);
  }

  return `<link rel="stylesheet" href="/${escapeHtml(filename)}">`;
}

console.log(`built ${posts.length} posts → ${PUBLIC_DIR}`);
