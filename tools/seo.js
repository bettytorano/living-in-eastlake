// Adds search-engine structured data (JSON-LD), FAQ sections and the sitemap.
// Run from the site folder after editing pages:  node tools/seo.js
// It only rewrites the parts between <!-- schema:start/end --> and <!-- faq:start/end -->.

const fs = require("fs");
const path = require("path");

const SITE = "https://sellingeastlake.com";
const REVIEWED = "2026-10-08"; // bump when pages are reviewed
const ROOT = path.join(__dirname, "..");

const agent = {
  "@type": "RealEstateAgent",
  "@id": `${SITE}/#agent`,
  name: "Betty Torano, REALTOR®",
  url: `${SITE}/`,
  telephone: "+1-619-851-6028",
  email: "betty.torano@exprealty.com",
  image: `${SITE}/assets/img/betty-torano.png`,
  description: "Eastlake, Chula Vista real estate agent and Eastlake resident since 1987, helping sellers, buyers and investors in Eastlake and San Diego's South County.",
  address: { "@type": "PostalAddress", streetAddress: "10620 Treena St", addressLocality: "San Diego", addressRegion: "CA", postalCode: "92131", addressCountry: "US" },
  areaServed: [
    { "@type": "Place", name: "Eastlake, Chula Vista, CA" },
    { "@type": "City", name: "Chula Vista, CA" },
    { "@type": "AdministrativeArea", name: "San Diego County, CA" }
  ],
  parentOrganization: { "@type": "Organization", name: "eXp Realty of California, Inc." },
  employee: { "@id": `${SITE}/#betty` },
  sameAs: ["https://www.instagram.com/bettytorano/", "https://bettytorano.com/"]
};

const person = {
  "@type": "Person",
  "@id": `${SITE}/#betty`,
  name: "Betty Torano",
  jobTitle: "REALTOR®",
  worksFor: { "@id": `${SITE}/#agent` },
  homeLocation: { "@type": "Place", name: "Eastlake, Chula Vista, CA" },
  memberOf: [
    { "@type": "Organization", name: "Chula Vista Woman's Club" },
    { "@type": "Organization", name: "The Institute for Luxury Home Marketing" }
  ],
  award: ["Top 5% of REALTORS® in San Diego County, PSAR", "Circle of Excellence Award, SDAR"],
  alumniOf: { "@type": "CollegeOrUniversity", name: "San Diego State University" },
  knowsAbout: ["Eastlake, Chula Vista real estate", "Mello-Roos and HOAs", "Home staging", "Seniors real estate", "Probate and trust sales", "Real estate digital marketing"],
  hasCredential: [
    { "@type": "EducationalOccupationalCredential", credentialCategory: "license", name: "California DRE License #01922296", recognizedBy: { "@type": "GovernmentOrganization", name: "California Department of Real Estate" } },
    { "@type": "EducationalOccupationalCredential", credentialCategory: "designation", name: "Seniors Real Estate Specialist® (SRES®)", recognizedBy: { "@type": "Organization", name: "National Association of REALTORS®" } },
    { "@type": "EducationalOccupationalCredential", credentialCategory: "designation", name: "Master Certified Negotiation Expert (MCNE®)", recognizedBy: { "@type": "Organization", name: "Real Estate Negotiation Institute" } },
    { "@type": "EducationalOccupationalCredential", credentialCategory: "certificate", name: "Probate & Trust Certification", recognizedBy: { "@type": "Organization", name: "California Association of REALTORS®" } }
  ],
  sameAs: ["https://www.instagram.com/bettytorano/"]
};

const website = { "@type": "WebSite", "@id": `${SITE}/#website`, name: "Living in Eastlake", url: `${SITE}/`, publisher: { "@id": `${SITE}/#agent` }, inLanguage: "en-US" };

const NEIGHBORHOODS = [
  ["Eastlake Hills", "eastlake-hills", "Eastlake I"],
  ["Eastlake Shores", "eastlake-shores", "Eastlake I"],
  ["Eastlake Greens", "eastlake-greens", "Eastlake II"],
  ["Eastlake Trails", "eastlake-trails", "Eastlake III"],
  ["Eastlake Trails North", "eastlake-trails-north", "Eastlake III"],
  ["The Woods", "the-woods", "Eastlake III"],
  ["Eastlake Vistas", "eastlake-vistas", "Eastlake III"]
];

