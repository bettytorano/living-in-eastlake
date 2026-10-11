// Title-case the text of every <h2> section heading (Betty prefers Title Case). Safe to run repeatedly.
// Usage: node tools/titlecase.js [--dry] *.html tools/build-blog.js tools/posts-history.js tools/posts-lofty.js tools/seo.js
const fs = require("fs");
const args = process.argv.slice(2);
const dry = args[0] === "--dry";
const files = dry ? args.slice(1) : args;
const minor = new Set(["a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "at", "by", "in", "of", "on", "to", "as", "vs", "vs.", "via", "per", "from", "with", "into", "over"]);

function capWord(w) {
  // capitalize first letter after any leading punctuation; keep the rest as written (HOA, MCNE®, III stay)
  return w.replace(/^([^A-Za-z0-9]*)([a-z])/, (m, p, c) => p + c.toUpperCase());
}
function titleText(text, state) {
  // split on whitespace, keeping separators; hyphenated parts each capitalized
  return text.replace(/\S+/g, (word) => {
    const bare = word.replace(/^[^A-Za-z]+|[^A-Za-z.]+$/g, "").toLowerCase();
    const first = state.first;
    const afterColon = state.colon;
    state.first = false;
    state.colon = /[:?!]["”’)]*$/.test(word);
    if (/^(https?:|www\.)/.test(word) || /^&[a-z]+;$/.test(word)) return word;
    if (!first && !afterColon && minor.has(bare) && !state.isLast(word)) return word.toLowerCase() === word ? word : word;
    return word.split("-").map(capWord).join("-");
  });
}
function convert(inner) {
  // only touch text outside tags
  const parts = inner.split(/(<[^>]+>)/);
  const textWords = parts.filter(p => !p.startsWith("<")).join(" ").trim().split(/\s+/).filter(Boolean);
  const lastWord = textWords[textWords.length - 1];
  let seen = 0;
  const state = { first: true, colon: false, isLast: (w) => w === lastWord && seen === textWords.length };
  return parts.map(p => {
    if (p.startsWith("<")) return p;
    return p.replace(/\S+/g, (w) => { seen++; return titleText(w, state); });
  }).join("");
}
let changes = 0;
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  const out = s.replace(/(<h2\b[^>]*>)([\s\S]*?)(<\/h2>)/g, (m, a, inner, z) => {
    if (inner.includes("${")) {
      // template literal: only convert literal text segments around ${...}
      const segs = inner.split(/(\$\{[^}]*\})/);
      const conv = segs.map((seg, i) => seg.startsWith("${") ? seg : convert(seg)).join("");
      if (conv !== inner) { changes++; if (dry) console.log(f + ": " + inner.trim() + "  =>  " + conv.trim()); }
      return a + conv + z;
    }
    const conv = convert(inner);
    if (conv !== inner) { changes++; if (dry) console.log(f + ": " + inner.replace(/<[^>]+>/g, "").trim() + "  =>  " + conv.replace(/<[^>]+>/g, "").trim()); }
    return a + conv + z;
  });
  if (!dry && out !== s) fs.writeFileSync(f, out);
}
console.log(changes + " headings " + (dry ? "would change" : "changed"));
