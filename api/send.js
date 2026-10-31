module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const d = req.body || {};
  if (d.bot) return res.status(200).json({ ok: true });
  if (!process.env.RESEND_API_KEY || !process.env.OWNER_EMAIL)
    return res.status(500).json({ ok: false, error: "Missing env vars" });
  const type = d["form-name"] === "orders" ? "New order" : "Support ticket";
  const esc = s => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const rows = Object.entries(d)
    .filter(([k]) => !["bot", "form-name", "file"].includes(k))
    .map(([k, v]) => `<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join("");

  // Discount codes: validate, and enforce one-time codes (checked against the sheet)
  let codeNote = "";
  if (type === "New order" && d.promo) {
    const { CODES } = require("../codes.js");
    const code = String(d.promo).toUpperCase(), def = CODES[code];
    if (!def) return res.status(400).json({ ok: false, error: "bad_code" });
    if (def.once) {
      if (!process.env.SHEET_URL || !process.env.SHEET_TOKEN) {
        codeNote = "Code check skipped: SHEET_TOKEN is not set in Vercel";
      } else {
        try {
          const u = process.env.SHEET_URL + "?token=" + encodeURIComponent(process.env.SHEET_TOKEN) +
            "&action=codeused&code=" + encodeURIComponent(code) +
            "&phone=" + encodeURIComponent(d.phone || "") + "&email=" + encodeURIComponent(d.email || "");
          const j = await (await fetch(u)).json();
          if (j.used) return res.status(409).json({ ok: false, error: "code_used" });
          if (j.error) codeNote = "Code check failed: " + j.error;
        } catch (e) { codeNote = "Code check failed: " + e.message; }
      }
    }
  }

  // Save to Google Sheets and report the result inside the email (for debugging)
  let sheetNote = "Sheet: SHEET_URL is not set in Vercel";
  if (process.env.SHEET_URL) {
    try {
      const sr = await fetch(process.env.SHEET_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ ...d, file: undefined }),
        redirect: "follow"
      });
      const t = (await sr.text()).replace(/<[^>]*>/g, " ").trim().slice(0, 150);
      sheetNote = `Sheet: HTTP ${sr.status} - ${t}`;
    } catch (e) {
      sheetNote = "Sheet error: " + e.message;
    }
  }

  const body = {
    from: "EATHER <onboarding@resend.dev>",
    to: [process.env.OWNER_EMAIL],
    reply_to: d.email,
    subject: `EATHER - ${type} from ${d.name || ""}`.slice(0, 150),
    html: rows + `<hr><p><i>${esc(sheetNote)}</i></p>` + (codeNote ? `<p><i>${esc(codeNote)}</i></p>` : "")
  };
  if (d.file && d.file.data) body.attachments = [{ filename: d.file.name, content: d.file.data }];
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
};
