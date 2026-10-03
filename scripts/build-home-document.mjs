// Rebuilds src/components/home/home-document.js from the editable vanilla
// source in design/home-source (index.html + styles.css + app.js + assets).
// Run with: node scripts/build-home-document.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'design/home-source');

let html = readFileSync(resolve(dir, 'index.html'), 'utf8');
const css = readFileSync(resolve(dir, 'styles.css'), 'utf8');
const js = readFileSync(resolve(dir, 'app.js'), 'utf8');
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

writeFileSync(
  resolve(root, 'src/components/home/home-document.js'),
  '// Generated from design/home-source (owner-directed edits to the approved design). Do not hand-edit — change the source and run: node scripts/build-home-document.mjs\nexport default ' + JSON.stringify(html) + ';\n',
);
console.log('Rebuilt src/components/home/home-document.js:', Buffer.byteLength(html), 'bytes');
