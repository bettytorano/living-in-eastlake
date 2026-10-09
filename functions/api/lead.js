// Cloudflare Pages Function: receives every form on the site at POST /api/lead.
// 1) Emails the lead to Betty (via Resend)  2) Sends it to Lofty CRM (if configured)
//
// Settings live in Cloudflare Pages > Settings > Variables and Secrets:
//   RESEND_API_KEY  (secret)  API key from resend.com
//   LEAD_TO_EMAIL             where leads are emailed, e.g. betty.torano@exprealty.com
//   LEAD_FROM_EMAIL           sender, e.g. "Living in Eastlake <leads@sellingeastlake.com>"
//   LOFTY_API_KEY   (secret)  optional: Lofty Open API key
//   LOFTY_API_URL             optional: defaults to https://api.lofty.com/v1.0/leads

const FORM_LABELS = {
  "home-value": "Home Value Request",
  "buyer": "Buyer Question",
  "neighborhood": "Neighborhood Question",
  "mello-roos": "Mello-Roos Question",
};

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
  };

  if (!lead.firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return Response.redirect(`${origin}/form-error`, 303);
  }

  const results = await Promise.allSettled([sendEmail(env, lead), sendToLofty(env, lead)]);
  const [emailResult, loftyResult] = results;
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(i === 0 ? "Email failed:" : "Lofty failed:", r.reason);
  });

  // Only show an error if the lead reached neither place
  const emailed = emailResult.status === "fulfilled" && emailResult.value;
  const inLofty = loftyResult.status === "fulfilled" && loftyResult.value;
  if (!emailed && !inLofty) {
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

async function sendToLofty(env, lead) {
  if (!env.LOFTY_API_KEY) return false;
  const label = FORM_LABELS[lead.formType] || "Website Lead";
  const notes = [
    `${label} from SellingEastlake.com`,
    lead.address && `Property: ${lead.address}`,
    lead.neighborhood && `Neighborhood: ${lead.neighborhood}`,
    lead.timeframe && `Timeframe: ${lead.timeframe}`,
    lead.message && `Message: ${lead.message}`,
  ].filter(Boolean).join("\n");

  const res = await fetch(env.LOFTY_API_URL || "https://api.lofty.com/v1.0/leads", {
    method: "POST",
    headers: { Authorization: `token ${env.LOFTY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: lead.firstName,
      lastName: lead.lastName,
      emails: [lead.email],
      phones: lead.phone ? [lead.phone] : [],
      source: "SellingEastlake.com",
      leadTypes: [lead.formType === "home-value" ? 1 : 2], // 1 = seller, 2 = buyer
      note: notes,
    }),
  });
  if (!res.ok) throw new Error(`Lofty ${res.status}: ${await res.text()}`);
  return true;
}
