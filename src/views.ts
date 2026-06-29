/**
 * Server-rendered HTML via plain template literals — no template engine, no
 * second build step. Everything user- or environment-derived MUST pass through
 * `esc()` before interpolation.
 */

import { config } from './config';

/** Escape a value for safe interpolation into HTML text/attributes. */
export function esc(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/health', label: 'Health' },
];

function renderNav(): string {
  return `<nav>${NAV_LINKS.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</nav>`;
}

export interface LayoutOptions {
  title: string;
  body: string;
}

/** Wrap a page body in the full HTML document + shared chrome. */
export function layout(opts: LayoutOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(opts.title)} — ${esc(config.appName)}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <a class="brand" href="/">${esc(config.appName)}</a>
    ${renderNav()}
  </header>
  <main>
    ${opts.body}
  </main>
  <footer>
    <span>Node ${esc(process.version)}</span>
    <span>pid ${esc(process.pid)}</span>
    <span>${esc(config.nodeEnv)}</span>
  </footer>
</body>
</html>`;
}

/** Render a `<table>` from an array of [label, value] rows (values escaped). */
export function kvTable(rows: Array<[string, unknown]>): string {
  const body = rows
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('');
  return `<table class="kv">${body}</table>`;
}
