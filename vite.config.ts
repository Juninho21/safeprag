import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'backup-save-middleware',
      configureServer(server) {
        server.middlewares.use('/api/save-backup', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          try {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            const bodyStr = Buffer.concat(chunks).toString('utf-8');
            const body = JSON.parse(bodyStr);
            let { fileName, content } = body || {};

            if (!fileName || typeof content !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'fileName and content are required' }));
              return;
            }

            // sanitize fileName
            fileName = String(fileName).replace(/\\/g, '/');
            fileName = path.basename(fileName);
            if (!fileName.toLowerCase().endsWith('.json')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Only .json files are allowed' }));
              return;
            }

            const publicDir = path.join(process.cwd(), 'public');
            if (!fs.existsSync(publicDir)) {
              fs.mkdirSync(publicDir, { recursive: true });
            }
            const targetPath = path.join(publicDir, fileName);
            fs.writeFileSync(targetPath, content, 'utf-8');

            // Also write/update a well-known pointer file for auto-restore
            const latestPath = path.join(publicDir, 'latest-backup.json');
            try {
              fs.writeFileSync(latestPath, content, 'utf-8');
            } catch (e) {
              // Non-fatal; continue
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, path: `/${fileName}`, latestPath: '/latest-backup.json' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err?.message || 'Internal Error' }));
          }
        });
      }
    }
  ],
  server: {
    port: 3000
  },
  build: {
    sourcemap: false,
  }
});
