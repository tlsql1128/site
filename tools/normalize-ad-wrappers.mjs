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

function replaceAllYwAdSections(html) {
  let out = html;
  while (true) {
    const s = out.indexOf(`<section class="yw-ad`);
    if (s === -1) break;
    const e = out.indexOf(`</section>`, s);
    if (e === -1) break;
    const block = out.slice(s, e + `</section>`.length);
    if (!block.includes(UNIT)) {
      out = out.slice(0, s) + out.slice(e + `</section>`.length);
      continue;
    }

    const insStart = block.indexOf(`<ins class="kakao_ad_area"`);
    const scriptEnd = block.indexOf(`</script>`, insStart);
    if (insStart === -1 || scriptEnd === -1) {
      // If malformed, just remove to avoid breaking layout
      out = out.slice(0, s) + out.slice(e + `</section>`.length);
      continue;
    }
    const adCode = block.slice(insStart, scriptEnd + `</script>`.length);

    const isSide = block.includes(`ad-side`);
    const cls = isSide ? `ad-block ad-side` : `ad-block`;
    const wrapped = `\n\n    <div class="${cls}">\n${adCode}\n    </div>\n`;

    out = out.slice(0, s) + wrapped + out.slice(e + `</section>`.length);
  }
  return out;
}

let changed = 0;
let skipped = 0;

for (const rel of listTargets()) {
  const abs = path.join(ROOT, rel);
  const before = fs.readFileSync(abs, "utf8");
  if (!before.includes(`<section class="yw-ad`)) {
    skipped++;
    continue;
  }
  const after = replaceAllYwAdSections(before);
  fs.writeFileSync(abs, after, "utf8");
  changed++;
}

console.log(JSON.stringify({ changed, skipped }, null, 2));

