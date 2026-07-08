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

  /* --- categorie che finiscono nel riquadro "Specialità" (non nella griglia) --- */
  const SPECIAL_SLUGS = ["specialita-stagione", "specialita-pizza"];
  /* --- schede mostrate quando si APRE il riquadro "Specialità" --- */
  const SPEC_PANEL_SLUGS = ["specialita-stagione", "antipasti", "primi", "secondi", "pizze", "specialita-pizza"];

  /* --- icona per categoria (i dati non hanno emoji) --- */
  const CAT_ICON = {
    "specialita-stagione": "⭐", "antipasti": "🥖", "primi": "🍝", "secondi": "🍖",
    "insalatone": "🥗", "contorni": "🍟", "pizze": "🍕", "specialita-pizza": "🔥",
    "dolci": "🍰", "birre": "🍺", "cocktail": "🍸", "bevande": "🥤", "vini": "🍷",
  };

  /* --- stato --- */
  let lang = "it";
  let currentCat = null;          // categoria aperta nel carosello (per ri-tradurre)
  let overrides = {};             // modifiche da Supabase: { "slug::nome": {prezzo, image} }

  const hasData = typeof MENU_DATA !== "undefined" && MENU_DATA;
  const categorie = (hasData && MENU_DATA.categorie) || [];
  const note = (hasData && MENU_DATA.note) || null;

  /* --- helper traduzioni / dati --- */
  function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.it[key] || ""; }
  function catName(cat) { const nn = cat.nome; if (typeof nn === "string") return nn; return (nn && (nn[lang] || nn.it)) || cat.slug; }
  function dishDesc(p) { const d = p.descrizione; if (!d) return ""; return d[lang] || d.it || ""; }
  function iconFor(cat) { return CAT_ICON[cat.slug] || "🍽️"; }

  function fmtPrice(n) {
    if (n === "" || n == null) return "";
    const num = typeof n === "number" ? n : parseFloat(String(n).replace(",", "."));
    if (isNaN(num)) return String(n);
    const s = Number.isInteger(num) ? String(num) : num.toFixed(2).replace(".", ",");
    return "€ " + s;
  }

  // Appiattisce i piatti; per i vini (sezioni) aggiunge _sezione = tipo
  function piattiOf(cat) {
    let list = [];
    if (Array.isArray(cat.piatti)) list = cat.piatti.map((p) => Object.assign({}, p));
    else if (Array.isArray(cat.sezioni)) {
      cat.sezioni.forEach((sez) => (sez.piatti || []).forEach((p) => {
        const c = Object.assign({}, p); c._sezione = sez.tipo; list.push(c);
      }));
    }
    // applica eventuali modifiche pubblicate (prezzi/foto)
    list.forEach((p) => {
      const ov = overrides[cat.slug + "::" + p.nome];
      if (ov) { if (ov.prezzo != null && ov.prezzo !== "") p.prezzo = ov.prezzo; if (ov.image) p.image = ov.image; }
    });
    return list;
  }
  function countOf(cat) { return piattiOf(cat).length; }
  function sezioneLabel(tipo) { const m = WINE_TYPES[tipo]; return (m && (m[lang] || m.it)) || tipo; }

  function gridCats() { return categorie.filter((c) => SPECIAL_SLUGS.indexOf(c.slug) === -1); }
  function specialCats() { return categorie.filter((c) => SPECIAL_SLUGS.indexOf(c.slug) !== -1); }
  function specPanelCats() { return SPEC_PANEL_SLUGS.map((s) => categorie.filter((c) => c.slug === s)[0]).filter(Boolean); }

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
    if (specOverlay.classList.contains("open")) buildSpecCards();
    if (overlay.classList.contains("open") && currentCat) openCarousel(currentCat);
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
    const specials = specPanelCats();
    if (!specials.length) return;
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

  /* --- Specialità: sotto-menu --- */
  function buildSpecCards() {
    const wrap = $("#spec-cards");
    wrap.innerHTML = "";
    specPanelCats().forEach(function (c, i) {
      const card = document.createElement("button");
      card.className = "spec-card";
      card.style.animationDelay = i * 130 + "ms";
      card.innerHTML =
        '<span class="shine"></span>' +
        '<span class="spec-ico">' + iconFor(c) + "</span>" +
        '<span class="spec-name">' + catName(c) + "</span>" +
        '<span class="spec-count">' + countOf(c) + " " + t("options") + "</span>" +
        '<span class="spec-go">' + t("discover") + "</span>";
      card.addEventListener("click", function () { openCarousel(c); });
      wrap.appendChild(card);
    });
  }
  function openSpecialita() { buildSpecCards(); specOverlay.classList.add("open"); updateScroll(); }
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
    card.className = "card" + (p.image ? "" : " no-photo");
    const price = (p.prezzo != null && p.prezzo !== "") ? '<span class="price">' + fmtPrice(p.prezzo) + "</span>" : "";
    const desc = dishDesc(p);
    const descHtml = desc ? "<p>" + desc + "</p>" : "";
    const kick = p._sezione ? '<p class="kick">' + sezioneLabel(p._sezione) + "</p>" : "";
    card.innerHTML =
      '<div class="photo"><div class="fallback">' + (fallbackIcon || "🍽️") + "</div>" + price + "</div>" +
      '<div class="body">' + kick + "<h3>" + p.nome + "</h3>" + descHtml + '<span class="seal">♦</span></div>';
    if (p.image) {
      const img = new Image();
      img.alt = p.nome; img.loading = "lazy";
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
    piatti = piattiOf(cat); n = piatti.length; index = 0;
    const icon = iconFor(cat);
    titleEl.innerHTML = '<span class="ico">' + icon + "</span>" + catName(cat);

    deckEl.innerHTML = "";
    cards = piatti.map(function (p) { const el = buildCard(p, icon); deckEl.appendChild(el); return el; });

    dotsEl.innerHTML = "";
    piatti.forEach(function (_, i) {
      const b = document.createElement("button");
      b.className = "dot"; b.setAttribute("aria-label", String(i + 1));
      b.addEventListener("click", function () { index = i; position(false); });
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
  }
  function closeCarousel() { overlay.classList.remove("open"); updateScroll(); }
  function go(dir) { if (!n) return; index = (index + dir + n) % n; deckEl.classList.add("touched"); position(false); }

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
  let sx = 0, sy = 0, dragging = false;
  function start(x, y) { sx = x; sy = y; dragging = true; }
  function end(x, y) {
    if (!dragging) return; dragging = false;
    const dx = x - sx, dy = y - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
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
      '<input type="password" class="field" id="pw-input" inputmode="text" placeholder="Password" autocomplete="off">' +
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
      '<p class="me-kick">⭐ Modifica prezzi & foto</p>' +
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
    categorie.forEach(function (cat) {
      const sec = document.createElement("section"); sec.className = "cat-edit me-page"; sec.dataset.slug = cat.slug;
      const list = document.createElement("div"); list.className = "dish-list";
      piattiOf(cat).forEach(function (p) {
        const row = document.createElement("div"); row.className = "dish-edit";
        row.dataset.nome = p.nome;
        row.innerHTML =
          '<p class="de-name">' + p.nome + "</p>" +
          '<div class="de-line"><span class="de-lab">€</span>' +
          '<input class="field de-prezzo" inputmode="decimal" placeholder="—">' +
          '<button type="button" class="de-foto"><span class="de-foto-txt">📷 Foto</span></button></div>' +
          '<input type="hidden" class="de-fotoval">';
        row.querySelector(".de-prezzo").value = (p.prezzo != null ? p.prezzo : "");
        const fv = row.querySelector(".de-fotoval"); fv.value = p.image || "";
        const fb = row.querySelector(".de-foto");
        function refresh() { fb.innerHTML = fv.value ? '<img src="' + fv.value + '" alt=""><span class="de-foto-txt">Cambia</span>' : '<span class="de-foto-txt">📷 Foto</span>'; }
        refresh();
        fb.addEventListener("click", function () { pickPhoto(function (url) { fv.value = url; refresh(); }); });
        list.appendChild(row);
      });
      sec.appendChild(list); pager.appendChild(sec);
      pages.push({ el: sec, nome: iconFor(cat) + " " + catName(cat) });
    });
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
    $("#me-save").addEventListener("click", saveEditor);
    editOverlay.classList.add("open"); editOverlay.scrollTop = 0; updateScroll();
  }

  async function saveEditor() {
    const next = {};
    editInner.querySelectorAll(".cat-edit").forEach(function (sec) {
      const slug = sec.dataset.slug;
      sec.querySelectorAll(".dish-edit").forEach(function (row) {
        const nome = row.dataset.nome;
        const prezzo = row.querySelector(".de-prezzo").value.trim();
        const image = row.querySelector(".de-fotoval").value.trim();
        if (prezzo !== "" || image !== "") next[slug + "::" + nome] = { prezzo: prezzo, image: image };
      });
    });
    const btn = $("#me-save"); btn.disabled = true; $("#me-msg").textContent = "Pubblico...";
    try {
      const ok = await Store.saveOverrides(next, editorPwd);
      if (ok) { overrides = next; rebuildGrid(); closeEditor(); showToast("✅ Menu aggiornato"); }
      else { $("#me-msg").textContent = "Serve la password del titolare."; btn.disabled = false; }
    } catch (e) { $("#me-msg").textContent = "Supabase non ancora collegato."; btn.disabled = false; }
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

    // eventuali modifiche pubblicate (prezzi/foto) da Supabase
    try {
      const ov = await Store.getOverrides();
      if (ov && typeof ov === "object") { overrides = ov; rebuildGrid(); }
    } catch (e) { /* Supabase non collegato: si usa il menu di base */ }
  });

  // Service worker: app installabile + offline
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
