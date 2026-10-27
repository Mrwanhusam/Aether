/* AETHER discount codes. Add this line before </body> in index.html (after the main script):
   <script src="codes.js"></script><script src="promo.js"></script> */

/* The codes and their rules live in codes.js (load it before this file). */

(function () {
  let cur = null; // the applied code: { code, def }
  // When the server says a one-time code was already used, show a clear message.
  let blocked = false;
  const f0 = window.fetch;
  window.fetch = async function (...a) {
    const r = await f0.apply(this, a);
    if (r.status === 409 && String(a[0]).indexOf("/api/send") > -1) blocked = true;
    return r;
  };
  const t0 = window.toast;
  window.toast = function (m) {
    if (blocked) { blocked = false; m = "This code has already been used and can't be used again."; }
    t0(m);
  };
  $("#of").insertAdjacentHTML("beforeend", '<input type="hidden" name="promo" id="oc"><input type="hidden" name="discount" id="od">');
  $("#sum").insertAdjacentHTML("beforebegin", '<div id="pbox" style="margin:14px 0 6px"><div style="display:flex;gap:8px"><input id="pc" placeholder="Discount code" autocapitalize="characters" autocomplete="off" style="flex:1"><button class="btn o" id="pa" type="button" style="width:auto;display:inline-block;padding:10px 18px">Apply</button></div><p class="note" id="pn" aria-live="polite"></p></div>');

  const base = upd;
  window.upd = function () {
    base();
    if (!cart.length) { cur = null; $("#pc").value = ""; $("#pn").textContent = ""; }
    const sub = total(), sh = cart.length ? zone().c : 0, now = new Date();
    let d = 0;
    if (cur) {
      const pr = codeProblem(cur.def, sub, now);
      if (pr) { $("#pn").textContent = pr; cur = null; }
      else d = calcDiscount(cur.def, sub, sh, now);
    }
    if (cart.length) {
      $("#sum").innerHTML =
        `<div class="li"><span>Subtotal</span><span>${price(sub)}</span></div>` +
        `<div class="li"><span>Shipping</span><span>${price(sh)}</span></div>` +
        (d ? `<div class="li"><span>Code ${cur.code}</span><span>-${price(d)}</span></div>` : "") +
        `<div class="li"><b>Total</b><b>${price(sub + sh - d)}</b></div>`;
      $("#ot").value = `${sub + sh - d} EGP`;
      if (d) $("#oo").value += ` | Code ${cur.code} (-${d} EGP)`;
    }
    $("#oc").value = d ? cur.code : "";
    $("#od").value = d;
  };

  $("#pa").onclick = () => {
    const code = $("#pc").value.trim().toUpperCase();
    if (!code) return;
    if (!cart.length) { $("#pn").textContent = "Add something to your cart first."; return; }
    const def = CODES[code], pr = codeProblem(def, total(), new Date());
    if (pr) { cur = null; $("#pn").textContent = pr; }
    else { cur = { code, def }; $("#pn").textContent = "Code applied."; }
    upd();
  };
  upd();
})();