// FAQ answers: HTML allowed (links); the schema copy is stripped to text.
const FAQ = {
  "neighborhoods.html": [
    ["What neighborhoods are in Eastlake, Chula Vista?", "Eastlake's residential neighborhoods are Eastlake Hills, Eastlake Shores, Eastlake Greens, Eastlake Trails, Eastlake Trails North, The Woods and Eastlake Vistas. The community also includes the Eastlake Village Center and Business Center."],
    ["How many HOAs does Eastlake have?", "Three master associations. Eastlake I covers the Shores and Hills, Eastlake II covers the Greens, and Eastlake III covers the Trails, Trails North, Vistas and the Woods. Many homes also belong to a smaller sub-association, so always ask for the total monthly dues."],
    ["Do all Eastlake neighborhoods pay Mello-Roos?", "No. It depends on the parcel. Some original neighborhoods have paid off their school Mello-Roos, while city open space maintenance charges, which are assessments rather than Mello-Roos, are designed to continue. See my <a href=\"/mello-roos-eastlake\">Mello-Roos in Eastlake guide</a> for how to check any home."],
    ["Which school districts serve Eastlake?", "Eastlake is served by the Chula Vista Elementary School District for elementary grades and the Sweetwater Union High School District for middle and high school. Boundaries can change, so confirm the assigned schools for a specific address with each district."],
    ["Where can I see homes for sale in a specific Eastlake neighborhood?", "Each neighborhood section on this page has a \"See homes for sale\" button with current listings, or you can <a href=\"https://bettytorano.com/neighborhood/158384753/eastlake\" rel=\"noopener\">search all Eastlake homes</a>."]
  ],
  "buyers-guide.html": [
    ["Does every Eastlake home have Mello-Roos?", "No. Whether a home pays Mello-Roos, and how much, depends on the parcel and when it was built. Check the property tax bill for special tax lines. My <a href=\"/mello-roos-eastlake\">Mello-Roos in Eastlake guide</a> walks through it step by step."],
    ["Are HOA dues and Mello-Roos the same thing?", "No. HOA dues are billed by your association and pay for common areas and amenities. Mello-Roos is a special tax collected on your county property tax bill that pays for schools, infrastructure or ongoing public maintenance."],
    ["How do I find the HOA dues for an Eastlake home?", "Ask for the HOA disclosure documents. In California, sellers in an association must provide them to buyers (Civil Code §4525). Make sure you add the master association and any sub-association together."],
    ["When did the Eastlake schools open?", "EastLake Elementary opened in 1989, Eastlake High School in 1992, and EastLake Middle School in 2003, about 16 years after the first residents moved in."],
    ["Can you help me compare the total monthly cost of two Eastlake homes?", "Yes. I'll line up price, HOA dues, Mello-Roos and other special taxes, and estimated property tax side by side so you can compare the real monthly cost. <a href=\"#ask\">Send me your question</a>."]
  ],
  "home-value.html": [
    ["Is the Eastlake home value report really free?", "Yes. It's free, private and there is no obligation to list or sell."],
    ["How is this different from an online estimate?", "Online estimates can't see your upgrades, your view or your lot, and they don't know whether your neighborhood still pays Mello-Roos. I prepare your report personally using recent Eastlake sales near you."],
    ["How long does it take?", "I review every request personally and usually reply within one business day."],
    ["Do I have to be ready to sell?", "Not at all. Many homeowners just want to know where they stand, for refinancing, planning a move or simple curiosity."]
  ],
  "mello-roos-eastlake.html": [
    ["Does Eastlake have Mello-Roos?", "Yes. Mello-Roos taxes come from Community Facilities Districts (CFDs). In Eastlake these include Sweetwater Union High School District's CFD No. 1 (Eastlake), which funds school facilities, and the City of Chula Vista's CFD 07M, a maintenance district for the Woods and Vistas. Some original neighborhoods have paid off their school Mello-Roos. Separately, the city's Open Space District 101 (Eastlake Maintenance District #1) is an assessment district, not Mello-Roos, even though the county lists it with the CFD charges. Which ones apply depends on the exact parcel."],
    ["Do older Eastlake neighborhoods still pay Mello-Roos?", "Some original neighborhoods have paid off their school Mello-Roos. My Eastlake Hills home paid it for 25 years and then it ended. You may still see a small city open space maintenance assessment on the bill. That is not Mello-Roos, and it is designed to continue permanently."],
    ["What is EASTLK MAINT #1 on my Eastlake property tax bill?", "It is the City of Chula Vista's Eastlake Maintenance District #1 (Open Space District 101), which pays for open space and parkway landscaping, irrigation and lighting in Eastlake Hills, Eastlake Shores, the Village Center, the Business Center and the northern portion of Eastlake Greens. The \"ZN\" letter is your zone. The county may list it with the CFD charges, but it is a city maintenance assessment, not a Mello-Roos tax."],
    ["How do I find out if a home has Mello-Roos?", "Look up the property tax bill at sdttc.com, find the special tax and assessment lines, and call the agency listed for each one to ask the current amount and end date. Buyers should also ask for the Notice of Special Tax."],
    ["Is Mello-Roos the same as HOA dues?", "No. Mello-Roos is a special tax on your county property tax bill. HOA dues are billed separately by your association."],
    ["Will Mello-Roos increase every year?", "It can. Many districts allow a set annual increase, and City of Chula Vista open space assessment increases are capped at the lower of two published inflation measures unless property owners approve more. Ask the agency for the formula for your district."],
    ["Do sellers have to disclose Mello-Roos?", "Yes. California Civil Code §1102.6b requires sellers to make a good-faith effort to get the Notice of Special Tax from each agency that levies a Mello-Roos tax on the home and give it to the buyer."]
  ]
};

