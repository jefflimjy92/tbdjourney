(async () => {
  const { build } = await import('vite');
  await build();
  console.log('vite build passed');
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
