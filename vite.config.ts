import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Simple Vercel-like dev server middleware for Vite
function vercelDevPlugin() {
  return {
    name: 'vercel-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/explain')) {
          try {
            // Read and parse request body
            let body = '';
            await new Promise<void>((resolve, reject) => {
              req.on('data', (chunk: any) => {
                body += chunk;
              });
              req.on('end', () => {
                resolve();
              });
              req.on('error', (err: any) => {
                reject(err);
              });
            });

            const parsedBody = body ? JSON.parse(body) : {};
            
            // Add status and json helper methods to res
            const customRes = res as any;
            customRes.status = (statusCode: number) => {
              res.statusCode = statusCode;
              return customRes;
            };
            customRes.json = (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return customRes;
            };

            const customReq = req as any;
            customReq.body = parsedBody;

            // Load the compilation-on-the-fly TypeScript module file
            const modulePath = path.resolve(process.cwd(), 'api/explain.ts');
            if (fs.existsSync(modulePath)) {
              const explainModule = await server.ssrLoadModule(modulePath);
              if (explainModule && typeof explainModule.default === 'function') {
                await explainModule.default(customReq, customRes);
              } else {
                throw new Error("No default export found in api/explain.ts");
              }
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Endpoint not found' }));
            }
          } catch (error: any) {
            console.error('Error in api/explain dev handler:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), vercelDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
