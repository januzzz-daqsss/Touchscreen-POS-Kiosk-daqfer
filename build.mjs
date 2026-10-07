import { copyFile, mkdir } from 'node:fs/promises';

const output = new URL('./dist/', import.meta.url);
await mkdir(new URL('src/', output), { recursive: true });
for (const file of ['index.html', 'styles.css', 'src/app.js', 'src/store.js', 'src/catalog.js']) {
  await copyFile(new URL(file, import.meta.url), new URL(file, output));
}
console.log('Static POS assets built in dist/');
