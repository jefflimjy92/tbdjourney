import { preview } from 'vite';

const host = process.env.VITE_PREVIEW_HOST || '127.0.0.1';
const port = Number(process.env.VITE_PREVIEW_PORT || '4173');

const server = await preview({
  preview: {
    host,
    port,
  },
});

server.printUrls();

const close = async () => {
  await server.httpServer?.close();
  process.exit(0);
};

process.on('SIGINT', close);
process.on('SIGTERM', close);
