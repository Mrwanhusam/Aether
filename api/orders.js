module.exports = async (req, res) => {
  const base = process.env.SHEET_URL;
  if (!base) return res.status(500).json({ error: "SHEET_URL is not set" });
  try {
    let r;
    if (req.method === "GET") {
      r = await fetch(base + "?token=" + encodeURIComponent(req.query.token || ""));
    } else if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!b || b.action !== "status") return res.status(400).json({ error: "bad request" });
      r = await fetch(base, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(b) });
    } else {
      return res.status(405).end();
    }
    const t = await r.text();
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(t);
  } catch (e) {
    return res.status(502).json({ error: "upstream" });
  }
};
