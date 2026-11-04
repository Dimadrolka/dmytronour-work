// POST /api/lead: takes the brief form from /services and the service pages.
// Emails the lead to Dmytro and, when CRM_WEBHOOK_URL is set, forwards it to the CRM.
// Env: RESEND_API_KEY, LEAD_TO, LEAD_FROM, CRM_WEBHOOK_URL (all server-side only).

const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}$/;
const ALLOWED_ORIGIN = /^https?:\/\/((www\.)?dmytronour\.work|dmytronour-work[\w-]*\.vercel\.app|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)$/;
const TIMEOUT_MS = 8000;
const SERVICES = new Set(["general", "websites", "automations", "apps", "videos"]);
const SOURCE_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "landing", "referrer"];

const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const oneLine = (value) => value.replace(/[\r\n]+/g, " ");

function readLead(body) {
  const source = {};
  const rawSource = body.source && typeof body.source === "object" ? body.source : {};
  for (const key of SOURCE_KEYS) {
    const value = clean(rawSource[key], 300);
    if (value) source[key] = value;
  }
  const service = clean(body.service, 20);
  return {
    company: oneLine(clean(body.company, 200)),
    email: oneLine(clean(body.email, 254)),
    message: clean(body.message, 4000),
    service: SERVICES.has(service) ? service : "general",
    source,
    received_at: new Date().toISOString(),
  };
}

async function emailLead(lead) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO;
  if (!key || !to) throw new Error("RESEND_API_KEY or LEAD_TO is not set");
  const sourceLines = Object.entries(lead.source).map(([k, v]) => `${k}: ${v}`);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      from: process.env.LEAD_FROM || "Dmytro Nour <leads@creatorzen.ai>",
      to: [to],
      reply_to: lead.email,
      subject: `New brief (${lead.service}): ${lead.company}`,
      text: [`Company: ${lead.company}`, `Email: ${lead.email}`, `Service: ${lead.service}`, "", lead.message, "", ...sourceLines].join("\n"),
    }),
  });
  if (!response.ok) throw new Error(`Resend answered ${response.status}`);
}

async function forwardLead(lead) {
  const url = process.env.CRM_WEBHOOK_URL;
  if (!url) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify(lead),
  });
  if (!response.ok) throw new Error(`CRM answered ${response.status}`);
  return true;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGIN.test(origin)) return res.status(403).json({ error: "forbidden" });

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Bots fill the hidden field; they get a normal answer and nothing is sent.
  if (clean(body.fax, 100)) return res.status(200).json({ ok: true });

  const lead = readLead(body);
  const fields = [];
  if (!lead.company) fields.push("company");
  if (!EMAIL.test(lead.email)) fields.push("email");
  if (!lead.message) fields.push("message");
  if (fields.length) return res.status(400).json({ error: "invalid", fields });

  const [email, crm] = await Promise.allSettled([emailLead(lead), forwardLead(lead)]);
  const delivered = email.status === "fulfilled" || (crm.status === "fulfilled" && crm.value === true);
  if (email.status === "rejected") console.error("lead email failed:", email.reason.message);
  if (crm.status === "rejected") console.error("lead crm forward failed:", crm.reason.message);
  if (!delivered) return res.status(502).json({ error: "not_delivered" });
  return res.status(200).json({ ok: true });
};
