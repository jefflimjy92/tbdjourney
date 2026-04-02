(async () => {
  const { createServer } = await import('vite');
  const host = process.env.VITE_DEV_HOST || '127.0.0.1';
  const server = await createServer({
    server: {
      host,
    },
  });

  await server.listen();
  server.printUrls();

  const close = async () => {
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', close);
  process.on('SIGTERM', close);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
