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
    $("#zoom-hint").textContent = ZOOM_HINT[lang] || ZOOM_HINT.it;
    const skip = $("#intro-skip"); if (skip) skip.textContent = t("skipIntro");
    $("#hero-logo").alt = "Vico del Carmine";
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
    cards.forEach(function (el, i) {
      const d = offset(i), s = stateFor(d);
      if (Math.abs(d) > WINDOW) { el.style.display = "none"; el.classList.remove("is-front"); el.setAttribute("aria-hidden", "true"); return; }
      el.style.display = "";
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
    const desc = dishDesc(p);
    const descHtml = desc ? "<p>" + desc + "</p>" : "";
    const kick = p.speciale ? '<p class="kick spec-kick">✦ ' + t("specialtiesTitle") + " ✦</p>"
      : (p._sezione ? '<p class="kick">' + sezioneLabel(p._sezione) + "</p>" : "");
    card.innerHTML =
      '<div class="photo"><div class="fallback">' + (fallbackIcon || "🍽️") + "</div>" + price + "</div>" +
      '<div class="body">' + kick + "<h3>" + dishName(p) + "</h3>" + descHtml + '<span class="seal">♦</span></div>';
    if (p.image) {
      const img = new Image();
      img.alt = cleanName(p.nome); img.loading = "lazy";
      img.onload = function () { img.classList.add("loaded"); };
      img.onerror = function () { img.remove(); card.classList.add("no-photo"); };
      img.src = p.image;
      const photo = card.querySelector(".photo");
      photo.insertBefore(img, photo.querySelector(".fallback").nextSibling);
    }
    card.addEventListener("click", function () { if (card.classList.contains("is-front")) go(1); });
    return card;
  }
  function openCarousel(cat) {
    currentCat = cat;
    piatti = cat._prebuilt ? cat.piatti : piattiOf(cat); n = piatti.length; index = 0;
    const icon = iconFor(cat);
    titleEl.innerHTML = '<span class="ico">' + icon + "</span>" + catName(cat);

    deckEl.innerHTML = "";
    cards = piatti.map(function (p) { const el = buildCard(p, icon); deckEl.appendChild(el); return el; });

    dotsEl.innerHTML = "";
    piatti.forEach(function (_, i) {
      const b = document.createElement("button");
      b.className = "dot"; b.setAttribute("aria-label", String(i + 1));
      b.addEventListener("click", function () { index = i; position(false); armZoom(); });
      dotsEl.appendChild(b);
    });

    deckEl.classList.remove("touched");
    overlay.classList.add("open");
    updateScroll();

    cards.forEach(function (el) { el.style.transition = "none"; el.style.opacity = "0"; el.style.transform = DECK_START; });
    void deckEl.offsetWidth;
    cards.forEach(function (el) { el.style.transition = ""; });
    position(true);
    clearTimeout(staggerTimer);
    staggerTimer = setTimeout(function () { cards.forEach(function (el) { el.style.transitionDelay = "0ms"; }); }, n * 70 + 700);
    armZoom();
  }
  function closeCarousel() { clearZoomTimer(); exitZoom(); overlay.classList.remove("open"); updateScroll(); }
  function go(dir) { if (!n) return; index = (index + dir + n) % n; deckEl.classList.add("touched"); position(false); armZoom(); }

  /* --- VISTA A SCHERMO INTERO DEL PIATTO (auto-zoom dopo 2s di fermo, solo mobile) --- */
  const zoomEl = $("#zoom");
  let zoomTimer = null, zoomed = false;
  function zoomAllowed() { return !!(window.matchMedia && (window.matchMedia("(max-width: 640px)").matches || window.matchMedia("(pointer: coarse)").matches)); }
  function clearZoomTimer() { clearTimeout(zoomTimer); zoomTimer = null; }
  function armZoom() {
    clearZoomTimer();
    if (!overlay.classList.contains("open") || zoomed || !piatti.length || !zoomAllowed()) return;
    zoomTimer = setTimeout(enterZoom, 2000);
  }
  function enterZoom() {
    const p = piatti[index]; if (!p) return;
    zoomed = true;
    zoomEl.classList.toggle("special", !!p.speciale);
    const photo = zoomEl.querySelector(".zoom-photo");
    const oldImg = photo.querySelector("img"); if (oldImg) oldImg.remove();
    const ico = $("#zoom-ico");
    if (p.image) { const img = new Image(); img.alt = cleanName(p.nome); img.src = p.image; ico.style.display = "none"; photo.appendChild(img); }
    else { ico.style.display = ""; ico.textContent = currentCat ? iconFor(currentCat) : "🍽️"; }
    $("#zoom-kick").textContent = p.speciale ? ("✦ " + t("specialtiesTitle") + " ✦") : (p._sezione ? sezioneLabel(p._sezione) : "");
    $("#zoom-name").textContent = dishName(p);
    const pr = (p.prezzo != null && p.prezzo !== "") ? fmtPrice(p.prezzo) : "";
    $("#zoom-price").textContent = pr; $("#zoom-price").style.display = pr ? "" : "none";
    const d = dishDesc(p); $("#zoom-desc").textContent = d; $("#zoom-desc").style.display = d ? "" : "none";
    zoomEl.classList.add("open");
  }
  function exitZoom() { if (!zoomed) return; zoomed = false; zoomEl.classList.remove("open"); }
  function initZoom() {
    zoomEl.addEventListener("click", exitZoom);
    let zx = 0, zdrag = false;
    zoomEl.addEventListener("touchstart", function (e) { zx = e.touches[0].clientX; zdrag = true; }, { passive: true });
    zoomEl.addEventListener("touchmove", function (e) { if (zdrag && Math.abs(e.touches[0].clientX - zx) > 30) { exitZoom(); zdrag = false; } }, { passive: true });
    // disabilita il pinch-zoom del telefono (iOS) — reversibile in futuro
    ["gesturestart", "gesturechange", "gestureend"].forEach(function (ev) {
      document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
    });
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
      if (zoomed) { exitZoom(); return; }
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
  let sx = 0, sy = 0, dragging = false;
  function start(x, y) { sx = x; sy = y; dragging = true; clearZoomTimer(); }
  function end(x, y) {
    if (!dragging) return; dragging = false;
    const dx = x - sx, dy = y - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else armZoom();
  }
  deckEl.addEventListener("touchstart", function (e) { start(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  deckEl.addEventListener("touchend", function (e) { end(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });
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
    initZoom();

    // eventuali modifiche pubblicate (prezzi/foto) da Supabase
    try {
      const ov = await Store.getOverrides();
      overridesLoaded = true;   // caricamento riuscito (ov può essere null = nessuna modifica pubblicata)
      if (ov && typeof ov === "object") { overrides = migrateOverrides(ov); rebuildGrid(); }
    } catch (e) { /* Supabase non raggiungibile: menu di base, e l'editor bloccherà il salvataggio */ }
  });

  // Service worker: app installabile + offline
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
