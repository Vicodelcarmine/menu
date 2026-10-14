/* ============================================================================
   CLUB DEL VICO — lato cliente
   ----------------------------------------------------------------------------
   Pezzo staccato, come ordina.js: si aggancia al menu dall'esterno e il motore
   del menu non lo conosce. Qui c'è solo il minimo che serve sempre:
     · il tasto 🎁 Club in alto a sinistra;
     · l'invito a iscriversi, che compare UNA volta sola: dopo circa un minuto
       sul menu, oppure subito dopo un ordine dal tavolo, e mai sopra un piatto
       aperto;
     · la tessera di questo telefono (una chiave segreta).
   Il pannello vero (iscrizione, premi, QR) sta in club-pannello.js e si
   scarica solo quando il cliente tocca il tasto: chi apre il menu solo per
   ordinare non scarica niente in più.

   Dati: Supabase, funzioni club_* (vedi agenti/supabase/07-club.sql).
   Prova: ?demo=1 → tutto nella memoria del browser, la stessa che usa la
   dashboard in prova: in anteprima ci si iscrive qui e si riscatta là.
   ========================================================================== */
const Club = (function () {
  "use strict";

  const SUPABASE_URL = "https://agbvmhpktilpaoabjkre.supabase.co";
  const SUPABASE_KEY = "sb_publishable_2O5l8ZbQqGnwDXwxZnsZ2Q_0Mt1V8T7";

  const CHIAVE = "vdc_club";              // la tessera di questo telefono
  const PROFILO = "vdc_club_profilo";     // l'ultima tessera letta: si vede anche senza rete
  const INVITO = "vdc_club_invito";       // l'invito è già comparso
  const DISP = "vdc_club_disp";           // numero a caso del telefono (contro le iscrizioni a raffica)
  const DB_DEMO = "vdcclub_demo_v1";

  const $ = function (s) { return document.querySelector(s); };
  function leggi(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function scrivi(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  const DEMO = (function () {
    try {
      if (/[?&]demo=1/.test(location.search)) sessionStorage.setItem("vdcclub_demo", "1");
      if (/[?&]demo=0/.test(location.search)) sessionStorage.removeItem("vdcclub_demo");
      return sessionStorage.getItem("vdcclub_demo") === "1";
    } catch (e) { return false; }
  })();

  /* --- lingua: italiano per chi ha il menu in italiano, inglese per tutti gli altri --- */
  function lingua() { return document.documentElement.lang || "it"; }
  function inItaliano() { return lingua() === "it"; }
  const TESTI = {
    it: {
      club: "Club", invitoTit: "Entra nel Club del Vico", invitoSub: "Gratis, in un minuto. È il nostro modo di dirti grazie.",
      invitoPremio: "alla tua prossima visita", invitoPer: "per", persone: "persone", persona: "persona",
      invitoCompleanno: "Un regalo per il tuo compleanno", invitoOfferte: "Offerte riservate agli iscritti",
      iscriviti: "Iscriviti gratis", nonOra: "Non ora", dopo: "Lo ritrovi quando vuoi nel tasto 🎁 Club in alto.",
      ritrovata: "Tessera del Club ritrovata 🎉",
    },
    en: {
      club: "Club", invitoTit: "Join the Vico Club", invitoSub: "Free, in one minute. It's our way of saying thank you.",
      invitoPremio: "on your next visit", invitoPer: "for", persone: "people", persona: "person",
      invitoCompleanno: "A gift for your birthday", invitoOfferte: "Members-only offers",
      iscriviti: "Join for free", nonOra: "Not now", dopo: "You'll always find it under the 🎁 Club button at the top.",
      ritrovata: "Club card found 🎉",
    },
  };
  function t(k, testi) {
    testi = testi || TESTI;
    return ((inItaliano() ? testi.it : testi.en) || {})[k] || testi.it[k] || "";
  }
  // il nome del premio nella lingua del cliente (il titolare lo scrive in italiano e in inglese)
  function nomePremio(nome) { return (nome && (inItaliano() ? nome.it : (nome.en || nome.it))) || ""; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ==========================================================================
     ORA DI FIRENZE: "la sera" di un momento (fino alle 6 conta la sera prima)
     ======================================================================== */
  const fmtRoma = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  function romaParti(d) {
    const p = {};
    fmtRoma.formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return { y: +p.year, m: +p.month, g: +p.day, h: +p.hour, min: +p.minute };
  }
  const due = function (n) { return String(n).padStart(2, "0"); };
  function sera(d) {
    const p = romaParti(new Date((d ? new Date(d) : new Date()).getTime() - 6 * 3600e3));
    return p.y + "-" + due(p.m) + "-" + due(p.g);
  }
  function piuGiorni(s, n) {
    const a = s.split("-").map(Number);
    const d = new Date(Date.UTC(a[0], a[1] - 1, a[2] + n));
    return d.getUTCFullYear() + "-" + due(d.getUTCMonth() + 1) + "-" + due(d.getUTCDate());
  }
  function giornoSettimana(s) { const a = s.split("-").map(Number); return new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay(); }
  function daRoma(y, m, g, h, min) {
    const ipotesi = Date.UTC(y, m - 1, g, h, min);
    const p = romaParti(new Date(ipotesi));
    return new Date(ipotesi - (Date.UTC(p.y, p.m - 1, p.g, p.h, p.min) - ipotesi));
  }
  function scadenza(s, chiusura) {
    const a = s.split("-").map(Number), o = chiusura.split(":").map(Number);
    const d = new Date(Date.UTC(a[0], a[1] - 1, a[2] + (o[0] < 6 ? 1 : 0)));
    return daRoma(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), o[0], o[1]).getTime();
  }

  /* ==========================================================================
     DATI: Supabase, oppure (demo) la memoria del browser
     ======================================================================== */
  function errore(codice, msg) { const e = new Error(msg); e.codice = codice; return e; }

  async function rpc(funzione, corpo) {
    let r;
    try {
      r = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + funzione, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(corpo || {}),
      });
    } catch (e) { throw errore("rete", "Connessione assente"); }
    const testo = await r.text();
    let dati = null;
    try { dati = testo ? JSON.parse(testo) : null; } catch (e) {}
    // gli errori delle funzioni club_* portano il loro codice nel campo "hint"
    if (!r.ok) throw errore((dati && dati.hint) || "server", (dati && dati.message) || "Errore del server (" + r.status + ")");
    return dati;
  }

  /* --- demo: stesse regole del database, nella memoria del browser --- */
  function demoLeggi() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_DEMO)); } catch (e) {}
    db = db || { iscritti: [], premi: [] };
    db.impostazioni = Object.assign({ emoji: "🍹", nome: { it: "Spritz o dolce offerto", en: "Free spritz or dessert" },
      persone: 2, sere: 14, giorniNo: [6], giorniChiusura: [] }, db.impostazioni);
    return db;
  }
  function demoScrivi(db) { try { localStorage.setItem(DB_DEMO, JSON.stringify(db)); } catch (e) {} }
  function demoPiuSere(s, n, giorni) {
    let d = s, contate = 0;
    for (let i = 0; i < n * 7 + 7; i++) {
      if (giorni.indexOf(giornoSettimana(d)) < 0 && ++contate === n) return d;
      d = piuGiorni(d, 1);
    }
    return piuGiorni(s, n - 1);
  }
  function casuale(n) {
    const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", b = new Uint32Array(n);
    crypto.getRandomValues(b);
    let s = "";
    for (let i = 0; i < n; i++) s += alfabeto[b[i] % alfabeto.length];
    return s;
  }
  function demoStato(p) {
    const s = sera();
    if (p.usato) return "usato";
    if (Date.now() >= scadenza(p.al, "23:30")) return "scaduto";
    if (s < p.dal) return "presto";
    if (p.giorniNo.indexOf(giornoSettimana(s)) >= 0) return "oggi_no";
    return "valido";
  }
  function demoVista(db, i) {
    return {
      nome: i.nome, email: i.email, telefono: i.telefono, nascita: i.nascita, promo: i.promo, creato: i.creato,
      premi: db.premi.filter(function (p) { return p.iscritto === i.id && (!p.usato || p.usato > Date.now() - 60 * 864e5); })
        .map(function (p) {
          return { codice: p.codice, tipo: p.tipo, emoji: p.emoji, nome: p.nome, persone: p.persone, dal: p.dal, al: p.al,
            scade: scadenza(p.al, "23:30"), giorniNo: p.giorniNo, creato: p.creato, usato: p.usato, stato: demoStato(p) };
        })
        .sort(function (x, y) { return (!!x.usato - !!y.usato) || (x.dal < y.dal ? -1 : x.dal > y.dal ? 1 : 0); }),
    };
  }
  function demoIscritto(db, chiave) {
    const i = db.iscritti.find(function (x) { return x.chiave === chiave; });
    if (!i) throw errore("chiave", "Tessera non trovata");
    return i;
  }
  function demoTelefono(p) {
    let t = String(p || "").replace(/[^0-9+]/g, "");
    if (t.indexOf("00") === 0) t = "+" + t.slice(2);
    t = t[0] === "+" ? "+" + t.slice(1).replace(/\+/g, "") : "+39" + t.replace(/\+/g, "");
    return t.length - 1 < 8 || t.length - 1 > 15 ? null : t;
  }
  function attesa(fn) {
    return new Promise(function (ok, ko) { setTimeout(function () { try { ok(fn()); } catch (e) { ko(e); } }, 160); });
  }
  const demo = {
    info: function () {
      return attesa(function () {
        const imp = demoLeggi().impostazioni;
        return { emoji: imp.emoji, nome: imp.nome, persone: imp.persone, sere: imp.sere, giorniNo: imp.giorniNo.concat(imp.giorniChiusura) };
      });
    },
    iscriviti: function (d) {
      return attesa(function () {
        const db = demoLeggi();
        const nome = String(d.nome || "").trim().slice(0, 60), email = String(d.email || "").trim().toLowerCase();
        const tel = demoTelefono(d.telefono);
        if (nome.length < 2) throw errore("nome", "Scrivi il tuo nome");
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) throw errore("email", "Email non valida");
        if (!tel) throw errore("telefono", "Numero di telefono non valido");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d.nascita || "")) throw errore("nascita", "Data di nascita non valida");
        if (db.iscritti.some(function (i) { return i.email === email || i.telefono === tel; })) {
          throw errore("gia", "Questa email o questo numero sono già nel Club");
        }
        const i = { id: "c" + casuale(8), chiave: casuale(24), nome: nome, email: email, telefono: tel, nascita: d.nascita,
          promo: !!d.promo, promoQuando: d.promo ? Date.now() : null, lingua: lingua(), creato: Date.now() };
        db.iscritti.push(i);
        const imp = db.impostazioni, g = imp.giorniNo.concat(imp.giorniChiusura);
        const dal = demoPiuSere(piuGiorni(sera(), 1), 1, g);
        let codice;
        do { codice = casuale(7); } while (db.premi.some(function (p) { return p.codice === codice; }));
        db.premi.push({ codice: codice, iscritto: i.id, tipo: "benvenuto", emoji: imp.emoji, nome: Object.assign({}, imp.nome),
          persone: imp.persone, dal: dal, al: demoPiuSere(dal, imp.sere, g), giorniNo: g, creato: Date.now(), usato: null, seraUso: null });
        demoScrivi(db);
        return Object.assign({ chiave: i.chiave }, demoVista(db, i));
      });
    },
    profilo: function (chiave) { return attesa(function () { const db = demoLeggi(); return demoVista(db, demoIscritto(db, chiave)); }); },
    promo: function (chiave, si) {
      return attesa(function () {
        const db = demoLeggi(), i = demoIscritto(db, chiave);
        i.promo = !!si; i.promoQuando = Date.now();
        demoScrivi(db);
        return demoVista(db, i);
      });
    },
    cancellami: function (chiave) {
      return attesa(function () {
        const db = demoLeggi(), i = demoIscritto(db, chiave);
        db.iscritti = db.iscritti.filter(function (x) { return x !== i; });
        db.premi = db.premi.filter(function (p) { return p.iscritto !== i.id; });
        demoScrivi(db);
        return true;
      });
    },
  };
  const reale = {
    info: function () { return rpc("club_info"); },
    iscriviti: function (d) {
      return rpc("club_iscriviti", { p_nome: d.nome, p_email: d.email, p_telefono: d.telefono, p_nascita: d.nascita,
        p_promo: !!d.promo, p_lingua: lingua(), p_dispositivo: dispositivo() });
    },
    profilo: function (chiave) { return rpc("club_profilo", { p_chiave: chiave }); },
    promo: function (chiave, si) { return rpc("club_promo", { p_chiave: chiave, p_promo: !!si }); },
    cancellami: function (chiave) { return rpc("club_cancellami", { p_chiave: chiave }); },
  };
  const dati = DEMO ? demo : reale;

  function dispositivo() {
    let d = leggi(DISP);
    if (!d) { d = casuale(12); scrivi(DISP, d); }
    return d;
  }

  /* ==========================================================================
     LA TESSERA DI QUESTO TELEFONO
     ======================================================================== */
  function chiave() { return leggi(CHIAVE); }
  function salvaTessera(k, profilo) {
    scrivi(CHIAVE, k);
    if (profilo) scrivi(PROFILO, JSON.stringify(profilo));
    aggiornaTasto(profilo);
  }
  function dimenticaTessera() { scrivi(CHIAVE, null); scrivi(PROFILO, null); aggiornaTasto(null); }
  function profiloSalvato() { try { return JSON.parse(leggi(PROFILO)); } catch (e) { return null; } }
  // legge la tessera dal server; senza rete ripiega sull'ultima copia (il QR si mostra lo stesso)
  async function profilo() {
    const k = chiave();
    if (!k) return null;
    try {
      const p = await dati.profilo(k);
      salvaTessera(k, p);
      return p;
    } catch (e) {
      if (e.codice === "chiave") { dimenticaTessera(); return null; }   // tessera cancellata
      const p = profiloSalvato();
      if (p) { p.offline = true; return p; }
      throw e;
    }
  }

  /* ==========================================================================
     IL TASTO 🎁 IN ALTO
     ======================================================================== */
  let tasto = null;
  function creaTasto() {
    tasto = document.createElement("button");
    tasto.type = "button";
    tasto.className = "club-pill";
    tasto.setAttribute("aria-label", "Club del Vico");
    tasto.innerHTML = '<span class="club-pill-ico">🎁</span><span class="club-pill-txt"></span><i class="club-pill-dot" hidden></i>';
    tasto.addEventListener("click", function () { chiudiInvito(true); apri(); });
    document.body.appendChild(tasto);
    aggiornaTasto(profiloSalvato());
  }
  // il pallino si accende quando c'è un premio da usare stasera
  function aggiornaTasto(p) {
    if (!tasto) return;
    tasto.querySelector(".club-pill-txt").textContent = t("club");
    const pronto = !!(p && p.premi && p.premi.some(function (x) { return x.stato === "valido"; }));
    tasto.querySelector(".club-pill-dot").hidden = !pronto;
  }

  /* ==========================================================================
     L'INVITO (una volta sola)
     ======================================================================== */
  let invito = null, dopoOrdine = false, pronto = false;
  // il menu è "libero": nessun piatto, foglio d'ordine, editor o intro aperto
  function menuLibero() {
    if (document.querySelector(".overlay.open, .approve-modal.open, .ord-foglio.aperto, .ord-stato.aperto, #lang-panel.open, .club-pannello.aperto")) return false;
    const intro = $("#intro");
    return !(intro && intro.style.display !== "none" && !intro.classList.contains("hide"));
  }
  function daInvitare() { return !chiave() && !leggi(INVITO); }
  function sorveglia() {
    const giro = setInterval(function () {
      if (!daInvitare()) { clearInterval(giro); return; }
      if ((pronto || dopoOrdine) && menuLibero() && !document.hidden) { clearInterval(giro); setTimeout(mostraInvito, dopoOrdine ? 1200 : 0); }
    }, 1500);
    setTimeout(function () { pronto = true; }, 60000);     // circa un minuto sul menu
  }
  async function mostraInvito() {
    if (!daInvitare() || !menuLibero() || invito) return;
    scrivi(INVITO, String(Date.now()));
    let info = null;
    try { info = await dati.info(); } catch (e) {}
    invito = document.createElement("div");
    invito.className = "club-invito";
    invito.innerHTML =
      '<div class="club-invito-box" role="dialog" aria-modal="true" aria-label="' + esc(t("invitoTit")) + '">' +
      '<div class="club-invito-ico">🎁</div>' +
      "<h2>" + esc(t("invitoTit")) + "</h2>" +
      '<p class="club-invito-sub">' + esc(t("invitoSub")) + "</p>" +
      '<ul class="club-vantaggi">' +
      (info ? "<li><span>" + esc(info.emoji) + "</span><div><b>" + esc(nomePremio(info.nome)) + "</b> " + esc(t("invitoPer")) + " " +
        info.persone + " " + esc(t(info.persone === 1 ? "persona" : "persone")) + "<small>" + esc(t("invitoPremio")) + "</small></div></li>" : "") +
      "<li><span>🎂</span><div>" + esc(t("invitoCompleanno")) + "</div></li>" +
      "<li><span>💌</span><div>" + esc(t("invitoOfferte")) + "</div></li></ul>" +
      '<button type="button" class="club-btn club-btn-oro club-invito-si">' + esc(t("iscriviti")) + "</button>" +
      '<button type="button" class="club-btn club-btn-vuoto club-invito-no">' + esc(t("nonOra")) + "</button>" +
      '<p class="club-invito-dopo">' + esc(t("dopo")) + "</p></div>";
    document.body.appendChild(invito);
    requestAnimationFrame(function () { invito.classList.add("aperto"); });
    invito.querySelector(".club-invito-si").addEventListener("click", function () { chiudiInvito(true); apri(); });
    invito.querySelector(".club-invito-no").addEventListener("click", function () { chiudiInvito(); });
    invito.addEventListener("click", function (e) { if (e.target === invito) chiudiInvito(); });
  }
  function chiudiInvito(subito) {
    scrivi(INVITO, leggi(INVITO) || String(Date.now()));
    if (!invito) return;
    const via = invito;
    invito = null;
    via.classList.remove("aperto");
    setTimeout(function () { via.remove(); }, subito ? 0 : 300);
  }
  // subito dopo un ordine dal tavolo: il cliente aspetta i piatti, è il momento giusto.
  // ordina.js non si tocca: si avvolge la sua funzione "manda" del magazzino ordini.
  function agganciaOrdini() {
    if (typeof OrdiniStore === "undefined" || typeof OrdiniStore.manda !== "function") return;
    const manda = OrdiniStore.manda;
    OrdiniStore.manda = function () {
      return Promise.resolve(manda.apply(this, arguments)).then(function (r) { dopoOrdine = true; return r; });
    };
  }

  /* ==========================================================================
     IL PANNELLO (si scarica solo adesso)
     ======================================================================== */
  const BASE = (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? new URL("../../", s).href : new URL("./", location.href).href;
  })();
  function caricaScript(src) {
    return new Promise(function (ok, ko) {
      const s = document.createElement("script");
      s.src = BASE + src; s.onload = ok; s.onerror = ko;
      document.head.appendChild(s);
    });
  }
  let caricamento = null;
  function apri(opzioni) {
    if (!caricamento) caricamento = caricaScript("assets/js/club-pannello.js?v=1").catch(function (e) { caricamento = null; throw e; });
    return caricamento.then(function () { ClubPannello.apri(opzioni || {}); })
      .catch(function () { alert(inItaliano() ? "Connessione assente: riprova fra poco." : "No connection: please try again shortly."); });
  }
  function caricaQR() { return typeof qrcode !== "undefined" ? Promise.resolve() : caricaScript("assets/js/qr.js"); }

  // Android: il telefono propone "Installa app"; lo teniamo da parte per il tasto del pannello
  let installa = null;
  window.addEventListener("beforeinstallprompt", function (e) { installa = e; });

  /* ==========================================================================
     AVVIO
     ======================================================================== */
  function avvia() {
    agganciaOrdini();
    creaTasto();
    // ?club=CHIAVE: tessera riaperta dal titolare (cambio telefono) o dall'icona sulla Home
    const q = new URLSearchParams(location.search);
    const k = q.get("club");
    if (k && /^[A-Za-z0-9]{16,40}$/.test(k)) {
      q.delete("club");
      const resto = q.toString();
      history.replaceState(null, "", location.pathname + (resto ? "?" + resto : "") + location.hash);
      scrivi(CHIAVE, k);
      scrivi(INVITO, leggi(INVITO) || String(Date.now()));
      apri({ ritrovata: true });
    } else if (chiave()) {
      // tessera già sul telefono: aggiorno il pallino senza rallentare il menu
      setTimeout(function () { profilo().catch(function () {}); }, 2500);
    }
    // la lingua si può cambiare dal menu: il tasto la segue
    new MutationObserver(function () { aggiornaTasto(profiloSalvato()); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    if (daInvitare()) sorveglia();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia);
  else avvia();

  return {
    DEMO: DEMO, dati: dati, t: t, esc: esc, nomePremio: nomePremio, lingua: lingua, inItaliano: inItaliano,
    sera: sera, piuGiorni: piuGiorni, giornoSettimana: giornoSettimana,
    chiave: chiave, salvaTessera: salvaTessera, dimenticaTessera: dimenticaTessera, profilo: profilo, profiloSalvato: profiloSalvato,
    caricaQR: caricaQR, installa: function () { return installa; }, consumaInstalla: function () { installa = null; },
    urlPremio: function (codice) { return new URL("../agenti/titolare/?c=" + codice, BASE).href; },
    urlCasa: function (k) { return new URL("club.html?k=" + k, BASE).href; },
    apri: apri,
  };
})();
