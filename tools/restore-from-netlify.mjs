import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = 'https://youthwallet.netlify.app/subpage/';
const subdir = join(__dirname, '..', 'subpage');

const files = [
  'calendar.html',
  'credit.html',
  'faq.html',
  'goal-100m.html',
  'guide.html',
  'insurance.html',
  'living-cost.html',
  'loan.html',
  'planner.html',
  'rent.html',
  'salary.html',
  'support.html',
  'usedcar.html',
  'youth-savings.html',
];

for (const f of files) {
  const url = base + f;
  const res = await fetch(url);
  if (!res.ok) {
    console.error('FAIL', f, res.status);
    continue;
  }
  const text = await res.text();
  const out = join(subdir, f);
  fs.writeFileSync(out, text, 'utf8');
  console.log('OK', f, text.length, 'bytes');
}
console.log('done');
