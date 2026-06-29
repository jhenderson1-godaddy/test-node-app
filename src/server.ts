/**
 * Minimal Node App — application entry point.
 *
 * Boots an Express app that listens on `process.env.PORT`, serves a small
 * status page plus a `/health` JSON endpoint, and shuts down gracefully on
 * SIGTERM/SIGINT.
 */

import path from 'node:path';
import express, { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { logger } from './logger';
import { layout, kvTable, esc } from './views';

const startedAt = Date.now();

const app = express();

// The platform terminates TLS at a proxy; trust it so req.ip / req.secure
// reflect the original client.
app.set('trust proxy', true);
app.disable('x-powered-by');

// Per-request access log to stdout.
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Math.round(ms),
    });
  });
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (_req: Request, res: Response) => {
  const uptimeS = Math.round((Date.now() - startedAt) / 1000);
  const body = `
    <h1>${esc(config.appName)}</h1>
    <p class="lead">A small TypeScript + Express app, intended as a build-and-publish smoke test for Node.js hosting.</p>
    ${kvTable([
      ['App', config.appName],
      ['Node version', process.version],
      ['Environment', config.nodeEnv],
      ['Port', config.port],
      ['Process ID', process.pid],
      ['Uptime (s)', uptimeS],
    ])}
    <p class="muted">See <a href="/health">/health</a> for a JSON health check.</p>
  `;
  res.type('html').send(layout({ title: 'Home', body }));
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptimeS: Math.round((Date.now() - startedAt) / 1000),
    node: process.version,
  });
});

// 404
app.use((req: Request, res: Response) => {
  const accept = req.headers.accept;
  const wantsHtml = req.method === 'GET' && typeof accept === 'string' && accept.includes('text/html');
  if (wantsHtml) {
    const body = `<h1>404</h1><p>No route for <code>${esc(req.originalUrl)}</code>.</p>
      <p><a href="/">&larr; Home</a></p>`;
    res.status(404).type('html').send(layout({ title: 'Not found', body }));
  } else {
    res.status(404).json({ error: 'not_found', path: req.originalUrl });
  }
});

// Centralized error handler.
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('unhandled error', { path: req.path, message: err.message });
  if (res.headersSent) return;
  res.status(500).json({ error: 'internal_error', message: err.message });
});

const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info('listening', {
    port: PORT,
    node: process.version,
    nodeEnv: config.nodeEnv,
  });
});

// --- Graceful shutdown ---------------------------------------------------
let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('shutdown signal received', { signal });
  server.close(() => {
    logger.info('shutdown complete');
    process.exit(0);
  });
  setTimeout(() => {
    logger.warn('forced shutdown after timeout');
    process.exit(1);
  }, 8000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
