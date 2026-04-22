import fs from "node:fs";

const files = [
  "index.html",
  "subpage/calendar.html",
  "subpage/credit.html",
  "subpage/faq.html",
  "subpage/goal-100m.html",
  "subpage/guide.html",
  "subpage/insurance.html",
  "subpage/living-cost.html",
  "subpage/loan.html",
  "subpage/planner.html",
  "subpage/rent.html",
  "subpage/salary.html",
  "subpage/support.html",
  "subpage/usedcar.html",
  "subpage/youth-savings.html",
];

const tagRe = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;

function extractBody(html) {
  const m = String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

for (const f of files) {
  const raw = fs.readFileSync(f, "utf8");
  const body = extractBody(raw);
  const levels = [];
  let m;
  while ((m = tagRe.exec(body))) {
    levels.push(Number(m[1].slice(1)));
  }
  const h1c = levels.filter((n) => n === 1).length;
  const jumps = [];
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      jumps.push({ at: i, from: levels[i - 1], to: levels[i] });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`${f} — h1×${h1c}, headings=${levels.length}, jumps=${jumps.length}`);
  if (jumps.length) {
    // eslint-disable-next-line no-console
    console.log("  ", jumps.slice(0, 6));
  }
}
