const codesModule = require("../codes.js");
const CODES = codesModule.CODES || codesModule;
const calcDiscount = codesModule.calcDiscount;
const codeProblem = codesModule.codeProblem;

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

    const def = CODES ? CODES[code] : null;
    const now = new Date();
    const problem = typeof codeProblem === "function" 
      ? codeProblem(def, subtotal, now) 
      : (!def ? "Invalid discount code." : "");

    if (problem) {
      return res.status(400).json({ problem });
    }

    const discount = typeof calcDiscount === "function" 
      ? calcDiscount(def, subtotal, shipping, now) 
      : 0;

    // بنرجع للمتصفح بيانات الكود ده بس علشان باقي الأكواد تفضل سرية في السيرفر
    return res.status(200).json({
      ok: true,
      code,
      discount,
      def: { pct: def.pct, ship: def.ship, min: def.min, exp: def.exp }
    });
  } catch (err) {
    return res.status(500).json({ problem: "Server error checking code." });
  }
};
