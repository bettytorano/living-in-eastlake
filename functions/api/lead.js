// Cloudflare Pages Function: receives every form on the site at POST /api/lead.
// Emails the lead to Betty (Resend) and, if configured, sends it to Lofty, a Google Sheet backup and GoHighLevel
//
// Settings live in Cloudflare Pages > Settings > Variables and Secrets:
//   RESEND_API_KEY  (secret)  API key from resend.com
//   LEAD_TO_EMAIL             where leads are emailed, e.g. betty.torano@exprealty.com
//   LEAD_FROM_EMAIL           sender, e.g. "Living in Eastlake <leads@sellingeastlake.com>"
//   LOFTY_API_KEY   (secret)  optional: Lofty Open API key
//   LOFTY_API_URL             optional: defaults to https://api.lofty.com/v1.0
//   LEAD_SHEET_URL            optional: Google Apps Script web app URL that logs every lead to a Google Sheet
//   LEAD_SHEET_SECRET (secret) optional: shared password the Apps Script checks (see tools/lead-sheet.gs)
//   GHL_API_KEY     (secret)  optional: GoHighLevel Private Integration token (pit-…),
//                             scopes View + Edit Contacts and View + Edit Opportunities
//   GHL_LOCATION_ID           optional: GoHighLevel sub-account Location ID (Settings > Business Profile)

const FORM_LABELS = {
  "home-value": "Home Value Request",
  "buyer": "Buyer Question",
  "neighborhood": "Neighborhood Question",
  "mello-roos": "Mello-Roos Question",
  "contact": "General Question",
};

// GoHighLevel contact custom fields (Settings > Custom Fields). Option text must match GHL exactly.
const GHL_FIELDS = {
  leadSource: "ArjLCkIs1JUJx50ycvJr",     // Lead Source (single)
  timeframe: "5LAiWX3Hv9WGEX5hhxMt",      // Timeframe (single): same options as the site forms
  area: "c0qzWe2O8O3LVYvPAvI9",           // Area of Interest (multiple): neighborhood names as on the site forms
  clientType: "flIbIllD5VVeEscJ3BU5",     // Client Type (multiple)
};
const GHL_TIMEFRAMES = ["0–3 months", "3–6 months", "6–12 months", "12+ months", "Just curious"];
const GHL_AREAS = ["Eastlake Hills", "Eastlake Shores", "Eastlake Greens", "Eastlake Trails", "Eastlake Trails North",
  "The Woods", "Eastlake Vistas", "Chula Vista", "San Diego County", "Not sure / other"];
// New website leads land here as an opportunity (looked up by name, so renaming in GHL needs a change here)
const GHL_PIPELINE = "Lead Nurture";
const GHL_STAGE = "New Lead";
// Betty's GHL user (Settings > Users): new contacts and pipeline cards are assigned to her
const GHL_OWNER = "egkoA4v6O0SnSFGpLn0S";

export async function onRequestPost({ request, env }) {
  const origin = new URL(request.url).origin;
  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.redirect(`${origin}/form-error`, 303);
  }

  // Spam trap: real people never fill in the hidden "website" field
  if (clean(form.get("website"))) {
    return Response.redirect(`${origin}/thank-you`, 303);
  }

  const lead = {
    formType: clean(form.get("form_type")) || "contact",
    firstName: clean(form.get("first_name")),
    lastName: clean(form.get("last_name")),
    email: clean(form.get("email")),
    phone: clean(form.get("phone")),
    address: clean(form.get("address")),
    neighborhood: clean(form.get("neighborhood")),
    timeframe: clean(form.get("timeframe")),
    message: clean(form.get("message"), 2000),
    page: clean(request.headers.get("referer"), 300),
    // Optional SMS opt-in checkbox (A2P 10DLC): only text leads who checked it
    smsConsent: clean(form.get("sms_consent")) === "yes",
  };

  if (!lead.firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return Response.redirect(`${origin}/form-error`, 303);
  }

  const results = await Promise.allSettled([sendEmail(env, lead), sendToLofty(env, lead), sendToSheet(env, lead), sendToGHL(env, lead)]);
  const names = ["Email", "Lofty", "Sheet", "GHL"];
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(names[i] + " failed:", r.reason);
  });

  // Only show an error if the lead reached none of the places
  const delivered = results.some((r) => r.status === "fulfilled" && r.value);
  if (!delivered) {
    return Response.redirect(`${origin}/form-error`, 303);
  }
  return Response.redirect(`${origin}/thank-you`, 303);
}

function clean(value, max = 200) {
  return (value == null ? "" : String(value)).trim().slice(0, max);
}

