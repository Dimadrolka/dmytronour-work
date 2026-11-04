// Standalone Google Apps Script for the "Dmytro Nour — B2B Outreach CRM (Live)" sheet.
// Takes a lead from /api/lead and writes it to Leads + Activity log.
// Deploy as a web app (execute as me, access: anyone) and put the URL, with ?token=..., into CRM_WEBHOOK_URL on Vercel.
// The deployed copy holds the real token; never commit it.
var LEAD_TOKEN = "PASTE_TOKEN_HERE";
var CRM_SHEET_ID = "1Xf483N9eO5ObK_i_nrZ4yx6LImAopIvT28oVePRIgfE";

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function domainKey_(value) {
  var text = String(value || "").trim().toLowerCase();
  if (text.indexOf("@") > -1) text = text.split("@").pop();
  return text.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}

function isUrlLike_(value) {
  return /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(String(value || "").trim());
}

// Fill only empty, non-formula cells, so hand edits and formula columns survive.
function setIfEmpty_(sheet, row, column, value) {
  if (!column || value === "" || value === undefined) return;
  var cell = sheet.getRange(row, column);
  if (!cell.getFormula() && cell.getValue() === "") cell.setValue(value);
}

function doPost(e) {
  if (!e.parameter || e.parameter.token !== LEAD_TOKEN) return json_({ error: "forbidden" });

  var lead = JSON.parse(e.postData.contents);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var book = SpreadsheetApp.openById(CRM_SHEET_ID);
    var sheet = book.getSheetByName("Leads");
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var col = {};
    headers.forEach(function (name, i) { col[name] = i + 1; });

    var now = new Date();
    var website = isUrlLike_(lead.company) ? lead.company : "";
    var key = domainKey_(website || lead.email);
    var free = /^(gmail|googlemail|yahoo|hotmail|outlook|icloud|proton|protonmail|mail|ukr|live)\./.test(key);
    var source = Object.keys(lead.source || {}).map(function (k) { return k + ": " + lead.source[k]; }).join("; ");
    var note = "Inbound brief " + lead.received_at + ": " + lead.message + (source ? " [" + source + "]" : "");

    // Row of this company if it is already in the CRM, otherwise the first free row.
    var last = sheet.getMaxRows();
    var ids = sheet.getRange(2, col["Lead ID"], last - 1, 1).getValues();
    var keys = sheet.getRange(2, col["Domain key"], last - 1, 1).getValues();
    var mails = sheet.getRange(2, col["Public business email"], last - 1, 1).getValues();
    var row = 0, firstFree = 0;
    for (var i = 0; i < ids.length; i++) {
      if (!row && ((!free && key && keys[i][0] === key) || mails[i][0] === lead.email)) row = i + 2;
      if (!firstFree && ids[i][0] === "") firstFree = i + 2;
    }
    var existing = row > 0;
    if (!existing) {
      row = firstFree || sheet.getLastRow() + 1;
      setIfEmpty_(sheet, row, col["Lead ID"], "IN-" + Utilities.formatDate(now, "UTC", "yyyyMMdd-HHmmss"));
      setIfEmpty_(sheet, row, col["Company"], website ? "" : lead.company);
      setIfEmpty_(sheet, row, col["Website"], website);
      setIfEmpty_(sheet, row, col["Recommended service"], lead.service);
      setIfEmpty_(sheet, row, col["Public business email"], lead.email);
      setIfEmpty_(sheet, row, col["Domain key"], free ? "" : key);
    }
    sheet.getRange(row, col["Pipeline status"]).setValue("Replied");
    sheet.getRange(row, col["Reply date"]).setValue(now);
    sheet.getRange(row, col["Next action"]).setValue("Reply to the inbound brief");
    sheet.getRange(row, col["Next action date"]).setValue(now);
    var notes = sheet.getRange(row, col["Notes"]);
    notes.setValue(notes.getValue() ? notes.getValue() + "\n" + note : note);

    book.getSheetByName("Activity log").appendRow([now, lead.company, lead.email, "Inbound brief", "", "", existing ? "Existing lead updated" : "New lead", lead.service + ": " + lead.message]);
    return json_({ ok: true, row: row });
  } finally {
    lock.releaseLock();
  }
}
