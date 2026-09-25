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
  const APP_VERSION = "25.09.2026 · sfoglio leggero";

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
      if (Math.abs(d) <= 2) preparaFoto(el);
      el.style.transitionDelay = stagger ? Math.max(0, d) * 70 + "ms" : "0ms";
      el.classList.toggle("is-front", d === 0);
      el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    });
    countEl.textContent = (index + 1) + " / " + n;
    Array.prototype.forEach.call(dotsEl.children, function (dot, i) { dot.classList.toggle("active", i === index); });
  }
  /* Una foto che non arriva al primo colpo NON si butta via. In sala il
     segnale va e viene, e prima bastava un intoppo per lasciare il piatto
     senza foto finché il cliente non ricaricava la pagina: sembrava che
     metà dei piatti la foto non l'avesse. Adesso si riprova tre volte,
     sempre con più calma, e poi ancora ogni volta che la pagina torna
     davanti o vicina. */
  function caricaFoto(card, img, url) {
    let prove = 0;
    function vai() { img.removeAttribute("src"); img.src = url; }
    img.onload = function () { img.classList.add("loaded"); card.classList.remove("no-photo"); card._fotoKo = false; };
    img.onerror = function () {
      prove++;
      if (prove <= 3) { setTimeout(vai, 1500 * prove); return; }
      card._fotoKo = true;
      card.classList.add("no-photo");
    };
    card._riprovaFoto = function () { if (card._fotoKo) { card._fotoKo = false; prove = 2; vai(); } };
    img.src = url;
  }
  // Le pagine vicine si preparano PRIMA: foto scaricata e già "aperta", così
  // quando la giri è pronta e non si vede il fondo marrone.
  function preparaFoto(el) {
    el.querySelectorAll(".photo img").forEach(function (im) {
      if (im.loading !== "eager") im.loading = "eager";
      if (im.decode) im.decode().catch(function () {});
    });
    if (el._riprovaFoto) el._riprovaFoto();
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
      img.alt = cleanName(p.nome); img.loading = "lazy"; img.decoding = "async";
      // Supabase manda le foto col permesso di essere conservate: chiederle
      // "in chiaro" permette al telefono di tenerle in memoria davvero (sw.js)
      if (/\.supabase\.co\//.test(p.image)) img.crossOrigin = "anonymous";
      const photo = card.querySelector(".photo");
      photo.insertBefore(img, photo.querySelector(".fallback").nextSibling);
      caricaFoto(card, img, p.image);
    }
    card.addEventListener("click", function () {
      if (Date.now() - swipedAt < 400) return;            // un trascinamento col mouse non è anche un click
      if (card.classList.contains("is-front") && !flipping) go(1);
    });
    if (typeof Ordina !== "undefined") Ordina.decora(card, p);   // pre-ordine (pezzo staccato: ordina.js)
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
      if (d === 0) { el.style.display = ""; el.style.visibility = ""; el.style.zIndex = 2; preparaFoto(el); }
      else if (d <= 2) {   // pagine vicine: presenti ma invisibili, così la foto è già pronta quando si sfoglia
        el.style.display = ""; el.style.visibility = "hidden"; el.style.zIndex = 0;
        preparaFoto(el);
      } else { el.style.display = "none"; el.style.visibility = ""; el.style.zIndex = ""; }
      el.classList.toggle("is-front", d === 0);
      el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    });
    countEl.textContent = (index + 1) + " / " + n;
    Array.prototype.forEach.call(dotsEl.children, function (dot, i) { dot.classList.toggle("active", i === index); });
  }

  /* --- SFOGLIO: la pagina intera gira sul dorso ---------------------------
     Fino al 25/09 la pagina veniva copiata dieci volte, tagliata in strisce
     che si piegavano una per una, e sopra due veli d'ombra venivano
     ridisegnati da capo a ogni fotogramma. Era bello, ma pesante: dieci foto
     da ridisegnare, e il telefono si inceppava per un decimo di secondo
     proprio quando la pagina cominciava a muoversi, lasciando vedere il
     marrone della carta fra le strisce.

     Adesso gira la pagina VERA, tutta intera, sul dorso. Niente copie: la
     foto è già disegnata e il telefono deve solo inclinarla. Le due ombre
     (quella sulla pagina che gira e quella che cade sulla pagina sotto)
     hanno un disegno fisso: a ogni fotogramma cambia solo quanto sono scure
     e dove arrivano, che è il lavoro più leggero che un telefono possa fare.
     ---------------------------------------------------------------------- */
  const FOLD_MS = 760;      // durata di uno sfoglio completo con tocco/frecce
  const FOLD_P = 1500;      // profondita' prospettica: deve combaciare con il CSS (.overlay.pages .deck)
  let flipping = false, flip = null;   // flip = { dir, top, under, target, p }
  let foldCard = null, veloEl = null, shadeEl = null, foldRaf = 0;

  function showPage(el, z) { el.style.display = ""; el.style.visibility = ""; el.style.opacity = ""; el.style.zIndex = z; }
  function lessMotion() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }

  function buildFold(card) {
    if (!shadeEl) {
      shadeEl = document.createElement("div"); shadeEl.className = "fold-shade";   // cade sulla pagina sotto
      veloEl = document.createElement("div"); veloEl.className = "fold-velo";      // scurisce la pagina che gira
    }
    // openCarousel svuota il contenitore delle carte: se serve la riattacco
    if (shadeEl.parentNode !== deckEl) deckEl.appendChild(shadeEl);
    foldCard = card;
    card.classList.add("turning");
    card.appendChild(veloEl);
    shadeEl.classList.add("on");
  }

  // p = 0 pagina distesa · p = 1 pagina di taglio (sparita).
  function renderFold(p) {
    if (!foldCard) return;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    if (flip) flip.p = p;
    const deg = -90 * p, rad = -deg * Math.PI / 180;     // rad: quanto si è alzata, da 0 a 90 gradi
    foldCard.style.transform = "rotateY(" + deg.toFixed(2) + "deg)";
    const face = Math.cos(rad);                           // 1 distesa · 0 di taglio
    veloEl.style.opacity = (1 - face).toFixed(3);         // alzandosi si allontana dalla luce
    // dove cade sullo schermo il bordo libero della pagina, con la prospettiva
    const W = deckEl.clientWidth || window.innerWidth || 1, cx = W / 2;
    const z = W * Math.sin(rad);                          // il bordo si alza verso di noi
    const bordo = cx + (W * face - cx) * (FOLD_P / (FOLD_P - z));
    const fin = Math.max(0, Math.min(W, bordo)) + W * 0.38;
    shadeEl.style.transform = "scaleX(" + (fin / W).toFixed(4) + ")";
    shadeEl.style.opacity = (Math.sin(Math.PI * p) * 0.95).toFixed(3);
  }
  function clearFold() {
    cancelAnimationFrame(foldRaf); foldRaf = 0;
    if (foldCard) { foldCard.classList.remove("turning"); foldCard.style.transform = ""; foldCard = null; }
    if (veloEl) { veloEl.style.opacity = "0"; if (veloEl.parentNode) veloEl.parentNode.removeChild(veloEl); }
    if (shadeEl) { shadeEl.classList.remove("on"); shadeEl.style.opacity = "0"; shadeEl.style.transform = ""; }
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
    buildFold(flip.top);                      // gira la pagina vera, niente copie
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
      if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); setTimeout(preparaFruscio, 0); }
      if (actx.state === "suspended") actx.resume();
    } catch (e) {}
  }

  /* --- IL FRUSCIO DELLA PAGINA -------------------------------------------
     Prima erano due soffi di rumore centrati su una nota sola: "pff-pff",
     finiti in 160 millisecondi, e suonavano finti. Una prima versione con
     tanti scricchiolii di carta è stata scartata: troppo crepitio.

     Adesso è un FRUSCIO: l'aria mossa dalla pagina, morbido e continuo,
     che si muove come l'aria vera. Parte scuro, si apre mentre la pagina
     accelera, si richiude quando rallenta e si posa; alla fine un piccolo
     tonfo, e dentro, appena percepibili, pochi scricchiolii di carta.

     Lo stesso algoritmo sta in un file di prova (fruscio.py) con cui sono
     stati fatti gli esempi da ascoltare: quello che si sente là è quello
     che suona qui.

     Il suono non si calcola mentre la pagina gira (sarebbe lavoro rubato
     all'animazione): se ne tengono pronti cinque, tutti un po' diversi, e
     quello appena usato si rifà nuovo a pagina ferma. */
  // lento: di quanto si stira il gesto · vol: volume medio · forma "onda": un solo rigonfiamento
  // che sale piano, si arrotonda in cima (colmo, da 0 a 1) e scende piano · picco: la forza nel
  // momento più forte (50 ms). La versione a folata ("morbido-ancora-piu-lento") spingeva troppo:
  // saliva al massimo in 100 ms e ci restava piatta per 350.
  const FRUSCI = {
    "morbido-ancora-piu-lento": { dur: 0.62, lpLo: 900, lpHi: 3800, aria: 0.10, stacco: 18, volo: 6, posa: 22, crep: 0.14, tonfo: 0.34, posaT: 0.46, riposa: 0.45, lento: 1.45, vol: 0.021 },
    "onda":                     { dur: 0.62, lpLo: 700, lpHi: 3000, aria: 0.05, stacco: 10, volo: 4, posa: 12, crep: 0.08, tonfo: 0.10, posaT: 0.50, riposa: 0,    lento: 1.45, forma: "onda", colmo: 0.40, picco: 0.021 },
    "onda-piu-delicata":        { dur: 0.62, lpLo: 600, lpHi: 2500, aria: 0.03, stacco: 6,  volo: 2, posa: 8,  crep: 0.05, tonfo: 0.06, posaT: 0.50, riposa: 0,    lento: 1.45, forma: "onda", colmo: 0.38, picco: 0.016 },
  };
  const FRUSCIO_SCELTO = "onda-piu-delicata";   // scelta del titolare, 25/09

  function liscia(a, b, x) { if (x <= a) return 0; if (x >= b) return 1; const t = (x - a) / (b - a); return t * t * (3 - 2 * t); }

  function onda(x, colmo) {   // 0 all'inizio e alla fine, 1 in cima, sempre morbida
    if (x <= 0 || x >= 1) return 0;
    if (x < colmo) { const s = Math.sin(Math.PI / 2 * x / colmo); return s * s; }
    const c = Math.cos(Math.PI / 2 * (x - colmo) / (1 - colmo)); return c * c;
  }

  function fruscio(sr, p) {
    const L = p.lento || 1, n = Math.floor(sr * p.dur * L), out = new Float32Array(n);
    let b0 = 0, b1 = 0, b2 = 0, hx = 0, hy = 0, l1 = 0, l2 = 0, ax = 0, ay = 0, ckx = 0, cky = 0, ckl = 0, e = 0, lp = 0;
    const aH = Math.exp(-2 * Math.PI * 350 / sr);                                                  // via il rimbombo
    const aA = Math.exp(-2 * Math.PI * 3000 / sr);                                                 // l'aria sottile in cima
    const aCk = Math.exp(-2 * Math.PI * 1500 / sr), bCk = 1 - Math.exp(-2 * Math.PI * 5000 / sr);   // i pochi scricchiolii
    const d = Math.exp(-1 / (sr * 0.0025));
    const aLp = 1 - Math.exp(-2 * Math.PI * 480 / sr), posa = p.posaT;                             // il tonfo
    for (let i = 0; i < n; i++) {
      const t = i / sr, u = t / L, w = Math.random() * 2 - 1;   // u: il tempo del gesto, stirato; il suono dentro resta lo stesso
      // la base: rumore rosa, più morbido del bianco
      b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913;
      const rosa = (b0 + b1 + b2 + w * 0.1848) * 0.18;
      hy = aH * (hy + rosa - hx); hx = rosa;
      // quanto va veloce la pagina: il fruscio si apre e si richiude con lei
      const vel = p.forma === "onda" ? onda(u / p.dur, p.colmo * 0.9)     // si schiarisce appena prima del colmo
                : liscia(0, 0.12, u) * (1 - liscia(posa * 0.55, posa + 0.05, u));
      const k = 1 - Math.exp(-2 * Math.PI * (p.lpLo + (p.lpHi - p.lpLo) * vel) / sr);
      l1 += k * (hy - l1); l2 += k * (l1 - l2);
      ay = aA * (ay + w - ax); ax = w;
      const env = p.forma === "onda" ? onda(u / p.dur, p.colmo)
                : liscia(0, 0.08, u) * (1 - liscia(0.28, p.dur * 0.96, u))
                  + p.riposa * liscia(posa - 0.06, posa, u) * (1 - liscia(posa, p.dur * 0.98, u));   // la pagina che si assesta
      const soffio = (l2 * 2.2 + ay * p.aria * vel) * env;
      // pochi scricchiolii, morbidi, allo stacco e alla posa
      const rate = p.stacco * liscia(0, 0.02, u) * (1 - liscia(0.08, 0.16, u))
                 + p.volo * liscia(0.06, 0.12, u) * (1 - liscia(posa - 0.06, posa, u))
                 + p.posa * liscia(posa - 0.05, posa, u) * (1 - liscia(posa + 0.04, posa + 0.11, u));
      if (Math.random() < rate / L / sr) e = Math.max(e, p.crep * (0.2 + 0.8 * Math.pow(Math.random(), 2)));
      const w2 = Math.random() * 2 - 1;
      cky = aCk * (cky + w2 - ckx); ckx = w2; ckl += bCk * (cky - ckl);
      const crep = ckl * e * 2.0; e *= d;
      // il tonfo della pagina che si posa
      lp += aLp * (w - lp);
      const tA = p.forma === "onda" ? 0.020 : 0.006, tD = p.forma === "onda" ? 0.090 : 0.05;   // nell'onda è una carezza, non un colpo
      const dt = t - posa * L, envT = dt < 0 ? 0 : Math.min(1, dt / tA) * Math.exp(-dt / tD);
      out[i] = soffio + crep + lp * envT * p.tonfo * 3.2;
    }
    // niente rimbombo, una saturazione morbida, e lo stesso volume del suono di prima
    const a = Math.exp(-2 * Math.PI * 150 / sr);
    let y = 0, x0 = 0, somma = 0, conta = 0;
    for (let i = 0; i < n; i++) {
      const x = out[i]; y = a * (y + x - x0); x0 = x;
      const v = Math.tanh(y * 1.3) / 1.3; out[i] = v;
      if (Math.abs(v) > 1e-4) { somma += v * v; conta++; }
    }
    let g;
    if (p.picco) {
      // l'onda si regola sul suo momento più forte, non sulla media: ha code lunghe e
      // quiete, e regolandola sulla media il colmo finirebbe per spingere di più
      const W = Math.floor(sr * 0.05); let forte = 0;
      for (let k = 0; k + W <= n; k += W >> 1) {
        let q = 0; for (let j = k; j < k + W; j++) q += out[j] * out[j];
        forte = Math.max(forte, Math.sqrt(q / W));
      }
      g = p.picco / (forte || 1e-9);
    } else g = (p.vol || 0.030) / (Math.sqrt(somma / Math.max(1, conta)) || 1e-9);
    for (let i = 0; i < n; i++) out[i] *= g;
    return out;
  }

  let frusci = [], fruscioUltimo = -1;
  function bufferFruscio() {
    const dati = fruscio(actx.sampleRate, FRUSCI[FRUSCIO_SCELTO]);
    const b = actx.createBuffer(1, dati.length, actx.sampleRate);
    b.getChannelData(0).set(dati);
    return b;
  }
  // Uno alla volta, e mai mentre una pagina sta girando: su un telefono ogni
  // fruscio costa qualche centesimo di secondo, che rubato all'animazione
  // rimetterebbe lo scatto appena tolto.
  function preparaFruscio() {
    if (!actx || frusci.length >= 5) return;
    if (flipping) { setTimeout(preparaFruscio, 300); return; }
    try { frusci.push(bufferFruscio()); } catch (e) { return; }
    setTimeout(preparaFruscio, 80);
  }
  function rifaiFruscio(k) {
    (function fai() {
      if (flipping) { setTimeout(fai, 300); return; }
      try { frusci[k] = bufferFruscio(); } catch (e) {}
    })();
  }
  function playFlip() {
    if (muted || !pageMode() || !actx || actx.state !== "running") return;
    try {
      if (!frusci.length) frusci.push(bufferFruscio());          // succede solo la primissima volta
      let k = Math.floor(Math.random() * frusci.length);
      if (k === fruscioUltimo && frusci.length > 1) k = (k + 1) % frusci.length;   // mai lo stesso due volte di fila
      fruscioUltimo = k;
      const src = actx.createBufferSource(); src.buffer = frusci[k];
      src.connect(actx.destination); src.start();
      setTimeout(function () { rifaiFruscio(k); }, 900);        // quello usato si rifà nuovo, a pagina ferma
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
    // Una pagina non deve MAI restare ferma a metà giro. Se mentre il dito la
    // sta girando arriva un clic da un'altra parte, prima il menu si
    // dimenticava del dito e la pagina restava inclinata: adesso la finisce,
    // avanti se era oltre metà, indietro se no.
    if (flip) { flipEnd(flip.dir > 0 ? flip.p > 0.5 : flip.p < 0.5, true); dragDir = 0; return; }
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