async function sendEmail(env, lead) {
  if (!env.RESEND_API_KEY || !env.LEAD_TO_EMAIL) return false;
  const label = FORM_LABELS[lead.formType] || "Website Lead";
  const name = `${lead.firstName} ${lead.lastName}`.trim();
  const lines = [
    `New ${label} from SellingEastlake.com`,
    "",
    `Name: ${name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "-"}`,
    lead.address ? `Property address: ${lead.address}` : null,
    lead.neighborhood ? `Neighborhood: ${lead.neighborhood}` : null,
    lead.timeframe ? `Timeframe: ${lead.timeframe}` : null,
    lead.message ? `Message: ${lead.message}` : null,
    `Text messages OK: ${lead.smsConsent ? "Yes (checked the SMS consent box)" : "No"}`,
    "",
    `Submitted from: ${lead.page || "-"}`,
  ].filter(l => l != null);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.LEAD_FROM_EMAIL || "Living in Eastlake <leads@sellingeastlake.com>",
      to: env.LEAD_TO_EMAIL.split(",").map(s => s.trim()),
      reply_to: lead.email,
      subject: `${label}: ${name}${lead.address ? " – " + lead.address : ""}`,
      text: lines.join("\n"),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return true;
}

// Backup log: one row per lead in a Google Sheet (via the Apps Script in tools/lead-sheet.gs)
async function sendToSheet(env, lead) {
  if (!env.LEAD_SHEET_URL) return false;
  const res = await fetch(env.LEAD_SHEET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The sheet has no SMS column, so the opt-in rides along in the Message column
    body: JSON.stringify({
      secret: env.LEAD_SHEET_SECRET || "",
      label: FORM_LABELS[lead.formType] || "Website Lead",
      ...lead,
      message: [lead.message, `Text messages OK: ${lead.smsConsent ? "Yes" : "No"}`].filter(Boolean).join(" | "),
    }),
    redirect: "follow",
  });
  const text = await res.text();
  if (!res.ok || !/"ok":\s*true/.test(text)) throw new Error(`Sheet ${res.status}: ${text.slice(0, 200)}`);
  return true;
}

// GoHighLevel (LeadConnector API v2): create or update the contact, then add the form details as a note.
// Needs a Private Integration token with "View Contacts" + "Edit Contacts" scopes.
async function sendToGHL(env, lead) {
  if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) return false;
  const base = "https://services.leadconnectorhq.com";
  const headers = {
    Authorization: `Bearer ${env.GHL_API_KEY}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const label = FORM_LABELS[lead.formType] || "Website Lead";
  // Only tag Seller/Buyer when the form makes it clear (home value = seller, Buyer's Guide = buyer)
  const tags = ["SellingEastlake.com", label];
  if (lead.formType === "home-value") tags.push("Seller");
  if (lead.formType === "buyer") tags.push("Buyer");
  if (lead.neighborhood) tags.push(lead.neighborhood);
  if (lead.smsConsent) tags.push("SMS Opt-In");

  const contact = {
    locationId: env.GHL_LOCATION_ID,
    firstName: lead.firstName,
    lastName: lead.lastName || undefined,
    email: lead.email,
    phone: lead.phone || undefined,
    address1: lead.address || undefined,
    source: "SellingEastlake.com",
    assignedTo: GHL_OWNER,
    tags,
  };
  const res = await fetch(`${base}/contacts/upsert`, { method: "POST", headers, body: JSON.stringify(contact) });
  if (!res.ok) throw new Error(`GHL contact ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const id = (await res.json())?.contact?.id;

  if (id) {
    const body = [
      `${label} from SellingEastlake.com`,
      lead.address ? `Property address: ${lead.address}` : null,
      lead.neighborhood ? `Neighborhood: ${lead.neighborhood}` : null,
      lead.timeframe ? `Timeframe: ${lead.timeframe}` : null,
      lead.message ? `Message: ${lead.message}` : null,
      lead.smsConsent
        ? `SMS consent: Yes, checked the text message box on ${new Date().toISOString()} (consent text and terms: https://sellingeastlake.com/privacy#sms)`
        : "SMS consent: No (do not text)",
      lead.page ? `Page: ${lead.page}` : null,
    ].filter(Boolean).join("\n");
    const n = await fetch(`${base}/contacts/${id}/notes`, { method: "POST", headers, body: JSON.stringify({ body }) });
    if (!n.ok) console.error("GHL note failed:", n.status, (await n.text()).slice(0, 200));

    // Custom fields and the pipeline card are extras: a failure is logged but the lead still counts as delivered
    try { await updateGHLFields(base, headers, id, lead); } catch (e) { console.error("GHL fields failed:", e); }
    try { await addGHLOpportunity(base, headers, env.GHL_LOCATION_ID, id, lead, label); } catch (e) { console.error("GHL opportunity failed:", e); }
  }
  return true;
}

