// Rebuilds public/home.html from the editable vanilla source in
// design/home-source (index.html + styles.css + app.js + assets). The home
// document is shipped as a static HTML asset so the browser streams and
// parses it directly instead of downloading and parsing a 2.4MB JS string.
// Run with: node scripts/build-home-document.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'design/home-source');

let html = readFileSync(resolve(dir, 'index.html'), 'utf8');
const css = readFileSync(resolve(dir, 'styles.css'), 'utf8');
// The Peace Palace drawing is shared with the React app: inline it (minus
// its `export`) ahead of app.js so both show the identical building.
const palaceArt = readFileSync(resolve(root, 'src/lib/palaceArt.js'), 'utf8').replace(/^export /gm, '');
const js = `${palaceArt}\n${readFileSync(resolve(dir, 'app.js'), 'utf8')}`;
const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(resolve(dir, file)).toString('base64')}`;

html = html.replaceAll('assets/images/approved-homescreen.png', dataUri('assets/images/approved-homescreen.png', 'image/png'));
html = html.replaceAll('assets/icons/favicon.svg', dataUri('assets/icons/favicon.svg', 'image/svg+xml'));
// Real in-app screenshots used by the discovery cards.
for (const shot of ['journal', 'good-map', 'dear2100']) {
  html = html.replaceAll(`assets/preview/${shot}.jpg`, dataUri(`assets/preview/${shot}.jpg`, 'image/jpeg'));
}
html = html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`);
html = html.replace('<script defer src="app.js"></script>', '');
html = html.replace('</body>', `<script>\n${js.replaceAll('</script', '<\\/script')}\n</script>\n</body>`);

writeFileSync(resolve(root, 'public/home.html'), html);
console.log('Rebuilt public/home.html:', Buffer.byteLength(html), 'bytes');
