/* AETHER discount codes. Shared by the website (promo.js) and the server (api/send.js).
   Edit your codes HERE ONLY. Rename the four codes below to whatever you like (UPPERCASE, no spaces).
   pct = percent off the products | ship = free shipping
   once = each customer (same phone or email) can use it one time only, unless you allow it again from the dashboard
   min = minimum order in EGP (optional) | exp = last valid day, YYYY-MM-DD (optional) */
const CODES = {
  "CODE10": { pct: 10 },
  "CODE20": { pct: 20, once: true },
  "CODE30": { pct: 30, once: true },
  "CODE50": { pct: 50, once: true }
};

function calcDiscount(c, sub, sh, now) {
  if (!c) return 0;
  if (c.min && sub < c.min) return 0;
  if (c.exp && now > new Date(c.exp + "T23:59:59")) return 0;
  let d = 0;
  if (c.pct) d = Math.round(sub * c.pct / 100);
  if (c.ship) d = sh;
  return d;
}
function codeProblem(c, sub, now) {
  if (!c) return "This code is not valid.";
  if (c.exp && now > new Date(c.exp + "T23:59:59")) return "This code has expired.";
  if (c.min && sub < c.min) return "Minimum order for this code is " + c.min + " EGP.";
  return "";
}
if (typeof module !== "undefined") module.exports = { CODES, calcDiscount, codeProblem };
