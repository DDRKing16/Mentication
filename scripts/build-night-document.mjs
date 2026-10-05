import { build } from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
// Recovered original artwork/layout lives in design/night-source. Never patch generated HTML.
const root = new URL('../',import.meta.url);
const result = await build({absWorkingDir:root.pathname,entryPoints:['design/night-source/app.js'],bundle:true,write:false,format:'iife',minify:true,define:{'process.env.NODE_ENV':'"production"'},legalComments:'none'});
const shell=await readFile(new URL('design/night-source/shell.html',root),'utf8');
const css=await readFile(new URL('design/night-source/accessibility.css',root),'utf8');
await writeFile(new URL('public/night-channel/index.html',root),shell.replace('<title>React Artifact</title>','<title>Night Channel</title>').replace('</head>',`<style>${css}</style></head>`).replace('<script type="module" src="./app.js"></script>',()=>`<script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`));
