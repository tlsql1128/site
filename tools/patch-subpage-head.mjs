/**
 * Add theme-color, seo-surface.css, brand-v2.css, and fill only *missing* OG / Twitter / canonical.
 */
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const subdir = join(__dirname, '..', 'subpage');

const OG_BASE = 'https://youthwallet.netlify.app';
const OG_IMAGE = `${OG_BASE}/asset/images/og.webp`;

function extract(re, s) {
  const m = s.match(re);
  return m ? m[1] : '';
}

function has(str, h) {
  return str.includes(h);
}

function patchFile(filename) {
  const path = join(subdir, filename);
  let html = fs.readFileSync(path, 'utf8');
  const orig = html;

  if (!has(html, 'name="theme-color"')) {
    html = html.replace(
      /(<meta name="viewport"[^>]*>)/i,
      `$1\n    <meta name="theme-color" content="#5b21b6">`
    );
  }

  if (!has(html, 'brand-v2.css')) {
    html = html.replace(
      /(\s*<script src="https:\/\/code\.jquery\.com)/,
      `    <link rel="stylesheet" href="../asset/css/seo-surface.css">\n    <link rel="stylesheet" href="../asset/css/brand-v2.css">\n$1`
    );
  }

  const pageUrl = `${OG_BASE}/subpage/${filename}`;
  const desc =
    extract(/<meta property="og:description" content="([^"]*)"/, html) ||
    extract(/<meta name="description" content="([^"]*)"/, html) ||
    '';
  const ttle =
    extract(/<meta property="og:title" content="([^"]*)"/, html) || extract(/<title>([^<]*)<\/title>/, html) || '';

  const add = [];
  if (!has(html, 'name="title"') && ttle) {
    add.push(`    <meta name="title" content="${ttle.replace(/"/g, '&quot;')}">`);
  }
  if (!has(html, 'name="author"')) {
    add.push(`    <meta name="author" content="청년지갑">`);
  }
  if (!has(html, 'name="robots"')) {
    add.push(`    <meta name="robots" content="index, follow">`);
  }
  if (!has(html, 'property="og:type"')) {
    add.push(`    <meta property="og:type" content="website">`);
  }
  if (!has(html, 'property="og:url"')) {
    add.push(`    <meta property="og:url" content="${pageUrl}">`);
  }
  if (!has(html, 'property="og:description"') && desc) {
    add.push(`    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">`);
  }
  if (!has(html, 'property="og:image"')) {
    add.push(
      `    <meta property="og:image" content="${OG_IMAGE}">`,
      `    <meta property="og:image:secure_url" content="${OG_IMAGE}">`,
      `    <meta property="og:image:width" content="1200">`,
      `    <meta property="og:image:height" content="630">`,
      `    <meta property="og:image:type" content="image/webp">`,
      `    <meta property="og:image:alt" content="${ttle.replace(/"/g, '&quot;')}">`
    );
  }
  if (!has(html, 'property="og:site_name"')) {
    add.push(`    <meta property="og:site_name" content="청년지갑">`);
  }
  if (!has(html, 'property="og:locale"')) {
    add.push(`    <meta property="og:locale" content="ko_KR">`);
  }
  if (!has(html, 'name="twitter:card"')) {
    add.push(
      `    <meta name="twitter:card" content="summary_large_image">`,
      `    <meta name="twitter:title" content="${ttle.replace(/"/g, '&quot;')}">`,
      `    <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}">`,
      `    <meta name="twitter:image" content="${OG_IMAGE}">`,
      `    <meta name="twitter:image:alt" content="${ttle.replace(/"/g, '&quot;')}">`
    );
  }
  if (!has(html, 'rel="canonical"')) {
    add.push(`    <link rel="canonical" href="${pageUrl}">`);
  }

  if (add.length) {
    html = html.replace(/(<title>[^<]*<\/title>)/, `$1\n${add.join('\n')}`);
  }

  if (html !== orig) {
    fs.writeFileSync(path, html, 'utf8');
    return { filename, action: 'ok', added: add.length };
  }
  return { filename, action: 'unchanged' };
}

const files = fs.readdirSync(subdir).filter((f) => f.endsWith('.html'));
const results = files.map(patchFile);
console.log(JSON.stringify(results, null, 2));
