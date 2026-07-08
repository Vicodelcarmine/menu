/* ============================================================================
   VICO DEL CARMINE — "MAGAZZINO" DATI (Supabase)
   ----------------------------------------------------------------------------
   Collega l'editor nascosto (prezzi & foto) a un database Supabase.
   I clienti LEGGONO il menu; lo staff SCRIVE solo con la password giusta.

   ⚠️ DA COLLEGARE: crea un NUOVO progetto Supabase e incolla qui sotto
      il suo URL e la chiave "publishable" (vedi README → "Collegare Supabase").
      La chiave publishable è pubblica: è fatta apposta per stare nel sito.

   Finché non è collegato, il menu funziona lo stesso: mostra i dati di
   menu-data.js e l'editor avvisa "Supabase non ancora collegato".
   ========================================================================== */
const Store = (function () {
  "use strict";

  // Progetto Supabase di Vico del Carmine (la chiave "publishable" è pubblica: OK nel sito)
  const SUPABASE_URL = "https://agbvmhpktilpaoabjkre.supabase.co";
  const SUPABASE_KEY = "sb_publishable_2O5l8ZbQqGnwDXwxZnsZ2Q_0Mt1V8T7";

  const REST = SUPABASE_URL + "/rest/v1";
  const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
  const configured = SUPABASE_URL.indexOf("INCOLLA") === -1;

  async function rpc(fn, body) {
    if (!configured) throw new Error("Supabase non configurato");
    const r = await fetch(REST + "/rpc/" + fn, { method: "POST", headers: headers, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("Supabase rpc " + fn + " -> " + r.status);
    return r.json();
  }

  async function readContent(key) {
    if (!configured) return null;
    const r = await fetch(REST + "/menu_content?key=eq." + key + "&select=data", { headers: { apikey: SUPABASE_KEY } });
    if (!r.ok) return null;
    const rows = await r.json();
    const d = rows[0] && rows[0].data;
    return d && Object.keys(d).length ? d : null;
  }

  // Ridimensiona e comprime una foto prima del caricamento:
  // lato lungo max 1200px, JPEG qualità ~0.82 → tipicamente 100–300 KB (leggera e uniforme).
  function compressImage(file, maxSize, quality) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        let w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) { reject(new Error("dimensioni non valide")); return; }
        if (Math.max(w, h) > maxSize) {
          if (w >= h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          if (blob && blob.size > 0) resolve(blob);
          else reject(new Error("compressione fallita"));
        }, "image/jpeg", quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("immagine non leggibile")); };
      img.src = url;
    });
  }

  return {
    // ritorna 'titolare' | 'staff' | null
    verifyPassword: function (pwd) { return rpc("verify_pw", { pwd: pwd }); },

    // Modifiche pubblicate a prezzi/foto: { "slug::nome": { prezzo, image } }
    getOverrides: function () { return readContent("overrides"); },
    saveOverrides: function (data, pwd) { return rpc("save_overrides", { new_data: data, pwd: pwd }); },

    // Carica una foto nel bucket 'foto' (ridimensionata+compressa) → indirizzo pubblico
    uploadPhoto: async function (file) {
      if (!configured) throw new Error("Supabase non configurato");
      // 1) alleggerisci l'immagine (con fallback all'originale se non comprimibile)
      let body = file, ctype = file.type || "image/jpeg", ext;
      try {
        body = await compressImage(file, 1200, 0.82); ctype = "image/jpeg"; ext = "jpg";
      } catch (e) {
        ext = ((file.name || "").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      }
      // 2) nome file pulito e univoco
      const base = (file.name || "foto").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "foto";
      const name = Date.now() + "-" + base + "." + ext;
      // 3) carica
      const r = await fetch(SUPABASE_URL + "/storage/v1/object/foto/" + name, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": ctype, "x-upsert": "true" },
        body: body,
      });
      if (!r.ok) throw new Error("upload " + r.status);
      return SUPABASE_URL + "/storage/v1/object/public/foto/" + name;
    },
  };
})();
