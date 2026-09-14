/* ============================================================================
   VICO DEL CARMINE — LOGICA DEL MENU
   Griglia categorie + Specialità + carosello "carte da poker", in 9 lingue.
   Contenuti: menu-data.js · Testi interfaccia: i18n.js · Dati Supabase: store.js
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);

  /* --- elementi --- */
  const overlay = $("#overlay");
  const specOverlay = $("#spec-overlay");
  const deckEl = $("#deck");
  const titleEl = $("#ov-title");
  const countEl = $("#ov-count");
  const dotsEl = $("#dots");

  /* --- icona per categoria --- */
  const CAT_ICON = {
    "specialita": "⭐", "antipasti": "🥖", "primi": "🍝", "secondi": "🍖",
    "insalatone": "🥗", "contorni": "🍟", "pizze": "🍕",
    "dolci": "🍰", "birre": "🍺", "cocktail": "🍸", "bevande": "🥤", "vini": "🍷",
  };

  /* --- stato --- */
  let lang = "it";
  let currentCat = null;          // categoria aperta nel carosello (per ri-tradurre)
  let overrides = {};             // modifiche pubblicate da Supabase
  let overridesLoaded = false;    // true solo se il caricamento da Supabase è riuscito (anti-perdita-dati)

  // Versione del menu, scritta in fondo alla pagina: AGGIORNARLA A OGNI PUBBLICAZIONE.
  // Serve a capire al volo se il telefono sta mostrando l'ultima versione.
  const APP_VERSION = "12.09.2026 · pagine";

  const hasData = typeof MENU_DATA !== "undefined" && MENU_DATA;
  const categorie = (hasData && MENU_DATA.categorie) || [];
  const note = (hasData && MENU_DATA.note) || null;

  /* --- helper traduzioni / dati --- */
  function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.it[key] || ""; }
  function catName(cat) { const nn = cat.nome; if (typeof nn === "string") return nn; return (nn && (nn[lang] || nn.it)) || cat.slug; }
  function dishDesc(p) { const d = p.descrizione; if (!d) return ""; return d[lang] || d.it || ""; }
  function iconFor(cat) { return CAT_ICON[cat.slug] || "🍽️"; }

  /* La ⭐ delle Specialità la mette il sistema (flag ✦), NON si scrive nel nome:
     togliamo qualsiasi stellina iniziale e la rimettiamo solo se il piatto è speciale
     (così i piatti storici che ce l'hanno scritta a mano non la mostrano doppia). */
  const STAR = "⭐";
  function cleanName(nome) { return String(nome == null ? "" : nome).replace(/^[\s]*[⭐★✦✧☆*]+[\s]*/, "").trim(); }
  function dishName(p) { const n = cleanName(p && p.nome); return (p && p.speciale) ? STAR + " " + n : n; }

  function fmtPrice(n) {
    if (n === "" || n == null) return "";
    const num = typeof n === "number" ? n : parseFloat(String(n).replace(",", "."));
    if (isNaN(num)) return String(n);
    const s = Number.isInteger(num) ? String(num) : num.toFixed(2).replace(".", ",");
    return "€ " + s;
  }

  // --- modifiche pubblicate (Supabase): { edits:{ "slug::nome":{prezzo,image} }, removed:[...], added:{ slug:[...] } }
  function ovEdits() { return (overrides && overrides.edits) || {}; }
  function ovRemoved() { return (overrides && overrides.removed) || []; }
  function ovAdded(slug) { return (overrides && overrides.added && overrides.added[slug]) || []; }

  // Migrazione una-tantum: le vecchie categorie speciali sono confluite nelle normali.
  // Rinomina, in memoria all'avvio, le chiavi degli override salvati PRIMA del cambio.
  const MIGRATE_KEYS = {
    "specialita-stagione::⭐ Guazzetto di mare caldo in terrina": "antipasti::⭐ Guazzetto di mare caldo in terrina",
    "specialita-stagione::⭐ Insalata di baccalà, limone, olive e pomodori freschi": "antipasti::⭐ Insalata di baccalà, limone, olive e pomodori freschi",
    "specialita-stagione::⭐ Pepata di cozze e bruschette": "antipasti::⭐ Pepata di cozze e bruschette",
    "specialita-stagione::⭐ Pasta fresca vongole e bottarga": "primi::⭐ Pasta fresca vongole e bottarga",
    "specialita-stagione::⭐ Gnocchi di patate ceci e cozze": "primi::⭐ Gnocchi di patate ceci e cozze",
    "specialita-stagione::⭐ Pennette pesto e gamberetti": "primi::⭐ Pennette pesto e gamberetti",
    "specialita-stagione::⭐ Spigola o Orata alla griglia": "secondi::⭐ Spigola o Orata alla griglia",
    "specialita-stagione::⭐ Baccalà Napoletano": "secondi::⭐ Baccalà Napoletano",
    "specialita-stagione::⭐ Salmone alla griglia": "secondi::⭐ Salmone alla griglia",
    "specialita-stagione::⭐ Agnello alla scottadito": "secondi::⭐ Agnello alla scottadito",
    "specialita-stagione::⭐ Tagliata di manzo ai ferri": "secondi::⭐ Tagliata di manzo ai ferri",
    "specialita-stagione::⭐ Entrecote al chianti": "secondi::⭐ Entrecote al chianti",
    "specialita-pizza::⭐ Pizza NERETO": "pizze::⭐ Pizza NERETO",
    "specialita-pizza::⭐ Pizza TOSCANA": "pizze::⭐ Pizza TOSCANA",
    "specialita-pizza::⭐ Pizza TABARRO": "pizze::⭐ Pizza TABARRO",
  };
  function migrateOverrides(ov) {
    if (!ov || typeof ov !== "object") return ov;
    if (ov.edits) Object.keys(MIGRATE_KEYS).forEach(function (oldk) {
      if (oldk in ov.edits) { if (!(MIGRATE_KEYS[oldk] in ov.edits)) ov.edits[MIGRATE_KEYS[oldk]] = ov.edits[oldk]; delete ov.edits[oldk]; }
    });
    if (Array.isArray(ov.removed)) ov.removed = ov.removed.map(function (k) { return MIGRATE_KEYS[k] || k; });
    return ov;
  }

  // Appiattisce i piatti e applica modifiche. Con editor=true include i piatti CONGELATI (nascosti ai clienti).
  function piattiOf(cat, editor) {
    let list = [];
    if (Array.isArray(cat.piatti)) list = cat.piatti.map((p) => Object.assign({}, p));
    else if (Array.isArray(cat.sezioni)) {
      cat.sezioni.forEach((sez) => (sez.piatti || []).forEach((p) => {
        const c = Object.assign({}, p); c._sezione = sez.tipo; list.push(c);
      }));
    }
    list.forEach((p) => { p._basenome = p.nome; });   // identità stabile per gli override (anche se cambia il nome)
    const edits = ovEdits(), removed = ovRemoved();
    const keyOf = (p) => (p._ovslug || cat.slug) + "::" + (p._basenome || p.nome);
    list = list.filter((p) => removed.indexOf(keyOf(p)) === -1);          // 1) eliminati
    if (!cat._pseudo) ovAdded(cat.slug).forEach((a) => list.push(Object.assign({ _added: true }, a)));  // 2) nuovi
    list.forEach((p) => {                                                  // 3) modifiche: prezzo/foto/nome/descrizione/speciale
      if (!p._added) {
        const ov = edits[keyOf(p)];
        if (ov) {
          if (ov.prezzo != null && ov.prezzo !== "") p.prezzo = ov.prezzo;
          if ("image" in ov) p.image = ov.image;
          if (ov.nome) p.nome = ov.nome;
          if (ov.descrizione) p.descrizione = ov.descrizione;
          if ("speciale" in ov) p.speciale = ov.speciale;
          if ("congelato" in ov) p.congelato = ov.congelato;
        }
      }
      p.speciale = !!p.speciale;
      p.congelato = !!p.congelato;
    });
    if (!editor) list = list.filter((p) => !p.congelato);   // i clienti NON vedono i piatti congelati
    // piatti normali prima, SPECIALITÀ in fondo (ordine stabile)
    return list.filter((p) => !p.speciale).concat(list.filter((p) => p.speciale));
  }
  // Piatto originale (menu-data.js) per capire cosa è stato davvero cambiato
  function baseDish(slug, nome) {
    const cat = catBySlug(slug); if (!cat) return null;
    let arr = cat.piatti || [];
    if (cat.sezioni) { arr = []; cat.sezioni.forEach((s) => { arr = arr.concat(s.piatti || []); }); }
    for (let i = 0; i < arr.length; i++) if (arr[i].nome === nome) return arr[i];
    return null;
  }
  function countOf(cat) { return piattiOf(cat).length; }
  function sezioneLabel(tipo) { const m = WINE_TYPES[tipo]; return (m && (m[lang] || m.it)) || tipo; }

  function catBySlug(s) { return categorie.filter((c) => c.slug === s)[0]; }
  function gridCats() { return categorie; }

  // Carosello unico "Specialità": TUTTI i piatti con speciale=true, da ogni categoria (in ordine di menu)
  function allSpecialsCat() {
    const list = [];
    categorie.forEach((cat) => {
      piattiOf(cat).forEach((p) => { if (p.speciale) list.push(Object.assign({}, p, { _ovslug: cat.slug })); });
    });
    const nome = {}; LANGS.forEach((l) => { nome[l] = (I18N[l] && I18N[l].specialtiesTitle) || "Specialità"; });
    return { slug: "specialita", _pseudo: true, _prebuilt: true, _allspecial: true, nome: nome, piatti: list };
  }

  /* --- utilità overlay --- */
  function updateScroll() {
    const anyOpen = [overlay, specOverlay, $("#edit-overlay")].some((o) => o && o.classList.contains("open"));
    document.body.style.overflow = anyOpen ? "hidden" : "";
    const lb = $("#lang-btn"); if (lb) lb.style.display = anyOpen ? "none" : "";
    if (anyOpen) closeLangPanel();
  }
  let toastEl = null;
  function showToast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.remove("show"); void toastEl.offsetWidth; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  /* ==========================================================================
     LINGUA
     ======================================================================== */
  function detectLang() {
    const saved = localStorage.getItem("vdc_lang");
    if (saved && LANGS.indexOf(saved) !== -1) return saved;
    const navs = navigator.languages || [navigator.language || "it"];
    for (const l of navs) { const code = String(l).slice(0, 2).toLowerCase(); if (LANGS.indexOf(code) !== -1) return code; }
    return "it";
  }
  function applyLang(next) {
    lang = LANGS.indexOf(next) !== -1 ? next : "it";
    localStorage.setItem("vdc_lang", lang);
    const rtl = RTL_LANGS.indexOf(lang) !== -1;
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    $("#lang-cur").textContent = LANG_SHORT[lang];
    (function () { var f = $("#lang-cur-flag"); if (f) f.textContent = LANG_FLAG[lang] || "🌐"; })();
    renderStatic();
    rebuildGrid();
    buildLangPanel();
    if (overlay.classList.contains("open") && currentCat) {
      if (currentCat._allspecial) openSpecialita(); else openCarousel(currentCat);
    }
  }
  function buildLangPanel() {
    const list = $("#lang-list");
    $("#lang-title").textContent = t("langTitle");
    list.innerHTML = "";
    LANGS.forEach((code) => {
      const b = document.createElement("button");
      b.className = "lang-opt" + (code === lang ? " active" : "");
      b.setAttribute("role", "menuitem");
      b.innerHTML = '<span class="lang-flag">' + (LANG_FLAG[code] || "") + '</span><span class="lang-code">' + LANG_SHORT[code] + "</span><span>" + LANG_NATIVE[code] + "</span>";
      b.addEventListener("click", function () { closeLangPanel(); applyLang(code); });
      list.appendChild(b);
    });
  }
  function openLangPanel() { $("#lang-panel").classList.add("open"); $("#lang-panel").setAttribute("aria-hidden", "false"); $("#lang-btn").setAttribute("aria-expanded", "true"); }
  function closeLangPanel() { $("#lang-panel").classList.remove("open"); $("#lang-panel").setAttribute("aria-hidden", "true"); $("#lang-btn").setAttribute("aria-expanded", "false"); }
  function toggleLangPanel() { $("#lang-panel").classList.contains("open") ? closeLangPanel() : openLangPanel(); }

  /* ==========================================================================
     TESTI STATICI (intestazione, footer, specialità, hint)
     ======================================================================== */
  function renderStatic() {
    $("#r-kicker").textContent = t("kicker");
    $("#r-sub").textContent = t("sub");
    document.title = "Vico del Carmine — " + t("sub");

    // footer
    const loc = (hasData && MENU_DATA.location) || "Via Pisana 40/r, Firenze";
    $("#f-addr-link").textContent = loc;
    $("#f-addr-link").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Vico del Carmine " + loc);
    renderFootNote();

    // specialità (testata del sotto-menu)
    $("#spec-kicker").textContent = t("specialtiesKicker");
    $("#spec-title").textContent = t("specialtiesTitle");
    $("#spec-sub").textContent = t("specialtiesSub");

    // hint carosello + skip intro
    $("#ov-hint").textContent = t("swipeHint");
    const skip = $("#intro-skip"); if (skip) skip.textContent = t("skipIntro");
    $("#hero-logo").alt = "Vico del Carmine";
    $("#f-ver").textContent = "v " + APP_VERSION;
  }
  function renderFootNote() {
    const el = $("#f-note");
    if (!note) { el.textContent = ""; return; }
    const parts = [];
    if (note.coperto != null) parts.push(t("coperto") + ' <span class="euro">' + fmtPrice(note.coperto) + "</span>");
    if (note.aggiunte != null) parts.push(t("aggiunte") + ' <span class="euro">' + fmtPrice(note.aggiunte) + "</span>");
    if (note.burrata_stracciatella != null) parts.push(t("burrata") + ' <span class="euro">' + fmtPrice(note.burrata_stracciatella) + "</span>");
    if (note.impasti_speciali != null) parts.push(t("impasti") + ' <span class="euro">' + fmtPrice(note.impasti_speciali) + "</span>");
    el.innerHTML = parts.join(" · ");
  }

  /* ==========================================================================
     RIQUADRO SPECIALITÀ + GRIGLIA CATEGORIE
     ======================================================================== */
  function buildFeatures() {
    const grid = $("#grid");
    if (!allSpecialsCat().piatti.length) return;
    const s = document.createElement("button");
    s.className = "feature specialita";
    s.innerHTML =
      '<span class="shine"></span>' +
      '<span class="spark s1">✦</span><span class="spark s2">✧</span><span class="spark s3">✦</span>' +
      '<span class="feat-ico">⭐</span>' +
      '<span class="feat-txt">' +
      '<span class="feat-title">' + t("specialtiesTitle") + "</span>" +
      '<span class="feat-sub">' + t("specialtiesSub") + "</span>" +
      "</span>" +
      '<span class="feat-side">›</span>';
    s.addEventListener("click", openSpecialita);
    grid.appendChild(s);
  }

  function buildGrid() {
    const grid = $("#grid");
    gridCats().forEach(function (cat, i) {
      const btn = document.createElement("button");
      btn.className = "cat-btn";
      btn.style.animationDelay = 120 + i * 45 + "ms";
      btn.setAttribute("aria-label", catName(cat));
      btn.innerHTML =
        '<span class="arrow">›</span>' +
        '<span class="ico">' + iconFor(cat) + "</span>" +
        '<span class="label">' + catName(cat) +
        '<span class="count">' + countOf(cat) + " " + t("dishes") + "</span></span>";
      btn.addEventListener("click", function () { openCarousel(cat); });
      grid.appendChild(btn);
    });
  }
  function rebuildGrid() { $("#grid").innerHTML = ""; buildFeatures(); buildGrid(); }

  /* --- Specialità: un UNICO carosello con tutti i piatti ⭐ --- */
  function openSpecialita() { openCarousel(allSpecialsCat()); }
  function closeSpecialita() { specOverlay.classList.remove("open"); updateScroll(); }

  /* ==========================================================================
     CAROSELLO CARTE DA POKER
     ======================================================================== */
  let piatti = [], cards = [], index = 0, n = 0, staggerTimer = null;

  const BASE = "translate(-50%,-50%) ";
  const STATE = {
    "-1": { t: BASE + "translateX(-135%) rotateZ(-24deg) rotateY(16deg) scale(.92)", o: 0, z: 4 },
    "0":  { t: BASE + "rotateZ(0deg) translateY(0) scale(1)",                        o: 1, z: 50 },
    "1":  { t: BASE + "rotateZ(5deg)  translate(15px,-14px) scale(.94)",             o: 1, z: 40 },
    "2":  { t: BASE + "rotateZ(10deg) translate(27px,-26px) scale(.88)",             o: .9, z: 30 },
    "3":  { t: BASE + "rotateZ(14deg) translate(38px,-37px) scale(.82)",             o: .78, z: 20 },
    "hi": { t: BASE + "rotateZ(18deg) translate(48px,-47px) scale(.78)",             o: 0, z: 10 },
  };
  const DECK_START = BASE + "translateY(46px) rotateZ(-7deg) scale(.9)";

  function offset(i) { let d = i - index; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d; }
  function stateFor(d) {
    if (d === 0) return STATE["0"];
    if (d === 1) return STATE["1"];
    if (d === 2) return STATE["2"];
    if (d === 3) return STATE["3"];
    if (d === -1) return STATE["-1"];
    if (d < -1) return { t: STATE["-1"].t, o: 0, z: 3 };
    return STATE["hi"];
  }
  const WINDOW = 4;   // quante carte tenere "vive" per lato (le altre si nascondono = più fluido)
  function position(stagger) {
    if (pageMode()) { positionPages(); return; }
    cards.forEach(function (el, i) {
      const d = offset(i), s = stateFor(d);
      if (Math.abs(d) > WINDOW) { el.style.display = "none"; el.classList.remove("is-front"); el.setAttribute("aria-hidden", "true"); return; }
      el.style.display = ""; el.style.visibility = "";
      el.style.zIndex = s.z; el.style.opacity = s.o; el.style.transform = s.t;
      el.style.transitionDelay = stagger ? Math.max(0, d) * 70 + "ms" : "0ms";
      el.classList.toggle("is-front", d === 0);
      el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    });
    countEl.textContent = (index + 1) + " / " + n;
    Array.prototype.forEach.call(dotsEl.children, function (dot, i) { dot.classList.toggle("active", i === index); });
  }
  function buildCard(p, fallbackIcon) {
    const card = document.createElement("article");
    card.className = "card" + (p.image ? "" : " no-photo") + (p.speciale ? " special" : "");
    const price = (p.prezzo != null && p.prezzo !== "") ? '<span class="price">' + fmtPrice(p.prezzo) + "</span>" : "";
    const priceInline = (p.prezzo != null && p.prezzo !== "") ? '<span class="price-inline">' + fmtPrice(p.prezzo) + "</span>" : "";   // pagine mobile: accanto al nome
    const desc = dishDesc(p);
    const descHtml = desc ? "<p>" + desc + "</p>" : "";
    const kick = p.speciale ? '<p class="kick spec-kick">✦ ' + t("specialtiesTitle") + " ✦</p>"
      : (p._sezione ? '<p class="kick">' + sezioneLabel(p._sezione) + "</p>" : "");
    card.innerHTML =
      '<div class="photo"><div class="fallback">' + (fallbackIcon || "🍽️") + "</div>" + price + "</div>" +
      '<div class="body">' + kick + '<div class="line"><h3>' + dishName(p) + "</h3>" + priceInline + "</div>" + descHtml + '<span class="seal">♦</span></div>';
    if (p.image) {
      const img = new Image();
      img.alt = cleanName(p.nome); img.loading = "lazy";
      img.onload = function () { img.classList.add("loaded"); };
      img.onerror = function () { img.remove(); card.classList.add("no-photo"); };
      img.src = p.image;
      const photo = card.querySelector(".photo");
      photo.insertBefore(img, photo.querySelector(".fallback").nextSibling);
    }
    card.addEventListener("click", function () {
      if (Date.now() - swipedAt < 400) return;            // un trascinamento col mouse non è anche un click
      if (card.classList.contains("is-front") && !flipping) go(1);
    });
    return card;
  }
  function openCarousel(cat) {
    currentCat = cat;
    piatti = cat._prebuilt ? cat.piatti : piattiOf(cat); n = piatti.length; index = 0;
    cancelFlip();
    const pages = isPageMode();
    overlay.classList.toggle("pages", pages);          // mobile: una pagina a schermo intero per piatto
    const icon = iconFor(cat);
    titleEl.innerHTML = '<span class="ico">' + icon + "</span>" + catName(cat);

    deckEl.innerHTML = "";
    cards = piatti.map(function (p) { const el = buildCard(p, icon); deckEl.appendChild(el); return el; });

    dotsEl.innerHTML = "";
    piatti.forEach(function (_, i) {
      const b = document.createElement("button");
      b.className = "dot"; b.setAttribute("aria-label", String(i + 1));
      b.addEventListener("click", function () {
        audioUnlock();
        if (pageMode()) { if (i !== index) flipTo(i, i > index ? 1 : -1); }
        else { index = i; position(false); }
      });
      dotsEl.appendChild(b);
    });

    deckEl.classList.remove("touched");
    overlay.classList.add("open");
    updateScroll();

    if (pages) { position(false); return; }            // pagine: nessuna animazione di ingresso del mazzo
    cards.forEach(function (el) { el.style.transition = "none"; el.style.opacity = "0"; el.style.transform = DECK_START; });
    void deckEl.offsetWidth;
    cards.forEach(function (el) { el.style.transition = ""; });
    position(true);
    clearTimeout(staggerTimer);
    staggerTimer = setTimeout(function () { cards.forEach(function (el) { el.style.transitionDelay = "0ms"; }); }, n * 70 + 700);
  }
  function closeCarousel() { cancelFlip(); overlay.classList.remove("open"); updateScroll(); }
  function go(dir) {
    if (!n) return;
    if (pageMode()) { flipTo((index + dir + n) % n, dir); return; }
    index = (index + dir + n) % n; deckEl.classList.add("touched"); position(false);
  }

  /* ==========================================================================
     PAGINE A SCHERMO INTERO (mobile) — si sfogliano come un giornale
     Su telefono/tablet ogni piatto occupa tutto lo schermo: si cambia col dito
     (scorri o tocca), la pagina gira sul bordo come quella di un libro, con il
     fruscio della carta. Su computer resta il mazzo di carte.
     ======================================================================== */
  function isPageMode() { return !!(window.matchMedia && (window.matchMedia("(max-width: 640px)").matches || window.matchMedia("(pointer: coarse)").matches)); }
  function pageMode() { return overlay.classList.contains("pages"); }

  function positionPages() {
    cards.forEach(function (el, i) {
      const d = Math.abs(offset(i));
      el.style.transitionDelay = "0ms"; el.style.opacity = ""; el.style.transform = "";
      if (d === 0) { el.style.display = ""; el.style.visibility = ""; el.style.zIndex = 2; }
      else if (d <= 2) {   // pagine vicine: presenti ma invisibili, così la foto è già pronta quando si sfoglia
        el.style.display = ""; el.style.visibility = "hidden"; el.style.zIndex = 0;
        el.querySelectorAll("img").forEach(function (im) { im.loading = "eager"; });
      } else { el.style.display = "none"; el.style.visibility = ""; el.style.zIndex = ""; }
      el.classList.toggle("is-front", d === 0);
      el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    });
    countEl.textContent = (index + 1) + " / " + n;
    Array.prototype.forEach.call(dotsEl.children, function (dot, i) { dot.classList.toggle("active", i === index); });
  }

  /* --- SFOGLIO "A CARTA": la pagina si PIEGA mentre gira -------------------
     La pagina viene divisa in strisce verticali affiancate: ognuna ruota un
     po' piu' della precedente, cosi' il foglio si incurva invece di girare
     rigido come un pannello. Su ogni striscia una velatura scura e una di
     luce seguono l'inclinazione: e' l'ombreggiatura che fa "vedere" la piega.
     ---------------------------------------------------------------------- */
  const FOLD_N = 10;        // in quante strisce dividiamo la pagina (piu' alto = curva piu' morbida, ma piu' peso)
  const FOLD_BEND = 38;     // quanto si incurva la carta a meta' giro (gradi)
  const FOLD_MS = 760;      // durata di uno sfoglio completo con tocco/frecce (era 380: ora il doppio)
  const FOLD_P = 1500;      // profondita' prospettica: deve combaciare con il CSS (.overlay.pages .deck)
  let flipping = false, flip = null;   // flip = { dir, top, under, target, p }
  let foldEl = null, shadeEl = null, sheenEl = null, foldStrips = [], foldRaf = 0;

  function showPage(el, z) { el.style.display = ""; el.style.visibility = ""; el.style.opacity = ""; el.style.zIndex = z; }
  function lessMotion() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }

  // Costruisce le strisce copiando la pagina: ogni striscia mostra una fetta diversa.
  function buildFold(card) {
    if (!foldEl) {
      foldEl = document.createElement("div"); foldEl.className = "fold";
      shadeEl = document.createElement("div"); shadeEl.className = "fold-shade";
      sheenEl = document.createElement("div"); sheenEl.className = "fold-sheen";
    }
    // openCarousel svuota il contenitore delle carte: se serve li riattacco
    if (foldEl.parentNode !== deckEl) { deckEl.appendChild(foldEl); deckEl.appendChild(shadeEl); deckEl.appendChild(sheenEl); }
    const W = deckEl.clientWidth || window.innerWidth || 1;
    const sw = W / FOLD_N;
    foldEl.textContent = ""; foldStrips = [];
    for (let i = 0; i < FOLD_N; i++) {
      const strip = document.createElement("div");
      strip.className = "fold-strip";
      strip.style.left = (i * sw) + "px";
      strip.style.width = (sw + 1) + "px";       // 1px di sovrapposizione: niente righine fra le strisce
      const inner = document.createElement("div");
      inner.className = "fold-inner";
      inner.style.width = W + "px";
      inner.style.left = (-i * sw) + "px";
      const clone = card.cloneNode(true);
      clone.classList.remove("is-front");
      clone.removeAttribute("aria-hidden");
      clone.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;transform:none;transition:none;display:block;visibility:visible;opacity:1;animation:none;";
      inner.appendChild(clone);
      strip.appendChild(inner);
      foldEl.appendChild(strip);
      foldStrips.push(strip);
    }
    foldEl.classList.add("on"); shadeEl.classList.add("on"); sheenEl.classList.add("on");
  }

  // p = 0 pagina distesa · p = 1 pagina di taglio (sparita). Disegna la curva e la luce.
  function renderFold(p) {
    if (!foldStrips.length) return;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    if (flip) flip.p = p;
    const W = deckEl.clientWidth || window.innerWidth || 1;
    const sw = W / FOLD_N, cx = W / 2;
    const base = -90 * p;                               // la pagina intera ruota sul dorso
    const bend = FOLD_BEND * Math.sin(Math.PI * p);     // ...e si incurva soprattutto a meta' giro
    const ang = function (t) { return base - bend * Math.pow(t, 1.6); };   // il bordo libero corre avanti: e' la piega
    // 1) posiziono le strisce nello spazio, accumulando la cerniera di ognuna
    const sx = [0];                                     // x sullo schermo di ogni giuntura fra le strisce
    let x = 0, z = 0;
    for (let i = 0; i < FOLD_N; i++) {
      const deg = ang((i + 0.5) / FOLD_N), rad = deg * Math.PI / 180;
      foldStrips[i].style.transform =
        "translate3d(" + (x - i * sw).toFixed(2) + "px,0," + z.toFixed(2) + "px) rotateY(" + deg.toFixed(2) + "deg)";
      x += sw * Math.cos(rad);
      z += -sw * Math.sin(rad);                         // la carta si solleva verso di noi
      sx[i + 1] = cx + (x - cx) * (FOLD_P / (FOLD_P - z));   // piu' la carta si alza, piu' appare grande
    }
    // 2) ombra e luce come UN UNICO velo continuo sopra le strisce: cosi' la curva
    //    si legge morbida, senza le bande che si vedrebbero velando ogni striscia.
    const right = sx[FOLD_N];
    if (right < 2) { shadeEl.style.opacity = "0"; sheenEl.style.opacity = "0"; return; }
    shadeEl.style.opacity = "1"; sheenEl.style.opacity = "1";
    let dark = "", light = "", prev = -1;
    for (let i = 0; i <= FOLD_N; i++) {
      const deg = ang(i / FOLD_N), rad = deg * Math.PI / 180;
      const face = Math.cos(rad);
      const d = 0.66 * (1 - (face > 0 ? face : 0));                                  // di taglio = buio
      const g = (Math.abs(deg) - 34) / 15;
      const l = 0.26 * Math.exp(-g * g);                                             // banda di luce stretta: scorre lungo la piega
      const at = Math.max(prev, sx[i]); prev = at;                                   // le tappe non possono tornare indietro
      dark += (i ? "," : "") + "rgba(8,5,3," + d.toFixed(3) + ") " + at.toFixed(1) + "px";
      light += (i ? "," : "") + "rgba(255,243,222," + l.toFixed(3) + ") " + at.toFixed(1) + "px";
    }
    // coda: l'ombra che la pagina sollevata proietta su quella sotto
    const cast = 0.52 * Math.sin(Math.PI * p), castTo = Math.min(W, right + W * 0.42);
    dark += ",rgba(8,5,3," + cast.toFixed(3) + ") " + right.toFixed(1) + "px,rgba(8,5,3,0) " + castTo.toFixed(1) + "px";
    light += ",rgba(255,243,222,0) " + right.toFixed(1) + "px";
    shadeEl.style.backgroundImage = "linear-gradient(90deg," + dark + ")";
    sheenEl.style.backgroundImage = "linear-gradient(90deg," + light + ")";
  }
  function clearFold() {
    cancelAnimationFrame(foldRaf); foldRaf = 0;
    if (foldEl) { foldEl.classList.remove("on"); foldEl.textContent = ""; }
    if (shadeEl) { shadeEl.classList.remove("on"); shadeEl.style.backgroundImage = ""; }
    if (sheenEl) { sheenEl.classList.remove("on"); sheenEl.style.backgroundImage = ""; }
    foldStrips = [];
  }

  const easeSoft = function (t) { return t * t * (3 - 2 * t); };              // partenza e arrivo morbidi (tocco)
  const easeGlide = function (t) { return 1 - Math.pow(1 - t, 2.2); };        // il dito ha gia' dato lo slancio
  function animateFold(from, to, ms, ease, done) {
    cancelAnimationFrame(foldRaf);
    // Un fotogramma di respiro: il browser disegna le strisce mentre la pagina e'
    // ancora ferma, cosi' il movimento parte liscio invece di "inciampare".
    foldRaf = requestAnimationFrame(function () {
      const t0 = (window.performance || Date).now();
      (function step(now) {
        const t = Math.min(1, ((now || t0) - t0) / ms);
        renderFold(from + (to - from) * ease(t));
        if (t < 1) foldRaf = requestAnimationFrame(step); else done();
      })(t0);
    });
  }

  function flipBegin(dir, target) {
    if (flipping || n < 2) return false;
    if (target == null) target = (index + dir + n) % n;
    const cur = cards[index], tgt = cards[target];
    if (!cur || !tgt || cur === tgt) return false;
    flipping = true;
    // avanti: la pagina corrente si piega via e scopre la successiva che sta sotto
    // indietro: la pagina precedente arriva dal bordo e si distende sopra la corrente
    flip = dir > 0 ? { dir: 1, top: cur, under: tgt, target: target, p: 0 } : { dir: -1, top: tgt, under: cur, target: target, p: 1 };
    showPage(flip.under, 1); showPage(flip.top, 2);
    buildFold(flip.top);
    flip.top.style.visibility = "hidden";     // al suo posto ora ci sono le strisce
    renderFold(flip.p);
    deckEl.classList.add("touched");
    return true;
  }

  function flipUpdate(dx) {   // la pagina segue il dito
    if (!flip) return;
    const W = deckEl.clientWidth || window.innerWidth || 1;
    const k = dx / W * 1.34;                       // ~3/4 di schermo = giro completo
    renderFold(flip.dir > 0 ? -k : 1 - k);
  }

  function flipEnd(commit, fromDrag, ms) {
    if (!flip) return;
    const f = flip; flip = null;
    const to = f.dir > 0 ? (commit ? 1 : 0) : (commit ? 0 : 1);
    const from = f.p;
    const left = Math.abs(to - from);              // quanto manca: piu' strada = piu' tempo
    if (ms == null) ms = fromDrag ? (commit ? 240 + 520 * left : 200 + 300 * left) : FOLD_MS;
    if (commit) playFlip();
    animateFold(from, to, Math.max(120, ms), fromDrag ? easeGlide : easeSoft, function () {
      f.top.style.visibility = "";
      if (commit) index = f.target;
      flipping = false;
      clearFold();
      position(false);
    });
  }

  function flipTo(target, dir) {
    if (lessMotion()) { index = target; position(false); playFlip(); return; }   // animazioni ridotte: cambio secco
    if (flipBegin(dir, target)) flipEnd(true, false);
  }

  function cancelFlip() {
    if (flip) { flip.top.style.visibility = ""; flip = null; }
    flipping = false; clearFold();
  }

  // --- suono dello sfoglio: fruscio di carta generato al volo (nessun file), con pulsante per zittirlo ---
  let actx = null, muted = false;
  try { muted = localStorage.getItem("vdc_mute") === "1"; } catch (e) {}
  function audioUnlock() {   // i telefoni sbloccano l'audio solo dentro un tocco dell'utente
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
    } catch (e) {}
  }
  function playFlip() {
    if (muted || !pageMode() || !actx || actx.state !== "running") return;
    try {
      const t0 = actx.currentTime;
      function burst(at, dur, freq, q, vol) {   // soffio di rumore filtrato con inviluppo rapido
        const len = Math.max(1, Math.floor(actx.sampleRate * dur));
        const buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = actx.createBufferSource(); src.buffer = buf;
        const bp = actx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = q;
        const g = actx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(vol, at + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        src.connect(bp); bp.connect(g); g.connect(actx.destination);
        src.start(at); src.stop(at + dur + 0.02);
      }
      burst(t0, 0.16, 2600, 0.7, 0.35);          // la pagina si solleva
      burst(t0 + 0.13, 0.11, 1400, 0.9, 0.22);   // la pagina si posa
    } catch (e) {}
  }
  function renderMute() { const b = $("#ov-mute"); if (b) { b.textContent = muted ? "🔇" : "🔊"; b.setAttribute("aria-pressed", muted ? "true" : "false"); } }

  // --- blocco dello zoom a due dita e del doppio tocco (l'iPhone ignora il viewport: serve questo) ---
  function initTouchGuards() {
    ["gesturestart", "gesturechange", "gestureend"].forEach(function (ev) {
      document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
    });
    document.addEventListener("touchstart", function (e) { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
    document.addEventListener("touchmove", function (e) { if (e.touches.length > 1 || (e.scale != null && e.scale !== 1)) e.preventDefault(); }, { passive: false });
    let lastTap = 0;   // due tocchi ravvicinati = "ingrandisci" per iOS → annulliamo il secondo (non sui comandi)
    document.addEventListener("touchend", function (e) {
      const now = Date.now();
      if (now - lastTap < 320 && !(e.target.closest && e.target.closest("button,input,textarea,select,label,a"))) e.preventDefault();
      lastTap = now;
    }, { passive: false });
    // se un telefono riuscisse comunque a ingrandire, proviamo a riportarlo a posto (non garantito ovunque)
    if (window.visualViewport) {
      let fixT = null;
      window.visualViewport.addEventListener("resize", function () {
        clearTimeout(fixT);
        if (window.visualViewport.scale > 1.02) fixT = setTimeout(resetZoom, 450);
      });
    }
  }
  function resetZoom() {
    const vp = document.querySelector('meta[name="viewport"]'); if (!vp) return;
    const c = vp.getAttribute("content") || "";
    vp.setAttribute("content", c.replace("maximum-scale=1", "maximum-scale=1.0001"));
    setTimeout(function () { vp.setAttribute("content", c); try { window.scrollTo(0, 0); } catch (e) {} }, 60);
  }

  function initPages() {
    renderMute();
    const mb = $("#ov-mute");
    if (mb) mb.addEventListener("click", function () {
      muted = !muted; try { localStorage.setItem("vdc_mute", muted ? "1" : "0"); } catch (e) {}
      renderMute(); audioUnlock();
      if (!muted) setTimeout(playFlip, 80);   // piccola prova del suono quando lo riaccendi
    });
    document.addEventListener("touchend", audioUnlock, { passive: true });
    document.addEventListener("click", audioUnlock, { passive: true });
    initTouchGuards();
  }

  /* --- comandi carosello --- */
  $("#nav-prev").addEventListener("click", function () { go(-1); });
  $("#nav-next").addEventListener("click", function () { go(1); });
  $("#ov-close").addEventListener("click", closeCarousel);
  $("#spec-close").addEventListener("click", closeSpecialita);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeCarousel(); });
  specOverlay.addEventListener("click", function (e) { if (e.target === specOverlay) closeSpecialita(); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (overlay.classList.contains("open")) closeCarousel();
      else if (specOverlay.classList.contains("open")) closeSpecialita();
      else if ($("#lang-panel").classList.contains("open")) closeLangPanel();
      return;
    }
    if (!overlay.classList.contains("open")) return;
    if (e.key === "ArrowLeft") go(document.documentElement.dir === "rtl" ? 1 : -1);
    else if (e.key === "ArrowRight") go(document.documentElement.dir === "rtl" ? -1 : 1);
  });

  // swipe / trascinamento
  let sx = 0, sy = 0, st = 0, dragging = false, dragDir = 0, swipedAt = 0;
  function start(x, y) { sx = x; sy = y; st = Date.now(); dragging = true; dragDir = 0; }
  function end(x, y) {   // mouse (computer): scorrimento a scatto come prima
    if (!dragging) return; dragging = false;
    const dx = x - sx, dy = y - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { swipedAt = Date.now(); go(dx < 0 ? 1 : -1); }
  }
  deckEl.addEventListener("touchstart", function (e) {
    audioUnlock();
    if (e.touches.length > 1) { if (flip) flipEnd(false, true); dragging = false; dragDir = 0; return; }
    start(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  deckEl.addEventListener("touchmove", function (e) {
    if (!dragging || !pageMode()) return;
    if (e.touches.length > 1) { e.preventDefault(); if (flip) flipEnd(false, true); dragging = false; dragDir = 0; return; }
    const t = e.touches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (!dragDir) {   // capisco se è uno scorrimento orizzontale
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { dragDir = dx < 0 ? 1 : -1; if (!flipBegin(dragDir)) { dragging = false; dragDir = 0; return; } }
      else if (Math.abs(dy) > 12) { dragging = false; return; }
      else return;
    }
    e.preventDefault();
    flipUpdate(dx);
  }, { passive: false });
  deckEl.addEventListener("touchend", function (e) {
    if (pageMode()) e.preventDefault();   // il tocco lo gestiamo qui: niente click fantasma né doppio-tocco-zoom
    if (!dragging) return;
    const t = e.changedTouches[0];
    if (!pageMode()) { end(t.clientX, t.clientY); return; }
    dragging = false;
    const dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
    if (dragDir) {   // rilascio: completo lo sfoglio se il dito è andato abbastanza lontano o abbastanza veloce
      const v = Math.abs(dx) / Math.max(1, dt);
      flipEnd(Math.abs(dx) > 60 || (v > 0.45 && Math.abs(dx) > 20), true);
      dragDir = 0;
    } else if (dt < 400 && Math.abs(dx) < 10 && Math.abs(dy) < 10) go(1);   // tocco = piatto successivo
  }, { passive: false });
  deckEl.addEventListener("touchcancel", function () { if (flip) flipEnd(false, true); dragging = false; dragDir = 0; }, { passive: true });
  deckEl.addEventListener("mousedown", function (e) { start(e.clientX, e.clientY); });
  window.addEventListener("mouseup", function (e) { end(e.clientX, e.clientY); });

  /* --- selettore lingua: comandi --- */
  $("#lang-btn").addEventListener("click", function (e) { e.stopPropagation(); toggleLangPanel(); });
  document.addEventListener("click", function (e) {
    const panel = $("#lang-panel"), btn = $("#lang-btn");
    if (panel.classList.contains("open") && !panel.contains(e.target) && e.target !== btn) closeLangPanel();
  });

  /* ==========================================================================
     INTRO — video del logo all'apertura
     ======================================================================== */
  function initIntro() {
    const intro = $("#intro");
    if (!intro) return;
    const video = $("#intro-video");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let done = false;
    function dismiss() {
      if (done) return; done = true;
      intro.classList.add("hide");
      try { video && video.pause(); } catch (e) {}
      sessionStorage.setItem("vdc_intro_seen", "1");
      setTimeout(function () { intro.style.display = "none"; }, 650);
    }
    // già vista in questa sessione, o animazioni ridotte → salta
    if (reduce || sessionStorage.getItem("vdc_intro_seen")) { intro.style.display = "none"; return; }
    intro.addEventListener("click", dismiss);
    if (video) {
      video.addEventListener("ended", dismiss);
      // riproduci TUTTA l'animazione in ~4 secondi (accelera se il video è più lungo)
      function speedTo4() { if (video.duration && video.duration > 4.2) video.playbackRate = Math.min(3, video.duration / 4); }
      video.addEventListener("loadedmetadata", speedTo4); speedTo4();
      const p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloccato: resta il poster, tocca per entrare */ });
    }
    setTimeout(dismiss, 4200);   // durata massima dell'intro (~4 secondi)
  }

  /* ==========================================================================
     EDITOR NASCOSTO — prezzi & foto (tieni premuto 5s → password)
     Richiede Supabase collegato (store.js). Senza, il menu resta quello di base.
     ======================================================================== */
  const editOverlay = $("#edit-overlay");
  const editInner = $("#edit-inner");
  let editorPwd = null;

  function closePw() { $("#pw-modal").classList.remove("open"); }
  function closeEditor() { editOverlay.classList.remove("open"); updateScroll(); }

  function openPwPrompt() {
    const pwBox = $("#pw-box");
    pwBox.innerHTML =
      '<h2>Area riservata</h2><p class="sub">Inserisci la password per modificare prezzi e foto.</p>' +
      '<input type="password" class="field" id="pw-input" inputmode="numeric" pattern="[0-9]*" placeholder="Password" autocomplete="off">' +
      '<p class="approve-err" id="pw-err"></p>' +
      '<div class="approve-actions"><button class="btn btn-no" id="pw-cancel">Annulla</button><button class="btn btn-primary" id="pw-go">Entra</button></div>';
    $("#pw-modal").classList.add("open");
    const inp = $("#pw-input"); inp.focus();
    async function go() {
      const pwd = inp.value.trim();
      const btn = $("#pw-go"); btn.disabled = true; $("#pw-err").textContent = "Verifico...";
      let role = null;
      try { role = await Store.verifyPassword(pwd); }
      catch (e) { $("#pw-err").textContent = "Supabase non ancora collegato"; btn.disabled = false; return; }
      if (!role) { $("#pw-err").textContent = "Password errata"; inp.value = ""; btn.disabled = false; return; }
      editorPwd = pwd; closePw(); openEditor();
    }
    $("#pw-go").addEventListener("click", go);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    $("#pw-cancel").addEventListener("click", closePw);
  }

  function pickPhoto(setUrl) {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    inp.addEventListener("change", async function () {
      const f = inp.files && inp.files[0]; if (!f) return;
      showToast("Carico la foto...");
      try { const url = await Store.uploadPhoto(f); setUrl(url); showToast("✅ Foto caricata"); }
      catch (e) { showToast("Errore: controlla il bucket 'foto' su Supabase"); }
    });
    inp.click();
  }

  function openEditor() {
    editInner.innerHTML =
      '<p class="me-kick">⭐ Modifica menu · prezzi · foto · piatti</p>' +
      '<p class="me-frozen" id="me-frozen" hidden>❄️ <b id="me-frozen-n">0</b> piatti nascosti ai clienti (congelati)</p>' +
      '<div class="me-nav">' +
      '<button type="button" class="me-arrow" id="me-prev" aria-label="‹">‹</button>' +
      '<div class="me-navlabel"><span id="me-catname"></span><small id="me-counter"></small></div>' +
      '<button type="button" class="me-arrow" id="me-next" aria-label="›">›</button>' +
      "</div>" +
      '<div id="me-pager"></div>' +
      '<button class="btn btn-primary btn-big" id="me-save">Pubblica</button>' +
      '<p class="hint-center" id="me-msg">Le modifiche vanno online per tutti i clienti.</p>';
    const pager = $("#me-pager");
    const pages = [];
    const removedSet = {};                          // "slug::nome" dei piatti-base eliminati
    ovRemoved().forEach(function (k) { removedSet[k] = true; });  // eredita eliminazioni già pubblicate

    function dishRow(slug, p) {
      p = p || {};
      const added = !!(p._added || p.__new);
      const basenome = added ? "" : (p._basenome || p.nome);
      const row = document.createElement("div");
      row.className = "dish-edit"; row.dataset.slug = slug; row.dataset.added = added ? "1" : "0";
      if (!added) row.dataset.basenome = basenome;
      row.innerHTML =
        '<div class="de-top"><input class="field de-name-input" placeholder="Nome del piatto">' +
        '<button type="button" class="de-del" aria-label="Elimina piatto">🗑</button></div>' +
        '<input class="field de-desc" placeholder="Descrizione (facoltativa)">' +
        '<div class="de-line"><span class="de-lab">€</span>' +
        '<input class="field de-prezzo" inputmode="decimal" placeholder="—">' +
        '<button type="button" class="de-foto"><span class="de-foto-txt">📷 Foto</span></button>' +
        '<button type="button" class="de-foto-del" aria-label="Togli foto" hidden>✕</button></div>' +
        '<label class="de-special"><input type="checkbox" class="de-special-cb"> ⭐ Specialità <small>(stella nel nome + carta oro + carosello Specialità)</small></label>' +
        '<label class="de-congela"><input type="checkbox" class="de-congela-cb"> ❄️ Congela <small>(nascondi ai clienti, resta qui)</small></label>' +
        '<input type="hidden" class="de-fotoval">';
      const specCb = row.querySelector(".de-special-cb");
      specCb.checked = !!p.speciale;
      if (p.speciale) row.classList.add("special");
      specCb.addEventListener("change", function () { row.classList.toggle("special", specCb.checked); });
      const congelaCb = row.querySelector(".de-congela-cb");
      congelaCb.checked = !!p.congelato;
      if (p.congelato) row.classList.add("frozen");
      congelaCb.addEventListener("change", function () { row.classList.toggle("frozen", congelaCb.checked); updateFrozenCount(); });
      row.querySelector(".de-name-input").value = cleanName(p.nome);   // la ⭐ la mette il flag, non si scrive qui
      row.querySelector(".de-desc").value = (p.descrizione && p.descrizione.it) || "";
      row.querySelector(".de-prezzo").value = (p.prezzo != null ? p.prezzo : "");
      const fv = row.querySelector(".de-fotoval"); fv.value = p.image || "";
      const fb = row.querySelector(".de-foto");
      const fdel = row.querySelector(".de-foto-del");
      function refresh() {
        const has = !!fv.value;
        fb.innerHTML = has ? '<img src="' + fv.value + '" alt=""><span class="de-foto-txt">Cambia</span>' : '<span class="de-foto-txt">📷 Foto</span>';
        fdel.hidden = !has;
      }
      refresh();
      fb.addEventListener("click", function () { pickPhoto(function (url) { fv.value = url; refresh(); }); });
      fdel.addEventListener("click", function () { fv.value = ""; refresh(); });
      row.querySelector(".de-del").addEventListener("click", function () {
        if (!added) removedSet[slug + "::" + basenome] = true;   // piatto-base → segnato eliminato
        row.remove();
      });
      return row;
    }

    categorie.forEach(function (cat) {
      const sec = document.createElement("section"); sec.className = "cat-edit me-page"; sec.dataset.slug = cat.slug;
      const list = document.createElement("div"); list.className = "dish-list";
      piattiOf(cat, true).forEach(function (p) { list.appendChild(dishRow(cat.slug, p)); });   // true = mostra anche i congelati
      const add = document.createElement("button");
      add.type = "button"; add.className = "btn btn-add"; add.textContent = "➕ Aggiungi piatto";
      add.addEventListener("click", function () {
        const r = dishRow(cat.slug, { __new: true }); list.appendChild(r);
        const ni = r.querySelector(".de-name-input"); if (ni) ni.focus();
      });
      sec.appendChild(list); sec.appendChild(add); pager.appendChild(sec);
      pages.push({ el: sec, nome: iconFor(cat) + " " + catName(cat) });
    });

    function updateFrozenCount() {
      const n = editInner.querySelectorAll(".de-congela-cb:checked").length;
      const el = $("#me-frozen"); if (el) { el.hidden = n === 0; $("#me-frozen-n").textContent = n; }
    }
    updateFrozenCount();

    let idx = 0;
    function show(i) {
      idx = (i + pages.length) % pages.length;
      pages.forEach(function (p, j) { p.el.style.display = j === idx ? "" : "none"; });
      $("#me-catname").textContent = pages[idx].nome;
      $("#me-counter").textContent = (idx + 1) + " / " + pages.length;
      editOverlay.scrollTop = 0;
    }
    $("#me-prev").addEventListener("click", function () { show(idx - 1); });
    $("#me-next").addEventListener("click", function () { show(idx + 1); });
    show(0);
    $("#me-save").addEventListener("click", function () { saveEditor(removedSet); });
    editOverlay.classList.add("open"); editOverlay.scrollTop = 0; updateScroll();
  }

  async function saveEditor(removedSet) {
    if (!overridesLoaded) { $("#me-msg").textContent = "⚠️ Modifiche non caricate (connessione). Ricarica la pagina prima di salvare, per non perdere il lavoro."; return; }
    const edits = {}, added = {};
    const removed = Object.keys(removedSet || {});
    editInner.querySelectorAll(".cat-edit").forEach(function (sec) {
      const slug = sec.dataset.slug;
      sec.querySelectorAll(".dish-edit").forEach(function (row) {
        const nome = cleanName(row.querySelector(".de-name-input").value);   // mai la ⭐ dentro il nome: la mette il flag
        const prezzo = row.querySelector(".de-prezzo").value.trim();
        const image = row.querySelector(".de-fotoval").value.trim();
        const desc = (row.querySelector(".de-desc").value || "").trim();
        const special = row.querySelector(".de-special-cb").checked;
        const congelato = row.querySelector(".de-congela-cb").checked;
        if (row.dataset.added === "1") {                                   // NUOVO piatto
          if (!nome) return;
          const d = { nome: nome, prezzo: prezzo, image: image };
          if (desc) d.descrizione = { it: desc };
          if (special) d.speciale = true;
          if (congelato) d.congelato = true;
          (added[slug] = added[slug] || []).push(d);
        } else {                                                            // ESISTENTE: salva SOLO ciò che è cambiato dal menu base
          const basenome = row.dataset.basenome;
          const base = baseDish(slug, basenome) || {};
          const ov = {};
          if (prezzo !== "" && prezzo !== String(base.prezzo != null ? base.prezzo : "")) ov.prezzo = prezzo;
          if (image !== (base.image || "")) ov.image = image;
          if (nome && nome !== cleanName(basenome)) ov.nome = nome;   // confronto senza ⭐: i piatti storici non risultano "cambiati"
          const baseDescIt = (base.descrizione && base.descrizione.it) || "";
          if (desc !== baseDescIt) ov.descrizione = { it: desc };
          if (special !== !!base.speciale) ov.speciale = special;
          if (congelato !== !!base.congelato) ov.congelato = congelato;
          if (Object.keys(ov).length) edits[slug + "::" + basenome] = ov;
        }
      });
    });
    const payload = { edits: edits, removed: removed, added: added };
    const btn = $("#me-save"); btn.disabled = true; $("#me-msg").textContent = "Pubblico...";
    try {
      const ok = await Store.saveOverrides(payload, editorPwd);
      if (ok) { overrides = payload; rebuildGrid(); closeEditor(); showToast("✅ Menu aggiornato"); }
      else { $("#me-msg").textContent = "Password non valida."; btn.disabled = false; }
    } catch (e) { $("#me-msg").textContent = "Errore di collegamento a Supabase."; btn.disabled = false; }
  }

  function initHiddenEditor() {
    const hotspot = $("#notif-hotspot");
    const ring = $("#notif-ring");
    const HOLD = 5000;
    let timer = null, rafId = null, startT = 0;
    function paint(p) { const deg = p * 360; ring.style.background = "conic-gradient(var(--gold) " + deg + "deg, rgba(230,178,74,.15) " + deg + "deg)"; }
    function startPress() {
      hotspot.classList.add("pressing"); startT = performance.now(); cancelAnimationFrame(rafId);
      (function step(now) { const p = Math.min(1, (now - startT) / HOLD); paint(p); if (p < 1) rafId = requestAnimationFrame(step); })(startT);
      clearTimeout(timer); timer = setTimeout(function () { endPress(); openPwPrompt(); }, HOLD);
    }
    function endPress() { hotspot.classList.remove("pressing"); clearTimeout(timer); cancelAnimationFrame(rafId); paint(0); }
    hotspot.addEventListener("pointerdown", function (e) { e.preventDefault(); startPress(); });
    hotspot.addEventListener("pointerup", endPress);
    hotspot.addEventListener("pointerleave", endPress);
    hotspot.addEventListener("pointercancel", endPress);
    $("#pw-modal").addEventListener("click", function (e) { if (e.target === $("#pw-modal")) closePw(); });
    editOverlay.addEventListener("click", function (e) { if (e.target === editOverlay) closeEditor(); });
    $("#edit-close").addEventListener("click", closeEditor);
  }

  /* ==========================================================================
     AVVIO
     ======================================================================== */
  document.addEventListener("DOMContentLoaded", async function () {
    initIntro();
    lang = detectLang();
    $("#lang-cur").textContent = LANG_SHORT[lang];
    (function () { var f = $("#lang-cur-flag"); if (f) f.textContent = LANG_FLAG[lang] || "🌐"; })();
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.indexOf(lang) !== -1 ? "rtl" : "ltr";
    renderStatic();
    buildLangPanel();
    rebuildGrid();
    initHiddenEditor();
    initPages();

    // eventuali modifiche pubblicate (prezzi/foto) da Supabase
    try {
      const ov = await Store.getOverrides();
      // riuscito SOLO se i dati arrivano davvero dal server: se vengono dalla copia
      // locale (database irraggiungibile) il salvataggio resta bloccato, per non
      // sovrascrivere online una versione letta dalla cache.
      overridesLoaded = !(Store.lastReadFromCache && Store.lastReadFromCache());
      if (ov && typeof ov === "object") { overrides = migrateOverrides(ov); rebuildGrid(); }
    } catch (e) { /* Supabase non raggiungibile: menu di base, e l'editor bloccherà il salvataggio */ }
  });

  // Service worker: app installabile + offline
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
