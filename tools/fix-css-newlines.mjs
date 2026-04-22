import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const subdir = join(__dirname, '..', 'subpage');

for (const f of fs.readdirSync(subdir)) {
  if (!f.endsWith('.html')) continue;
  const p = join(subdir, f);
  let h = fs.readFileSync(p, 'utf8');
  const n = h.replace(
    /">[ \t]+<link rel="stylesheet" href="\.\.\/asset\/css\/seo-surface\.css">/g,
    '">\n    <link rel="stylesheet" href="../asset/css/seo-surface.css">'
  );
  if (n !== h) fs.writeFileSync(p, n, 'utf8');
  console.log(f, n !== h ? 'fixed' : 'ok');
}
