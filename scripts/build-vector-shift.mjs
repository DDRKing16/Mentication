import fs from 'node:fs';
import vm from 'node:vm';
const path='public/vector-shift/index.html';
const html=fs.readFileSync(path,'utf8');
const marker='/* VECTOR_SHIFT_EDITABLE_SOURCE */';
const start=html.includes(marker)?html.indexOf(marker):html.indexOf('var Qu=');
const end=html.indexOf('</script>',start);
if(start<0||end<0)throw new Error('Vector Shift source boundary missing');
const source=['support.js','app.js'].map(file=>fs.readFileSync(`design/vector-shift/${file}`,'utf8')).join('\n');
// Parse validation before updating the shipped self-contained document.
new vm.Script(source);
let output=html.slice(0,start)+marker+'\n'+source+'\n'+html.slice(end);
output=output.replace(/\s*<style id="vector-refinements">[\s\S]*?<\/style>/,'');
output=output.replace('</head>',`<style id="vector-refinements">\n${fs.readFileSync('design/vector-shift/styles.css','utf8')}</style>\n</head>`);
output=output.replace('<title>React Artifact</title>','<title>Vector Shift</title>');
fs.writeFileSync(path,output);
console.log('Built Vector Shift with original vendor runtime and artwork.');
