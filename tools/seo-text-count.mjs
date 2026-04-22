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

function extractBody(html) {
  const m = String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

function textNoSpace(body) {
  return String(body)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, "");
}

const rows = files.map((f) => {
  const n = textNoSpace(extractBody(fs.readFileSync(f, "utf8"))).length;
  return { file: f, textNoSpace: n, ok: n >= 1500 };
});
rows.sort((a, b) => a.textNoSpace - b.textNoSpace);
// eslint-disable-next-line no-console
console.log(JSON.stringify({ min: rows[0], rows }, null, 2));
