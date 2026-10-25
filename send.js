// Vercel serverless function: emails orders/tickets to the owner via Resend
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const d = req.body || {};
  if (d.bot) return res.status(200).json({ ok: true }); // spam trap
  if (!process.env.RESEND_API_KEY || !process.env.OWNER_EMAIL)
    return res.status(500).json({ ok: false, error: "Missing env vars" });
  const type = d["form-name"] === "orders" ? "New order" : "Support ticket";
  const esc = s => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const rows = Object.entries(d)
    .filter(([k]) => !["bot", "form-name", "file"].includes(k))
    .map(([k, v]) => `<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join("");
  const body = {
    from: "AETHER <onboarding@resend.dev>",
    to: [process.env.OWNER_EMAIL],
    reply_to: d.email,
    subject: `AETHER - ${type} from ${d.name || ""}`.slice(0, 150),
    html: rows
  };
  if (d.file && d.file.data) body.attachments = [{ filename: d.file.name, content: d.file.data }];
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
};
