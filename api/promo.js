// api/promo.js

// 1. قائمة الأكواد السرية (مستحيل تظهر للمتصفح نهائياً)
const CODES = {
  "SYSTEM10": { pct: 10, min: 800 },
  "FAM20": { pct: 20, once: true, min: 1200 },
  "FAMI20": { pct: 20, once: false },
  "FAMIL30": { pct: 30, once: false },
  "FAMILY50": { pct: 50, once: false }
};
// 2. دوال الحساب والتأكد من شروط الكود
function calcDiscount(def, sub, sh) {
  if (!def) return 0;
  let d = 0;
  if (def.pct) d += Math.round((sub * def.pct) / 100);
  if (def.ship) d += sh;
  return Math.min(d, sub + sh);
}

function codeProblem(def, sub, now) {
  if (!def) return "Invalid discount code.";
  if (def.exp && now > new Date(def.exp + "T23:59:59")) return "This code has expired.";
  if (def.min && sub < def.min) return `Minimum order is ${def.min} EGP for this code.`;
  return "";
}

// 3. مسار السيرفر
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ problem: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const code = String(body.code || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;
    const shipping = Number(body.shipping) || 0;

    if (!code) {
      return res.status(400).json({ problem: "Please enter a discount code." });
    }

    const def = CODES[code];
    const now = new Date();
    const problem = codeProblem(def, subtotal, now);

    if (problem) {
      return res.status(400).json({ problem });
    }

    const discount = calcDiscount(def, subtotal, shipping, now);

    return res.status(200).json({
      ok: true,
      code,
      discount,
      def: { pct: def.pct, ship: def.ship, min: def.min, exp: def.exp }
    });
  } catch (err) {
    return res.status(500).json({ problem: "Error calculating discount." });
  }
};
