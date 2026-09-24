/* ============================================================================
   ORDINI — MAGAZZINO
   ----------------------------------------------------------------------------
   Un file solo, tre modi di funzionare. Si sceglie riempiendo il riquadro qui
   sotto; il menu del cliente e la schermata del banco non si accorgono di nulla.

     1. niente compilato  → memoria del dispositivo (prova su un telefono solo)
     2. API compilata     → server dell'anteprima (prova telefono + banco)
     3. SUPABASE compilato→ il database vero: funziona anche a Mac spento

   ⚠️ In Supabase non si tocca nessuna tabella: si chiamano SOLO le funzioni
      preparate apposta, che controllano chiave del tavolo e password prima di
      fare qualsiasi cosa. La chiave qui sotto è pubblica: è fatta per stare
      dentro il sito, e da sola non permette niente.
   ========================================================================== */
const OrdiniStore = (function () {
  "use strict";

  /* ───────────────────────── il riquadro da compilare ───────────────────── */
  const SUPABASE_URL = "https://agbvmhpktilpaoabjkre.supabase.co";
  const SUPABASE_KEY = "sb_publishable_2O5l8ZbQqGnwDXwxZnsZ2Q_0Mt1V8T7";
  const API = "";               // solo per l'anteprima
  /* ──────────────────────────────────────────────────────────────────────── */

  const CHIAVE = "vdc_ordini_prova";
  const CONFIG = "vdc_ordini_config";
  const PWD = "vdc_ordini_pwd";
  const CONFIG_DI_PARTENZA = { attivo: false, aperto: true, messaggio: "" };

  const suSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

  /* ---------------------------------------------------- memoria locale */
  function leggi(k, ripiego) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : ripiego; }
    catch (e) { return ripiego; }
  }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function tutti() { return leggi(CHIAVE, []); }
  function salvaTutti(l) { scrivi(CHIAVE, l); }
  function attendi(ms, v) { return new Promise(function (ok) { setTimeout(function () { ok(v); }, ms); }); }

  /* --------------------------------------- la password dello staff (banco) */
  let passwordStaff = null;
  try { passwordStaff = localStorage.getItem(PWD) || null; } catch (e) {}

  /* ---------------------------------------------------- chiamate al database */
  async function rpc(funzione, corpo) {
    const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + funzione, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(corpo || {}),
    });
    if (!r.ok) {
      let msg = "";
      try { msg = (await r.json()).message || ""; } catch (e) {}
      throw new Error(msg || ("database " + r.status));
    }
    return r.json();
  }
  async function dalServer(via, corpo) {
    const r = await fetch(API + via, corpo
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) }
      : undefined);
    if (!r.ok) {
      // il motivo del rifiuto va riportato tale e quale, come fa il database:
      // è quello che permette al menu di spiegarlo al cliente
      let msg = "";
      try { msg = (await r.json()).message || ""; } catch (e) {}
      throw new Error(msg || ("server " + r.status));
    }
    return r.json();
  }

  // i nomi delle colonne del database in quelli usati dalle pagine
  function daRiga(o) {
    if (!o) return null;
    return {
      id: o.id, tavolo: o.tavolo, coperti: o.coperti, righe: o.righe, totale: o.totale,
      stato: o.stato,
      inviatoAlle: o.inviatoAlle || (o.inviato_alle ? Date.parse(o.inviato_alle) : null),
      vistoAlle: o.vistoAlle || (o.visto_alle ? Date.parse(o.visto_alle) : null),
      confermatoAlle: o.confermatoAlle || (o.confermato_alle ? Date.parse(o.confermato_alle) : null),
      chiamatoAlle: o.chiamatoAlle || (o.chiamato_alle ? Date.parse(o.chiamato_alle) : null),
    };
  }

  function nuovoLocale(ordine) {
    return Object.assign({}, ordine, {
      id: "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      stato: "inviato", inviatoAlle: Date.now(),
      vistoAlle: null, confermatoAlle: null, chiamatoAlle: null,
    });
  }

  return {
    suSupabase: suSupabase,

    // la password dello staff: la chiede la schermata del banco, una volta
    ricordaPassword: function (p) {
      passwordStaff = p || null;
      try { p ? localStorage.setItem(PWD, p) : localStorage.removeItem(PWD); } catch (e) {}
    },
    haPassword: function () { return !!passwordStaff; },

    stato: async function () {
      if (suSupabase) { try { return await rpc("ordini_stato"); } catch (e) { return { attivo: false, aperto: true }; } }
      if (API) { try { return await dalServer("/config"); } catch (e) {} }
      return Object.assign({}, CONFIG_DI_PARTENZA, leggi(CONFIG, {}));
    },

    cambiaStato: async function (parziale) {
      if (suSupabase) {
        return rpc("ordini_imposta", {
          p_attivo: parziale.attivo === undefined ? null : parziale.attivo,
          p_aperto: parziale.aperto === undefined ? null : parziale.aperto,
          p_apertura_staff: parziale.aperturaStaff === undefined ? null : parziale.aperturaStaff,
          p_mostra_totale: parziale.mostraTotale === undefined ? null : parziale.mostraTotale,
          pwd: passwordStaff,
        });
      }
      if (API) { try { return await dalServer("/config", parziale); } catch (e) {} }
      const nuovo = Object.assign({}, CONFIG_DI_PARTENZA, leggi(CONFIG, {}), parziale);
      scrivi(CONFIG, nuovo);
      return nuovo;
    },

    manda: async function (ordine) {
      if (suSupabase) {
        const o = await rpc("nuovo_ordine", {
          p_tavolo: String(ordine.tavolo), p_chiave: String(ordine.chiave || ""),
          p_coperti: ordine.coperti, p_righe: ordine.righe, p_totale: ordine.totale,
        });
        return daRiga(Array.isArray(o) ? o[0] : o);
      }
      if (API) return dalServer("/ordini", ordine);
      const o = nuovoLocale(ordine);
      const l = tutti(); l.push(o); salvaTutti(l);
      return attendi(300, o);
    },

    leggiOrdine: async function (id) {
      if (suSupabase) { try { return daRiga(await rpc("stato_ordine", { p_id: id })); } catch (e) { return null; } }
      const l = await this.elenco();
      return l.filter(function (o) { return o.id === id; })[0] || null;
    },

    /* Qui NON si ingoia l'errore, di proposito. Prima, se la lettura falliva
       (password cambiata, linea caduta) tornava una lista vuota e il banco
       scriveva "nessun ordine in attesa": il guasto peggiore che esista,
       quello che sembra tutto a posto. Adesso l'errore esce e chi chiama
       decide cosa scrivere in faccia al cameriere. */
    elenco: async function () {
      if (suSupabase) return (await rpc("ordini_aperti", { pwd: passwordStaff }) || []).map(daRiga);
      if (API) return await dalServer("/ordini");
      return tutti();
    },

    segna: async function (id, stato) {
      if (suSupabase) return rpc("segna_ordine", { p_id: id, p_stato: stato, pwd: passwordStaff });
      if (API) return dalServer("/segna", { id: id, stato: stato });
      const l = tutti();
      l.forEach(function (o) {
        if (o.id !== id) return;
        o.stato = stato;
        if (stato === "visto" && !o.vistoAlle) o.vistoAlle = Date.now();
        if (stato === "confermato" && !o.confermatoAlle) o.confermatoAlle = Date.now();
      });
      salvaTutti(l);
      return true;
    },

    chiama: async function (id) {
      if (suSupabase) return rpc("chiama_cameriere", { p_id: id });
      if (API) return dalServer("/chiama", { id: id });
      const l = tutti();
      l.forEach(function (o) { if (o.id === id && !o.chiamatoAlle) o.chiamatoAlle = Date.now(); });
      salvaTutti(l);
      return true;
    },

    /* --------------------------------------------------------------------
       I TAVOLI — è qui che si ferma chi è andato via e vuole fare il furbo.
       Un tavolo accetta ordini solo mentre è aperto; il cameriere lo chiude
       quando sparecchia, e spegnere il servizio li chiude tutti insieme.
       ------------------------------------------------------------------ */
    tavoliAperti: async function () {
      if (suSupabase) return (await rpc("tavoli_aperti", { pwd: passwordStaff })) || [];
      if (API) return await dalServer("/tavoli");
      return [];
    },
    apriTavolo: async function (n) {
      if (suSupabase) return rpc("apri_tavolo", { p_numero: String(n), pwd: passwordStaff });
      if (API) return dalServer("/tavolo", { numero: String(n), cosa: "apri" });
      return true;
    },
    chiudiTavolo: async function (n) {
      if (suSupabase) return rpc("chiudi_tavolo", { p_numero: String(n), pwd: passwordStaff });
      if (API) return dalServer("/tavolo", { numero: String(n), cosa: "chiudi" });
      return true;
    },
    bloccaTavolo: async function (n, ore) {
      if (suSupabase) return rpc("blocca_tavolo", { p_numero: String(n), p_ore: ore || 6, pwd: passwordStaff });
      if (API) return dalServer("/tavolo", { numero: String(n), cosa: "blocca", ore: ore || 6 });
      return true;
    },

    /* --------------------------------------------------------------------
       I TAVOLI DEL LOCALE — li aggiunge e li toglie il titolare, da solo,
       dalla pagina "Tavoli e QR". La chiave la genera il database: non passa
       mai dal browser e non si può indovinare.
       ------------------------------------------------------------------ */
    elencoTavoli: async function () {
      if (suSupabase) { try { return await rpc("elenco_tavoli", { pwd: passwordStaff }) || []; } catch (e) { throw e; } }
      if (API) return dalServer("/elenco-tavoli");
      return [];
    },
    aggiungiTavoli: async function (da, a) {
      if (suSupabase) return rpc("aggiungi_tavoli", { p_da: String(da), p_a: a ? String(a) : null, pwd: passwordStaff });
      if (API) return dalServer("/gestisci-tavoli", { cosa: "aggiungi", da: String(da), a: a ? String(a) : "" });
      return [];
    },
    togliTavolo: async function (n) {
      if (suSupabase) return rpc("togli_tavolo", { p_numero: String(n), pwd: passwordStaff });
      if (API) return dalServer("/gestisci-tavoli", { cosa: "togli", numero: String(n) });
      return [];
    },
    rigeneraChiave: async function (n) {
      if (suSupabase) return rpc("rigenera_chiave", { p_numero: String(n), pwd: passwordStaff });
      if (API) return dalServer("/gestisci-tavoli", { cosa: "rigenera", numero: String(n) });
      return [];
    },

    svuota: async function () {
      if (suSupabase) return true;              // sul database non si cancella da qui
      if (API) return dalServer("/svuota", {});
      salvaTutti([]); return true;
    },

    ascolta: function (fn) {
      window.addEventListener("storage", function (e) {
        if (e.key === CHIAVE || e.key === CONFIG) fn();
      });
      setInterval(fn, 2000);
    },
  };
})();
