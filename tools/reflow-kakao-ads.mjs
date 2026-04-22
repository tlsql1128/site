import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const UNIT = "DAN-99ND6dOnbG8MGeJ3";

// ⚠️ MUST remain byte-for-byte identical (user requirement)
const AD_SNIPPET = `<ins class="kakao_ad_area" style="display:none;" 
data-ad-unit = "DAN-99ND6dOnbG8MGeJ3"
data-ad-width = "300"
data-ad-height = "250"></ins>
<script type="text/javascript" src="//t1.daumcdn.net/kas/static/ba.min.js" async></script>`;

function wrapAd({ classes = "", slotClass = "" } = {}) {
  const cls = ["yw-ad", classes].filter(Boolean).join(" ");
  const slot = ["yw-ad__slot", slotClass].filter(Boolean).join(" ");
  return `\n\n    <section class="${cls}" aria-label="광고">\n        <div class="container yw-ad__inner">\n            <div class="${slot}">\n${AD_SNIPPET}\n            </div>\n        </div>\n    </section>\n`;
}

function listTargets() {
  const targets = ["index.html"];
  const subDir = path.join(ROOT, "subpage");
  for (const f of fs.readdirSync(subDir)) {
    if (f.endsWith(".html")) targets.push(path.join("subpage", f));
  }
  return targets;
}

function removeAllAdSections(html) {
  let out = html;
  while (true) {
    const s = out.indexOf(`<section class="yw-ad"`);
    if (s === -1) break;
    const e = out.indexOf(`</section>`, s);
    if (e === -1) break;
    out = out.slice(0, s) + out.slice(e + `</section>`.length);
  }
  return out;
}

function findMatchingClose(html, startIdx, tagName) {
  const re = new RegExp(`<${tagName}\\b|</${tagName}>`, "gi");
  re.lastIndex = startIdx;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    const token = m[0].toLowerCase();
    if (token.startsWith(`</`)) depth -= 1;
    else depth += 1;
    if (depth === 0) return re.lastIndex; // index right after closing tag
  }
  return -1;
}

function insertAfter(html, marker, block) {
  const idx = html.indexOf(marker);
  if (idx === -1) return { ok: false, reason: "marker_not_found" };
  return { ok: true, html: html.slice(0, idx + marker.length) + block + html.slice(idx + marker.length) };
}

function insertBefore(html, marker, block) {
  const idx = html.indexOf(marker);
  if (idx === -1) return { ok: false, reason: "marker_not_found" };
  return { ok: true, html: html.slice(0, idx) + block + html.slice(idx) };
}

function insertAfterSectionBySelector(html, selectorStart) {
  const start = html.indexOf(selectorStart);
  if (start === -1) return { ok: false, reason: "section_start_not_found" };
  const end = html.indexOf(`</section>`, start);
  if (end === -1) return { ok: false, reason: "section_end_not_found" };
  const at = end + `</section>`.length;
  return { ok: true, at };
}

function insertAt(html, at, block) {
  return html.slice(0, at) + block + html.slice(at);
}

function planForFile(rel, html) {
  if (rel === "index.html") {
    const ad1 = wrapAd({ classes: "yw-ad--tight" }); // after hero chips, before first section
    const ad2 = wrapAd({ classes: "yw-ad--spacer" }); // between features and flow (in the gap)
    const ad3 = wrapAd({ classes: "yw-ad--tight" }); // before story section

    // 1) after home hero
    const hero = insertAfterSectionBySelector(html, `<section class="hero"`);
    if (!hero.ok) return { ok: false, reason: "home_hero" };
    html = insertAt(html, hero.at, ad1);

    // 2) after cta-strip (it sits between features and flow)
    const strip = insertAfterSectionBySelector(html, `<section class="cta-strip"`);
    if (!strip.ok) return { ok: false, reason: "cta_strip" };
    html = insertAt(html, strip.at, ad2);

    // 3) before section-story
    const storyMarker = `<section id="section-story"`;
    const before = insertBefore(html, storyMarker, ad3);
    if (!before.ok) return { ok: false, reason: "before_story" };
    html = before.html;

    return { ok: true, html };
  }

  // calculator / tool pages: prefer side ad under result card + one ad after tool block
  const isToolMain = html.includes(`<main id="section-tool"`);

  // Known result-panel targets
  const sideTargets = [
    { needle: `id="result-panel"`, tag: "div" }, // rent
    { needle: `id="panel-result"`, tag: "div" }, // salary
    { needle: `class="planner-card planner-card--result"`, tag: "aside" }, // planner
  ];

  const sideBlock = wrapAd({ classes: "yw-ad--tight", slotClass: "ad-side" });
  const afterToolBlock = wrapAd({ classes: "yw-ad--spacer" });

  let insertedSide = false;
  for (const t of sideTargets) {
    const pos = html.indexOf(t.needle);
    if (pos === -1) continue;
    const start = html.lastIndexOf(`<${t.tag}`, pos);
    if (start === -1) continue;
    const endAt = findMatchingClose(html, start, t.tag);
    if (endAt === -1) continue;
    html = insertAt(html, endAt, sideBlock);
    insertedSide = true;
    break;
  }

  // Youth-savings: insert side-like block after result preview (same column, but near result)
  if (!insertedSide && rel.endsWith("youth-savings.html")) {
    const preview = html.indexOf(`id="result-preview"`);
    if (preview !== -1) {
      const start = html.lastIndexOf(`<div`, preview);
      const endAt = start !== -1 ? findMatchingClose(html, start, "div") : -1;
      if (endAt !== -1) {
        html = insertAt(html, endAt, wrapAd({ classes: "yw-ad--tight" }));
        insertedSide = true;
      }
    }
  }

  // 2nd ad: after main tool/calculator block, before next content/faq
  if (isToolMain) {
    const mainEnd = html.indexOf(`</main>`);
    if (mainEnd !== -1) {
      html = insertAt(html, mainEnd + `</main>`.length, afterToolBlock);
      return { ok: true, html };
    }
  }

  // otherwise: after section-calculator if present
  const calc = insertAfterSectionBySelector(html, `id="section-calculator"`);
  if (calc.ok) {
    html = insertAt(html, calc.at, afterToolBlock);
    return { ok: true, html };
  }

  // content pages: keep 2 ads — after hero (tight) and before footer (tight)
  const heroStart = html.indexOf(`id="section-hero"`);
  if (heroStart !== -1) {
    const heroEnd = html.indexOf(`</section>`, heroStart);
    if (heroEnd !== -1) html = insertAt(html, heroEnd + `</section>`.length, wrapAd({ classes: "yw-ad--tight" }));
  }
  const footerMarker = `<div id="footer"></div>`;
  const ins = insertBefore(html, footerMarker, wrapAd({ classes: "yw-ad--tight" }));
  if (ins.ok) html = ins.html;

  return { ok: true, html };
}

let changed = 0;
let failed = 0;

for (const rel of listTargets()) {
  const abs = path.join(ROOT, rel);
  const before = fs.readFileSync(abs, "utf8");
  const cleared = removeAllAdSections(before);

  const planned = planForFile(rel, cleared);
  if (!planned.ok) {
    failed++;
    console.error("FAIL", rel, planned.reason);
    continue;
  }

  // sanity: ensure at least one unit exists
  if (!planned.html.includes(UNIT)) {
    failed++;
    console.error("FAIL", rel, "no_unit_after_plan");
    continue;
  }

  fs.writeFileSync(abs, planned.html, "utf8");
  changed++;
}

console.log(JSON.stringify({ changed, failed }, null, 2));