// Fill Lead Source, Timeframe, Area of Interest and Client Type without wiping what Betty set by hand:
// Lead Source only if empty, Area and Client Type are added to the existing picks, Timeframe takes the newest answer.
async function updateGHLFields(base, headers, id, lead) {
  const res = await fetch(`${base}/contacts/${id}`, { headers });
  if (!res.ok) throw new Error(`get contact ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const current = {};
  for (const f of (await res.json())?.contact?.customFields || []) current[f.id] = f.value;
  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const addTo = (fieldId, value) => {
    const had = list(current[fieldId]);
    return had.includes(value) ? null : { id: fieldId, field_value: [...had, value] };
  };

  const fields = [];
  if (!current[GHL_FIELDS.leadSource]) fields.push({ id: GHL_FIELDS.leadSource, field_value: "SellingEastlake.com" });
  if (GHL_TIMEFRAMES.includes(lead.timeframe)) fields.push({ id: GHL_FIELDS.timeframe, field_value: lead.timeframe });
  if (GHL_AREAS.includes(lead.neighborhood)) fields.push(addTo(GHL_FIELDS.area, lead.neighborhood));
  const type = lead.formType === "home-value" ? "Seller" : lead.formType === "buyer" ? "Buyer" : null;
  if (type) fields.push(addTo(GHL_FIELDS.clientType, type));
  const customFields = fields.filter(Boolean);
  if (!customFields.length) return;

  const put = await fetch(`${base}/contacts/${id}`, { method: "PUT", headers, body: JSON.stringify({ customFields }) });
  if (!put.ok) throw new Error(`update contact ${put.status}: ${(await put.text()).slice(0, 200)}`);
}

// One open card per contact in Lead Nurture > New Lead (a repeat form submission doesn't add a second card)
async function addGHLOpportunity(base, headers, locationId, contactId, lead, label) {
  const p = await fetch(`${base}/opportunities/pipelines?locationId=${locationId}`, { headers });
  if (!p.ok) throw new Error(`pipelines ${p.status}: ${(await p.text()).slice(0, 200)}`);
  const pipeline = ((await p.json())?.pipelines || []).find((x) => x.name === GHL_PIPELINE);
  if (!pipeline) throw new Error(`pipeline "${GHL_PIPELINE}" not found`);
  const stage = (pipeline.stages || []).find((s) => s.name === GHL_STAGE) || (pipeline.stages || [])[0];

  const q = new URLSearchParams({ location_id: locationId, contact_id: contactId, pipeline_id: pipeline.id, status: "open" });
  const s = await fetch(`${base}/opportunities/search?${q}`, { headers });
  if (!s.ok) throw new Error(`search ${s.status}: ${(await s.text()).slice(0, 200)}`);
  if (((await s.json())?.opportunities || []).length) return;

  const name = `${lead.firstName} ${lead.lastName}`.trim();
  const res = await fetch(`${base}/opportunities/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      locationId,
      pipelineId: pipeline.id,
      pipelineStageId: stage?.id,
      contactId,
      name: `${name} – ${label}`,
      status: "open",
      assignedTo: GHL_OWNER,
      source: "SellingEastlake.com",
    }),
  });
  if (!res.ok) throw new Error(`create ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendToLofty(env, lead) {
  if (!env.LOFTY_API_KEY) return false;
  const base = (env.LOFTY_API_URL || "https://api.lofty.com/v1.0").replace(/\/leads\/?$/, "");
  const headers = { Authorization: `token ${env.LOFTY_API_KEY}`, "Content-Type": "application/json" };
  const label = FORM_LABELS[lead.formType] || "Website Lead";

  // 1) Create the lead (Lofty lead types: Seller = 1, Buyer = 2)
  const res = await fetch(`${base}/leads`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      firstName: lead.firstName,
      lastName: lead.lastName,
      emails: [lead.email],
      phones: lead.phone ? [lead.phone.replace(/[^\d+]/g, "").slice(0, 20)] : [],
      leadTypes: [lead.formType === "home-value" ? 1 : 2],
      source: "SellingEastlake.com",
      tags: ["SellingEastlake.com", label],
      leadAlert: true,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Lofty ${res.status}: ${text}`);

  // 2) Attach the form details as a note. Lead IDs are 64-bit, so keep the ID as text.
  const id = (text.match(/"(?:leadId|id)"\s*:\s*"?(\d+)/) || [])[1];
  const notes = [
    `${label} from SellingEastlake.com`,
    lead.address && `Property: ${lead.address}`,
    lead.neighborhood && `Neighborhood: ${lead.neighborhood}`,
    lead.timeframe && `Timeframe: ${lead.timeframe}`,
    lead.message && `Message: ${lead.message}`,
    `Text messages OK: ${lead.smsConsent ? "Yes" : "No"}`,
    lead.page && `Page: ${lead.page}`,
  ].filter(Boolean).join("\n");
  if (id) {
    const noteRes = await fetch(`${base}/notes`, {
      method: "POST",
      headers,
      body: `{"leadId":${id},"content":${JSON.stringify(notes)},"isPin":false}`,
    });
    if (!noteRes.ok) console.error("Lofty note failed:", noteRes.status, await noteRes.text());
  }
  return true;
}
