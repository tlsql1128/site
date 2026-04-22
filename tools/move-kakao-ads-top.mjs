import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const UNIT = "DAN-99ND6dOnbG8MGeJ3";

function listTargets() {
  const targets = ["index.html"];
  const subDir = path.join(ROOT, "subpage");
  for (const f of fs.readdirSync(subDir)) {
    if (f.endsWith(".html")) targets.push(path.join("subpage", f));
  }
  return targets;
}

function extractAdBlock(html) {
  const start = html.indexOf(`<section class="yw-ad"`);
  if (start === -1) return { ok: false, reason: "no_ad_section" };
  const end = html.indexOf(`</section>`, start);
  if (end === -1) return { ok: false, reason: "no_ad_section_end" };
  const block = html.slice(start, end + `</section>`.length);
  if (!block.includes(UNIT)) return { ok: false, reason: "unit_not_found_in_block" };
  const next = html.slice(0, start) + html.slice(end + `</section>`.length);
  return { ok: true, block, html: next };
}

function insertAfterHero(rel, html, block) {
  // index: first .hero section
  if (rel === "index.html") {
    const heroStart = html.indexOf(`<section class="hero"`);
    if (heroStart === -1) return { ok: false, reason: "no_home_hero" };
    const heroEnd = html.indexOf(`</section>`, heroStart);
    if (heroEnd === -1) return { ok: false, reason: "no_home_hero_end" };
    const insertAt = heroEnd + `</section>`.length;
    return { ok: true, html: html.slice(0, insertAt) + `\n\n    ` + block + `\n` + html.slice(insertAt) };
  }

  // subpages: #section-hero.sub-hero
  const heroStart = html.indexOf(`id="section-hero"`);
  if (heroStart === -1) return { ok: false, reason: "no_sub_hero" };
  const sectionStart = html.lastIndexOf(`<section`, heroStart);
  if (sectionStart === -1) return { ok: false, reason: "no_sub_hero_section_start" };
  const heroEnd = html.indexOf(`</section>`, heroStart);
  if (heroEnd === -1) return { ok: false, reason: "no_sub_hero_end" };
  const insertAt = heroEnd + `</section>`.length;
  return { ok: true, html: html.slice(0, insertAt) + `\n\n    ` + block + `\n` + html.slice(insertAt) };
}

let moved = 0;
let skipped = 0;
let failed = 0;

for (const rel of listTargets()) {
  const abs = path.join(ROOT, rel);
  const before = fs.readFileSync(abs, "utf8");

  if (!before.includes(UNIT)) {
    skipped++;
    continue;
  }

  const ex = extractAdBlock(before);
  if (!ex.ok) {
    failed++;
    console.error("FAIL extract", rel, ex.reason);
    continue;
  }

  const ins = insertAfterHero(rel, ex.html, ex.block);
  if (!ins.ok) {
    failed++;
    console.error("FAIL insert", rel, ins.reason);
    continue;
  }

  fs.writeFileSync(abs, ins.html, "utf8");
  moved++;
}

console.log(JSON.stringify({ moved, skipped, failed }, null, 2));
