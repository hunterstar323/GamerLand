import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'log-frontend-url',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          const localUrl = server.resolvedUrls?.local[0] ?? 'http://localhost:5173/';
          console.log(`Frontend running at: ${localUrl}`);
        });
      },
    },
  ],
  server: {
    port: 5173,
  },
});
