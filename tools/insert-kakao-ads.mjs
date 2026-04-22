import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const AD_SNIPPET = `<ins class="kakao_ad_area" style="display:none;" 
data-ad-unit = "DAN-99ND6dOnbG8MGeJ3"
data-ad-width = "300"
data-ad-height = "250"></ins>
<script type="text/javascript" src="//t1.daumcdn.net/kas/static/ba.min.js" async></script>`;

const WRAPPED_BLOCK = `\n\n    <section class="yw-ad" aria-label="광고">\n        <div class="container yw-ad__inner">\n            <div class="yw-ad__slot">\n${AD_SNIPPET}\n            </div>\n        </div>\n    </section>\n`;

function listTargets() {
  const targets = ["index.html"];
  const subDir = path.join(ROOT, "subpage");
  for (const f of fs.readdirSync(subDir)) {
    if (f.endsWith(".html")) targets.push(path.join("subpage", f));
  }
  return targets;
}

function insertBeforeFooter(html) {
  const marker = `<div id="footer"></div>`;
  const idx = html.indexOf(marker);
  if (idx === -1) return { ok: false, reason: "no_footer_marker" };
  const next = html.slice(0, idx) + WRAPPED_BLOCK + html.slice(idx);
  return { ok: true, html: next };
}

let changed = 0;
let skipped = 0;
let failed = 0;

for (const rel of listTargets()) {
  const abs = path.join(ROOT, rel);
  const html = fs.readFileSync(abs, "utf8");
  if (html.includes(`DAN-99ND6dOnbG8MGeJ3`)) {
    skipped++;
    continue;
  }
  const res = insertBeforeFooter(html);
  if (!res.ok) {
    failed++;
    console.error("FAIL", rel, res.reason);
    continue;
  }
  fs.writeFileSync(abs, res.html, "utf8");
  changed++;
}

console.log(JSON.stringify({ changed, skipped, failed }, null, 2));
