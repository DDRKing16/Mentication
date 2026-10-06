import { build } from 'esbuild';
await build({entryPoints:['design/dear2100/app.js'],outfile:'public/dear2100-updated/assets/app.js',bundle:true,external:['./vendor.js'],minify:true,format:'esm',target:'es2022'});
