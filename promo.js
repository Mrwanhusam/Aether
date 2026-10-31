/* EATHER discount codes */

(function () {
  // منع إنشاء خانة الخصم أكثر من مرة
  if (document.getElementById("pbox")) return;

  let cur = null; // the applied code: { code, def }

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

  const ofForm = document.getElementById("of");
  if (ofForm && !document.getElementById("oc")) {
    ofForm.insertAdjacentHTML("beforeend", '<input type="hidden" name="promo" id="oc"><input type="hidden" name="discount" id="od">');
  }

  const sumBox = document.getElementById("sum");
  if (sumBox && !document.getElementById("pbox")) {
    sumBox.insertAdjacentHTML("beforebegin", '<div id="pbox" style="margin:14px 0 6px"><div style="display:flex;gap:8px"><input id="pc" placeholder="Discount code" autocapitalize="characters" autocomplete="off" style="flex:1"><button class="btn o" id="pa" type="button" style="width:auto;display:inline-block;padding:10px 18px">Apply</button></div><p class="note" id="pn" aria-live="polite"></p></div>');
  }

  const base = upd;
  window.upd = function () {
    base();
    if (!cart.length) { cur = null; const pc = document.getElementById("pc"), pn = document.getElementById("pn"); if (pc) pc.value = ""; if (pn) pn.textContent = ""; }
    const sub = total(), sh = cart.length ? zone().c : 0, now = new Date();
    let d = 0;
    if (cur) {
      const pr = codeProblem(cur.def, sub, now);
      const pn = document.getElementById("pn");
      if (pr) { if (pn) pn.textContent = pr; cur = null; }
      else d = calcDiscount(cur.def, sub, sh, now);
    }
    if (cart.length) {
      const sum = document.getElementById("sum");
      if (sum) {
        sum.innerHTML =
          `<div class="li"><span>Subtotal</span><span>${price(sub)}</span></div>` +
          `<div class="li"><span>Shipping</span><span>${price(sh)}</span></div>` +
          (d ? `<div class="li"><span>Code ${cur.code}</span><span>-${price(d)}</span></div>` : "") +
          `<div class="li"><b>Total</b><b>${price(sub + sh - d)}</b></div>`;
      }
      const ot = document.getElementById("ot");
      if (ot) ot.value = `${sub + sh - d} EGP`;
      const oo = document.getElementById("oo");
      if (d && oo) oo.value += ` | Code ${cur.code} (-${d} EGP)`;
    }
    const oc = document.getElementById("oc");
    const od = document.getElementById("od");
    if (oc) oc.value = d ? cur.code : "";
    if (od) od.value = d;
  };

  const paBtn = document.getElementById("pa");
  if (paBtn) {
    paBtn.onclick = async () => {
      const pc = document.getElementById("pc");
      const pn = document.getElementById("pn");
      const code = pc ? pc.value.trim().toUpperCase() : "";
      if (!code) return;
      if (!cart.length) { if (pn) pn.textContent = "Add something to your cart first."; return; }
      
      paBtn.disabled = true;
      if (pn) pn.textContent = "Checking code...";

      try {
        const sub = total(), sh = cart.length ? zone().c : 0;
        const res = await f0("/api/promo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotal: sub, shipping: sh })
        });
        const data = await res.json();
        
        if (!res.ok || data.problem) {
          cur = null;
          if (pn) pn.textContent = data.problem || "Invalid discount code.";
        } else {
          cur = { code: data.code, def: data.def };
          if (pn) pn.textContent = "Code applied.";
        }
      } catch (e) {
        cur = null;
        if (pn) pn.textContent = "Error validating code.";
      } finally {
        paBtn.disabled = false;
        upd();
      }
    };
  }

  upd();
})();
