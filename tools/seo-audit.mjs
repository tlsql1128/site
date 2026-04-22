import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
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
].map((p) => path.join(root, p));

const headingRe = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;

function stripTags(html) {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ");
}

function countCharsNoSpaceKoLike(text) {
  const s = String(text).replace(/\s+/g, "");
  // "실질 콘텐츠" 측정: 공백 제외. (영문/숫자도 제외하려면 아래 return만 조정)
  return s.length;
}

function extractBody(html) {
  const m = String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

function auditFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const body = extractBody(raw);

  const h1s = Array.from(body.matchAll(/<h1\b/gi));
  const headings = Array.from(body.matchAll(headingRe)).map((m) => ({
    level: Number(m[1].slice(1)),
    text: stripTags(m[2]).replace(/\s+/g, " ").trim(),
  }));

  const jumps = [];
  for (let i = 0; i < headings.length; i++) {
    if (i === 0) continue;
    const prev = headings[i - 1].level;
    const cur = headings[i].level;
    if (cur > prev + 1) {
      jumps.push({ from: prev, to: cur, at: i, prevText: headings[i - 1].text, curText: headings[i].text });
    }
  }

  const textNoSpace = countCharsNoSpaceKoLike(stripTags(body));

  return {
    file: path.relative(root, file).replaceAll("\\", "/"),
    h1Count: h1s.length,
    textNoSpace,
    jumpCount: jumps.length,
    firstJumps: jumps.slice(0, 6),
  };
}

const rows = files.map((f) => auditFile(f));
rows.sort((a, b) => a.textNoSpace - b.textNoSpace);

console.log(
  JSON.stringify(
    {
      pages: rows,
      minChars: Math.min(...rows.map((r) => r.textNoSpace)),
    },
    null,
    2
  )
);
