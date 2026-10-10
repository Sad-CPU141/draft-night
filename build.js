// Builds the static site: compiles src/*.jsx into app.js and stamps a version
// into index.html, styles and the service worker. Run: node build.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let Babel;
try { Babel = require('@babel/standalone'); } catch (e) { console.error('Run "npm install" first.'); process.exit(1); }

const src = path.join(__dirname, 'src');
const parts = fs.readdirSync(src).filter((f) => /\.(js|jsx)$/.test(f) && !f.includes('template')).sort();
const code = parts.map((f) => '/* ---- ' + f + ' ---- */\n' + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const out = Babel.transform(code, { presets: [['react', { runtime: 'classic' }]], compact: false, comments: false }).code;
const css = fs.readFileSync(path.join(src, 'styles.css'), 'utf8');
const version = crypto.createHash('sha1').update(out + css).digest('hex').slice(0, 10);

fs.writeFileSync(path.join(__dirname, 'app.js'), '/* Draft Night ' + version + ' — built from src/ by build.js. Edit src/, not this file. */\n"use strict";\n(function(){\n' + out + '\n})();\n');
fs.writeFileSync(path.join(__dirname, 'styles.css'), '/* Draft Night ' + version + ' — built from src/styles.css */\n' + css);
fs.writeFileSync(path.join(__dirname, 'index.html'), fs.readFileSync(path.join(src, 'index.template.html'), 'utf8').replace(/__VERSION__/g, version));
fs.writeFileSync(path.join(__dirname, 'sw.js'), fs.readFileSync(path.join(src, 'sw.template.js'), 'utf8').replace(/__VERSION__/g, version));
fs.writeFileSync(path.join(__dirname, 'version.json'), JSON.stringify({ version, builtAt: new Date().toISOString() }) + '\n');
console.log('Built Draft Night ' + version + ' from ' + parts.join(', '));
