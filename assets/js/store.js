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

  // 👇 SOSTITUISCI con i dati del NUOVO progetto Supabase di Vico del Carmine
  const SUPABASE_URL = "https://INCOLLA-QUI.supabase.co";
  const SUPABASE_KEY = "sb_publishable_INCOLLA_QUI";

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

  return {
    // ritorna 'titolare' | 'staff' | null
    verifyPassword: function (pwd) { return rpc("verify_pw", { pwd: pwd }); },

    // Modifiche pubblicate a prezzi/foto: { "slug::nome": { prezzo, image } }
    getOverrides: function () { return readContent("overrides"); },
    saveOverrides: function (data, pwd) { return rpc("save_overrides", { new_data: data, pwd: pwd }); },

    // Carica una foto nel bucket 'foto' e restituisce l'indirizzo pubblico
    uploadPhoto: async function (file) {
      if (!configured) throw new Error("Supabase non configurato");
      const clean = file.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase();
      const name = Date.now() + "-" + clean;
      const r = await fetch(SUPABASE_URL + "/storage/v1/object/foto/" + name, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": file.type || "image/jpeg", "x-upsert": "true" },
        body: file,
      });
      if (!r.ok) throw new Error("upload " + r.status);
      return SUPABASE_URL + "/storage/v1/object/public/foto/" + name;
    },
  };
})();
