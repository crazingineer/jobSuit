import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './engine/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/data')) {
        return next();
      }
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[jobSuite Server] Running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[jobSuite Server] Failed to start:', err);
  process.exit(1);
});
