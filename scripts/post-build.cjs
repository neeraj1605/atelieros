const fs = require('fs');
const path = require('path');

const root = process.cwd();
const distDir = path.join(root, 'dist');
const base = '/atelieros';

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

['js', 'spatial', 'css'].forEach(dir => {
  const srcDir = path.join(root, dir);
  const outDir = path.join(distDir, dir);
  if (fs.existsSync(srcDir)) {
    copyDirSync(srcDir, outDir);
    console.log(`Copied ${dir}/ -> dist/${dir}/`);
  }
});

const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  content = content.replace(/href="\/atelieros\/atelieros\//g, 'href="/atelieros/');
  content = content.replace(/src="\/atelieros\/atelieros\//g, 'src="/atelieros/');
  content = content.replace(/src="js\//g, `src="${base}/js/`);
  content = content.replace(/src="spatial\//g, `src="${base}/spatial/`);
  content = content.replace(/href="css\//g, `href="${base}/css/`);
  fs.writeFileSync(indexPath, content);
  console.log('Patched dist/index.html with base prefix');
}

console.log('Post-build complete.');
