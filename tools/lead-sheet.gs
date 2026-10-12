// Google Apps Script: saves every website lead as a new row in this Google Sheet.
// Setup (one time):
//  1. Create a Google Sheet named "SellingEastlake Leads".
//  2. Extensions > Apps Script. Delete what's there, paste this whole file, click Save.
//  3. Change SECRET below to a password of your choice (letters and numbers).
//  4. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy, then Authorize.
//  5. Copy the Web app URL. In Cloudflare (Workers & Pages > living-in-eastlake > Settings > Variables and Secrets) add:
//       LEAD_SHEET_URL    = the Web app URL
//       LEAD_SHEET_SECRET = the same password as SECRET below (type: Secret)
//     Then redeploy the site.

const SECRET = "change-me";
const HEADERS = ["Date", "Form", "First name", "Last name", "Email", "Phone", "Property address", "Neighborhood", "Timeframe", "Message", "Page"];

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad json" });
  }
  if (data.secret !== SECRET) return reply({ ok: false, error: "unauthorized" });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  // A leading apostrophe keeps phone numbers and anything starting with = + - @ as plain text
  const safe = (v) => {
    const s = v == null ? "" : String(v);
    return /^[=+\-@]/.test(s) || /^\d/.test(s) ? "'" + s : s;
  };
  sheet.appendRow([
    new Date(),
    data.label || data.formType || "",
    safe(data.firstName), safe(data.lastName), safe(data.email), safe(data.phone),
    safe(data.address), safe(data.neighborhood), safe(data.timeframe), safe(data.message), safe(data.page)
  ]);
  return reply({ ok: true });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
