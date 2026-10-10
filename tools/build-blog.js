// Builds /blog and every post in /blog/ from the data files in tools/.
// To add a post: add an entry to tools/posts-history.js or tools/posts-lofty.js
// (slug, title, short, desc, date YYYY-MM-DD, img, tag, optional reel, body HTML), then run:
//   node tools/build-blog.js && node tools/seo.js
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const SITE = "https://sellingeastlake.com";
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };

const posts = [...require("./posts-history"), ...require("./posts-lofty")]
  .sort((a, b) => b.date.localeCompare(a.date));
const fmt = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const tpl = read("about.html");
function page(file, urlPath, title, desc, ogImage, main) {
  const t = tpl
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}${urlPath}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${urlPath}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${SITE}/assets/img/${ogImage}">`)
    .replace(/\s*<!-- schema:start -->[\s\S]*?<!-- schema:end -->/, "")
    .replace(/<main>[\s\S]*<\/main>/, "<main>" + main + "</main>");
  write(file, t);
}

const reel = id => `<div class="post-reel"><blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/reel/${id}/" data-instgrm-version="14"><a href="https://www.instagram.com/reel/${id}/">Watch on Instagram</a></blockquote></div>`;
const IG = `<script async src="https://www.instagram.com/embed.js"></script>`;
const card = p => `      <a class="blog-card" href="/blog/${p.slug}">
        <div class="blog-card-img"><img src="/assets/img/${p.img}" alt="" width="1200" height="800" loading="lazy"></div>
        <div class="blog-card-body"><span class="tag">${p.tag} · ${fmt(p.date)}</span><h3>${p.short}</h3><span class="blog-card-more">Read more →</span></div>
      </a>`;

for (const p of posts) {
  const related = posts.filter(o => o.slug !== p.slug && o.tag === p.tag).concat(posts.filter(o => o.slug !== p.slug && o.tag !== p.tag)).slice(0, 3);
  const main = `
<section class="hero-light" style="--hero-img: url('/assets/img/${p.img}')">
  <div class="wrap">
    <span class="eyebrow"><a href="/blog">Blog</a> · ${p.tag}</span>
    <h1 class="post-title">${p.title}</h1>
    <p class="reviewed">By Betty Torano, REALTOR® · Eastlake resident since 1987 · ${fmt(p.date)}</p>
  </div>
</section>
<section class="section">
  <div class="wrap post-layout">
    <article class="article post-body">
${p.body}
    </article>
    <aside class="post-aside">
      ${p.reel ? reel(p.reel) : ""}
      <div class="callout">
        <h3 style="margin-top:0">Thinking about Eastlake?</h3>
        <p>Buying, selling or just curious, I'm happy to help.</p>
        <a class="btn btn-square" href="/home-value">What's my home worth? <span aria-hidden="true">↗</span></a>
        <p style="margin:14px 0 0"><a href="tel:+16198516028">Call 619-851-6028</a></p>
      </div>
    </aside>
  </div>
</section>
<section class="section alt">
  <div class="wrap">
    <h2 class="center">More from the blog</h2>
    <div class="grid grid-3 blog-grid">
${related.map(card).join("\n")}
    </div>
  </div>
</section>
${p.reel ? IG : ""}`;
  page(`blog/${p.slug}.html`, `/blog/${p.slug}`, `${p.title} | Living in Eastlake`, p.desc, p.img, main);
}

// Index, grouped by topic
const groups = [["Eastlake Guide", "Eastlake guides"], ["Neighborhoods", "Neighborhoods"], ["Selling", "Selling in Eastlake"], ["Eastlake History", "Eastlake history"], ["Chula Vista", "Around Chula Vista"]];
const featured = `      <a class="blog-card blog-featured" href="/mello-roos-eastlake">
        <div class="blog-card-img"><img src="/assets/img/eastlake-hills.jpg" alt="" width="1200" height="800" loading="lazy"></div>
        <div class="blog-card-body"><span class="tag">Featured guide</span><h3>Mello-Roos in Eastlake: who still pays, what it pays for, and how to check any home</h3><p>The difference between school Mello-Roos and city open space assessments, plus a 10-minute way to check any Eastlake address.</p><span class="blog-card-more">Read the guide →</span></div>
      </a>`;
const index = `
<section class="hero-light" style="--hero-img: url('/assets/img/eastlake-paddleboat.jpg')">
  <div class="wrap">
    <span class="eyebrow">The Living in Eastlake Blog</span>
    <h1>Eastlake stories, guides &amp; insights</h1>
    <p class="lead">Nearly 40 years of Eastlake history, plus practical guides for buying, selling and living here.</p>
    <div class="blog-topics">${groups.filter(([t]) => posts.some(p => p.tag === t)).map(([t, l]) => `<a href="#${t.toLowerCase().replace(/\s+/g, "-")}">${l}</a>`).join("")}</div>
  </div>
</section>
<section class="section">
  <div class="wrap">
${featured}
${groups.filter(([t]) => posts.some(p => p.tag === t)).map(([t, l]) => `    <h2 class="blog-group" id="${t.toLowerCase().replace(/\s+/g, "-")}">${l}</h2>
    <div class="grid grid-3 blog-grid">
${posts.filter(p => p.tag === t).map(card).join("\n")}
    </div>`).join("\n")}
  </div>
</section>
<section class="section lake">
  <div class="wrap center">
    <h2>Have an Eastlake story to share?</h2>
    <p class="lead">Many of these posts started with neighbors' memories. Send me yours, and follow along for new stories.</p>
    <div class="btn-row" style="justify-content:center"><a class="btn btn-square" href="https://www.instagram.com/bettytorano/" rel="noopener">Follow @bettytorano <span aria-hidden="true">↗</span></a><a class="btn secondary" href="mailto:betty.torano@exprealty.com">Email Betty</a></div>
  </div>
</section>`;
page("blog.html", "/blog", "Living in Eastlake Blog | Eastlake History, Guides &amp; Insights", "Eastlake, Chula Vista stories and guides from Betty Torano, an Eastlake resident since 1987: neighborhoods, HOAs, Mello-Roos, selling and community history.", "eastlake-paddleboat.jpg", index);

// Keep tools/seo.js page list in sync
let j = read("tools/seo.js");
j = j.replace(/\n  "blog\/[^"]+\.html": \{[^\n]*\},/g, "");
const entries = posts.map(p => `  "blog/${p.slug}.html": { url: "/blog/${p.slug}", type: "Article", crumbs: [["Blog", "/blog"], [${JSON.stringify(p.short)}, "/blog/${p.slug}"]], published: "${p.date}" },`);
j = j.replace(`  "privacy.html":`, entries.join("\n") + `\n  "privacy.html":`);
write("tools/seo.js", j);

// Remove generated post files that no longer exist in the data
for (const f of fs.readdirSync(path.join(ROOT, "blog"))) {
  if (f.endsWith(".html") && !posts.some(p => p.slug + ".html" === f)) fs.unlinkSync(path.join(ROOT, "blog", f));
}
console.log("built", posts.length, "posts");