// Per-page schema details
const PAGES = {
  "index.html":            { url: "/",                  type: "WebPage",        crumbs: [] },
  "neighborhoods.html":    { url: "/neighborhoods",     type: "CollectionPage", crumbs: [["Neighborhoods", "/neighborhoods"]], places: true },
  "buyers-guide.html":     { url: "/buyers-guide",      type: "WebPage",        crumbs: [["Buyer's Guide", "/buyers-guide"]] },
  "home-value.html":       { url: "/home-value",        type: "WebPage",        crumbs: [["Home Value", "/home-value"]] },
  "eastlake-history.html": { url: "/eastlake-history",  type: "WebPage",        crumbs: [["Eastlake History", "/eastlake-history"]] },
  "mello-roos-eastlake.html": { url: "/mello-roos-eastlake", type: "Article",   crumbs: [["Buyer's Guide", "/buyers-guide"], ["Mello-Roos in Eastlake", "/mello-roos-eastlake"]], published: "2026-10-08" },
  "about.html":            { url: "/about",             type: "ProfilePage",    crumbs: [["About Betty", "/about"]] },
  "privacy.html":          { url: "/privacy",           type: "WebPage",        crumbs: [["Privacy Policy", "/privacy"]] }
};

const strip = s => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);

function replaceBlock(html, name, content) {
  const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
  const block = `<!-- ${name}:start -->\n${content}\n<!-- ${name}:end -->`;
  return re.test(html) ? html.replace(re, block) : null;
}

for (const [file, cfg] of Object.entries(PAGES)) {
  let html = read(file);
  const title = strip((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
  const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const pageUrl = SITE + cfg.url;

  const page = {
    "@type": cfg.type,
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description,
    isPartOf: { "@id": `${SITE}/#website` },
    about: { "@type": "Place", name: "Eastlake, Chula Vista, CA" },
    dateModified: REVIEWED,
    inLanguage: "en-US"
  };
  if (cfg.type === "Article") {
    Object.assign(page, {
      headline: strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || title),
      datePublished: cfg.published,
      author: { "@id": `${SITE}/#betty` },
      publisher: { "@id": `${SITE}/#agent` },
      mainEntityOfPage: pageUrl
    });
  }
  if (cfg.type === "ProfilePage") page.mainEntity = { "@id": `${SITE}/#betty` };
  if (cfg.crumbs.length) page.breadcrumb = { "@id": `${pageUrl}#breadcrumb` };

  const graph = [agent, person, website, page];
  if (cfg.crumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [["Living in Eastlake", "/"], ...cfg.crumbs].map(([name, u], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + u }))
    });
  }
  if (cfg.places) {
    page.mainEntity = {
      "@type": "ItemList",
      itemListElement: NEIGHBORHOODS.map(([name, slug, hoa], i) => ({
        "@type": "ListItem", position: i + 1,
        item: { "@type": "Place", "@id": `${SITE}/neighborhoods#${slug}`, name: `${name}, Chula Vista, CA`, url: `${SITE}/neighborhoods#${slug}`, containedInPlace: { "@type": "Place", name: "Eastlake, Chula Vista, CA" }, description: `${name} is part of the ${hoa} homeowners association in Eastlake, Chula Vista.` }
      }))
    };
  }

  const faqs = FAQ[file];
  if (faqs) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: strip(a) } }))
    });
    const section = `<section class="section alt" id="faq">
  <div class="wrap faq">
    <span class="eyebrow">Questions, answered</span>
    <h2>Frequently asked questions</h2>
${faqs.map(([q, a]) => `    <details>\n      <summary>${q}</summary>\n      <p>${a}</p>\n    </details>`).join("\n")}
  </div>
</section>`;
    const next = replaceBlock(html, "faq", section);
    if (!next) throw new Error(`${file}: missing <!-- faq:start --> / <!-- faq:end --> markers`);
    html = next;
  }

  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2).replace(/</g, "\\u003c");
  const schema = `  <script type="application/ld+json">\n${json}\n  </script>`;
  html = replaceBlock(html, "schema", schema) || html.replace("</head>", `  <!-- schema:start -->\n${schema}\n  <!-- schema:end -->\n</head>`);
  write(file, html);
  console.log("updated", file, faqs ? `(${faqs.length} FAQs)` : "");
}

// Sitemap
const urls = Object.values(PAGES).map(p => `  <url><loc>${SITE}${p.url}</loc><lastmod>${REVIEWED}</lastmod></url>`).join("\n");
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log("updated sitemap.xml");
