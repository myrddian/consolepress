# ConsolePress

ConsolePress is a minimal static blog generator for small personal sites.

It turns Markdown files with frontmatter into a static site with a built-in
terminal-inspired theme. There is no database, no admin panel, and no server
runtime on the deployed site.

## Features

- Markdown posts in `posts/`
- Markdown pages in `pages/`
- Draft support
- Newest-first post sorting
- Index page, posts archive, and RSS feed
- Static asset copying from `static/`
- Tiny codebase that is easy to read and modify

## Project Layout

```text
posts/                    blog posts as Markdown files
pages/                    standalone pages such as about, now, projects, contact
templates/                HTML templates
static/                   CSS and other static assets
scripts/build.js          build script
scripts/new-post.js       post scaffold helper
scripts/now.js            /now page helper
site.config.js            site metadata
consolepress              optional CLI wrapper
public/                   generated site output
```

## Quick Start

Install dependencies:

```bash
npm install
```

Build the site:

```bash
npm run build
```

Serve the generated output locally:

```bash
npm run serve
```

Create a new draft post:

```bash
npm run new -- "My first post"
```

Append an entry to the `/now` page log:

```bash
npm run now -- "Shipped a small improvement"
```

You can also use the wrapper CLI directly:

```bash
./consolepress build
./consolepress new "My first post"
./consolepress now "Small update"
```

## Content Format

Posts use frontmatter like this:

```md
---
title: Some post title
date: 2026-05-02
tags: [notes, systems]
draft: true
---

Write here.
```

Standalone pages use frontmatter like this:

```md
---
title: About
slug: about
description: Short page description
---

Page content here.
```

## Configuration

Update `site.config.js` to set:

- site title
- author
- description
- canonical URL
- theme
- terminal prompt label
- footer location text
- homepage intro copy

Theme selection works like this:

- use `theme: 'default'` for the built-in base theme
- use `theme: 'cyberpunk_crt'` for the CRT variant included in `static/`
- add your own `static/<name>.css` file and set `theme: '<name>'` to ship a custom theme

## Deploying

ConsolePress builds to plain static files, so it works well with:

- Cloudflare Pages
- Netlify
- GitHub Pages
- any static web server

Typical deploy flow:

1. Run `npm install`
2. Run `npm run build`
3. Deploy the `public/` directory

## Why This Exists

ConsolePress is for people who want a writing-focused site without a framework,
database, or content management UI. The source of truth is just Markdown files
in Git.

## License

Apache-2.0
