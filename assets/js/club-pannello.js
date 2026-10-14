/* ============================================================================
   CLUB DEL VICO — il pannello del cliente
   Si scarica solo quando il cliente tocca 🎁 Club (vedi club.js).
   Due facce: l'iscrizione (chi non è ancora nel Club) e la tessera con i
   premi e il loro QR, da mostrare al titolare appena arrivati.
   ========================================================================== */
const ClubPannello = (function () {
  "use strict";
  const C = Club;
  const esc = C.esc;

  const TESTI = {
    it: {
      tit: "Club del Vico", sub: "Iscriviti gratis: è il nostro modo di dirti grazie.",
      allaProssima: "alla tua prossima visita", per: "per", persone: "persone", persona: "persona",
      compleanno: "Un regalo per il tuo compleanno", offerte: "Offerte riservate agli iscritti, al massimo una ogni 15 giorni",
      nome: "Nome", email: "Email", telefono: "Telefono", telefonoAiuto: "Se il numero non è italiano, scrivi il prefisso (es. +44)",
      nascita: "Data di nascita", nascitaAiuto: "Ci serve per farti un regalo al compleanno",
      privacy: "Ho letto l'", informativa: "informativa privacy", promo: "Voglio ricevere le offerte del Club (email e notifiche)",
      iscriviti: "Iscriviti e ricevi il premio", iscrivo: "Ti iscrivo…",
      e_nome: "Scrivi il tuo nome", e_email: "Controlla l'email: sembra sbagliata", e_telefono: "Controlla il numero di telefono",
      e_nascita: "Scrivi la tua data di nascita", e_privacy: "Per iscriverti serve la spunta sull'informativa privacy",
      e_gia: "Questa email o questo numero sono già nel Club. Hai cambiato telefono? Chiedi al titolare: con un QR ti fa ritrovare la tessera.",
      e_troppe: "Troppe iscrizioni da questo telefono: riprova domani", e_rete: "Connessione assente: riprova fra poco",
      benvenuto: "Sei nel Club", benvenutoSub: "Il tuo premio ti aspetta alla prossima visita: quando torni, mostra questo QR al titolare appena arrivi.",
      ciao: "Ciao", tessera: "La tua tessera del Club del Vico", offline: "Sei senza rete: questa è l'ultima copia della tessera. Il QR funziona lo stesso.",
      niente: "Nessun premio da usare adesso. Ti scriviamo noi quando arriva la prossima sorpresa.",
      validoStasera: "✅ Valido stasera", presto: "⏳ Dalla prossima visita", da: "da", domani: "domani",
      oggiNo: "😴 Stasera non vale", usatoIl: "Usato", scaduto: "Scaduto",
      dal: "Valido dal", al: "al", nonVale: "non vale di", e: "e",
      mostra: "Mostralo al titolare appena arrivi", tocca: "Tocca il QR per ingrandirlo", chiudiQR: "Tocca per chiudere",
      tipo_benvenuto: "Premio di benvenuto", tipo_compleanno: "Regalo di compleanno", tipo_promo: "Offerta del Club",
      compleannoTesto: "Per il tuo compleanno ti aspetta un regalo: lo troverai qui.",
      casaTit: "Tieni il menu sul telefono", casaSub: "Così ritrovi tessera e premi con un tocco, anche quando non sei al ristorante.",
      casaIos: "📲 Aggiungi alla schermata Home", casaAndroid: "📲 Installa l'app del menu",
      casaAltro: "Dal menu del browser (⋮) scegli «Aggiungi a schermata Home».",
      giaCasa: "✅ Hai il menu sulla schermata Home",
      usati: "Premi già usati", offerteSw: "Offerte del Club", offerteSi: "Riceverai le offerte (al massimo una ogni 15 giorni)",
      offerteNo: "Non ricevi offerte", esci: "Esci dal Club e cancella i miei dati",
      esciConferma: "Esci dal Club? I tuoi dati e i tuoi premi vengono cancellati subito e non si possono recuperare.",
      esciFatto: "Fatto: i tuoi dati sono stati cancellati.", menu: "Torna al menu", ritrovata: "Tessera ritrovata 🎉",
      riprova: "Riprova", attendi: "Un attimo…",
    },
    en: {
      tit: "Vico Club", sub: "Join for free: it's our way of saying thank you.",
      allaProssima: "on your next visit", per: "for", persone: "people", persona: "person",
      compleanno: "A gift for your birthday", offerte: "Members-only offers, at most one every 15 days",
      nome: "Name", email: "Email", telefono: "Phone", telefonoAiuto: "If it's not an Italian number, add the country code (e.g. +44)",
      nascita: "Date of birth", nascitaAiuto: "So we can give you a birthday gift",
      privacy: "I have read the ", informativa: "privacy notice", promo: "Send me the Club offers (email and notifications)",
      iscriviti: "Join and get your gift", iscrivo: "Joining…",
      e_nome: "Please write your name", e_email: "Please check your email address", e_telefono: "Please check your phone number",
      e_nascita: "Please enter your date of birth", e_privacy: "Please tick the privacy notice box to join",
      e_gia: "This email or phone number is already in the Club. New phone? Ask the owner: a QR code will bring your card back.",
      e_troppe: "Too many sign-ups from this phone: please try again tomorrow", e_rete: "No connection: please try again shortly",
      benvenuto: "You're in the Club", benvenutoSub: "Your gift is waiting for your next visit: when you come back, show this QR code to the owner as soon as you arrive.",
      ciao: "Hi", tessera: "Your Vico Club card", offline: "You're offline: this is the last saved copy of your card. The QR code still works.",
      niente: "No gifts to use right now. We'll let you know when the next surprise arrives.",
      validoStasera: "✅ Valid tonight", presto: "⏳ From your next visit", da: "from", domani: "tomorrow",
      oggiNo: "😴 Not valid tonight", usatoIl: "Used", scaduto: "Expired",
      dal: "Valid from", al: "to", nonVale: "not valid on", e: "and",
      mostra: "Show it to the owner as soon as you arrive", tocca: "Tap the QR code to enlarge it", chiudiQR: "Tap to close",
      tipo_benvenuto: "Welcome gift", tipo_compleanno: "Birthday gift", tipo_promo: "Club offer",
      compleannoTesto: "A gift is waiting for your birthday: you'll find it here.",
      casaTit: "Keep the menu on your phone", casaSub: "Your card and gifts one tap away, even when you're not at the restaurant.",
      casaIos: "📲 Add to Home Screen", casaAndroid: "📲 Install the menu app",
      casaAltro: "From the browser menu (⋮) choose “Add to Home screen”.",
      giaCasa: "✅ The menu is on your Home Screen",
      usati: "Gifts already used", offerteSw: "Club offers", offerteSi: "You'll get our offers (at most one every 15 days)",
      offerteNo: "You don't get offers", esci: "Leave the Club and delete my data",
      esciConferma: "Leave the Club? Your data and gifts are deleted right away and cannot be recovered.",
      esciFatto: "Done: your data has been deleted.", menu: "Back to the menu", ritrovata: "Card found 🎉",
      riprova: "Try again", attendi: "One moment…",
    },
  };
  function t(k) { return C.t(k, TESTI); }
  function persone(n) { return n + " " + t(n === 1 ? "persona" : "persone"); }

  /* --- date nella lingua del cliente: "ven 16 ott" / "Fri 16 Oct" --- */
  function locale() { return C.inItaliano() ? "it-IT" : "en-GB"; }
  function data(s, lungo) {
    const a = String(s).slice(0, 10).split("-").map(Number);
    const o = lungo ? { day: "numeric", month: "long", timeZone: "UTC" } : { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" };
    return new Intl.DateTimeFormat(locale(), o).format(new Date(Date.UTC(a[0], a[1] - 1, a[2])));
  }
  function nomeGiorno(n) {   // 0 = domenica (l'1 gennaio 2023 era domenica)
    return new Intl.DateTimeFormat(locale(), { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + n)));
  }
  function nonVale(g) {
    if (!g || !g.length) return "";
    const nomi = g.slice().sort().map(nomeGiorno);
    return t("nonVale") + " " + (nomi.length > 1 ? nomi.slice(0, -1).join(", ") + " " + t("e") + " " + nomi[nomi.length - 1] : nomi[0]);
  }

  /* ==========================================================================
     IL CONTENITORE
     ======================================================================== */
  let box = null, corpo = null;
  function crea() {
    box = document.createElement("div");
    box.className = "club-pannello";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Club del Vico");
    box.innerHTML = '<button type="button" class="club-chiudi" aria-label="Chiudi">✕</button>' +
      (C.DEMO ? '<div class="club-demo">DEMO · dati di prova</div>' : "") +
      '<div class="club-corpo"></div>';
    document.body.appendChild(box);
    corpo = box.querySelector(".club-corpo");
    box.querySelector(".club-chiudi").addEventListener("click", chiudi);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("aperto")) chiudi(); });
  }
  function apri(opz) {
    if (!box) crea();
    box.classList.add("aperto");
    document.documentElement.classList.add("club-aperto");
    box.scrollTop = 0;
    mostra(opz || {});
  }
  function chiudi() {
    chiudiQR();
    box.classList.remove("aperto");
    document.documentElement.classList.remove("club-aperto");
  }
  function attesa() { corpo.innerHTML = '<p class="club-attesa">' + esc(t("attendi")) + "</p>"; }

  async function mostra(opz) {
    if (!C.chiave()) { iscrizione(); return; }
    attesa();
    let p;
    try { p = await C.profilo(); }
    catch (e) {
      corpo.innerHTML = '<p class="club-attesa">' + esc(t("e_rete")) + '</p><button type="button" class="club-btn club-btn-vuoto club-riprova">' + esc(t("riprova")) + "</button>";
      corpo.querySelector(".club-riprova").addEventListener("click", function () { mostra(opz); });
      return;
    }
    if (!p) { iscrizione(); return; }    // tessera cancellata nel frattempo
    tessera(p, opz);
  }

  /* ==========================================================================
     ISCRIZIONE
     ======================================================================== */
  function oggiMeno(anni) {
    const s = C.sera();
    return (+s.slice(0, 4) - anni) + s.slice(4);
  }
  function campo(nome, tipo, etichetta, extra, aiuto) {
    return '<label class="club-campo"><span>' + esc(etichetta) + "</span>" +
      '<input name="' + nome + '" type="' + tipo + '" ' + (extra || "") + ">" +
      (aiuto ? "<small>" + esc(aiuto) + "</small>" : "") + "</label>";
  }
  async function iscrizione() {
    attesa();
    let info = null;
    try { info = await C.dati.info(); } catch (e) {}
    corpo.innerHTML =
      '<div class="club-testa"><div class="club-ico">🎁</div><h2>' + esc(t("tit")) + "</h2><p>" + esc(t("sub")) + "</p></div>" +
      '<ul class="club-vantaggi">' +
      (info ? "<li><span>" + esc(info.emoji) + "</span><div><b>" + esc(C.nomePremio(info.nome)) + "</b> " + esc(t("per")) + " " +
        persone(info.persone) + "<small>" + esc(t("allaProssima")) + "</small></div></li>" : "") +
      "<li><span>🎂</span><div>" + esc(t("compleanno")) + "</div></li>" +
      "<li><span>💌</span><div>" + esc(t("offerte")) + "</div></li></ul>" +
      '<form class="club-form" novalidate>' +
      campo("nome", "text", t("nome"), 'autocomplete="name" maxlength="60"') +
      campo("email", "email", t("email"), 'autocomplete="email" inputmode="email" maxlength="120" autocapitalize="off" spellcheck="false"') +
      campo("telefono", "tel", t("telefono"), 'autocomplete="tel" inputmode="tel" placeholder="+39 333 123 4567" maxlength="24"', t("telefonoAiuto")) +
      campo("nascita", "date", t("nascita"), 'max="' + oggiMeno(14) + '" min="' + oggiMeno(110) + '"', "🎂 " + t("nascitaAiuto")) +
      '<label class="club-check"><input type="checkbox" name="privacy"><span>' + esc(t("privacy")) +
      '<a href="#" class="club-apri-info">' + esc(t("informativa")) + "</a></span></label>" +
      '<label class="club-check"><input type="checkbox" name="promo"><span>' + esc(t("promo")) + "</span></label>" +
      '<p class="club-errore" hidden></p>' +
      '<button type="submit" class="club-btn club-btn-oro">' + esc(t("iscriviti")) + "</button></form>" +
      informativa();
    const form = corpo.querySelector("form");
    corpo.querySelector(".club-apri-info").addEventListener("click", function (e) {
      e.preventDefault();
      const d = corpo.querySelector(".club-informativa");
      d.open = true;
      d.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const f = form.elements;
      const d = { nome: f.nome.value.trim(), email: f.email.value.trim(), telefono: f.telefono.value.trim(),
        nascita: f.nascita.value, promo: f.promo.checked };
      const sbaglio = d.nome.length < 2 ? "nome"
        : !/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(d.email) ? "email"
        : d.telefono.replace(/\D/g, "").length < 8 ? "telefono"
        : !/^\d{4}-\d{2}-\d{2}$/.test(d.nascita) || d.nascita > oggiMeno(14) || d.nascita < oggiMeno(110) ? "nascita"
        : !f.privacy.checked ? "privacy" : null;
      if (sbaglio) { mostraErrore(form, sbaglio); return; }
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = t("iscrivo");
      try {
        const r = await C.dati.iscriviti(d);
        C.salvaTessera(r.chiave, r);
        benvenuto(r);
      } catch (er) {
        btn.disabled = false; btn.textContent = t("iscriviti");
        mostraErrore(form, er.codice, er.message);
      }
    });
  }
  function mostraErrore(form, codice, messaggio) {
    const p = form.querySelector(".club-errore");
    p.textContent = "⚠️ " + (TESTI.it["e_" + codice] ? t("e_" + codice) : (messaggio || t("e_rete")));
    p.hidden = false;
    const campo = form.elements[codice];
    if (campo && campo.focus) campo.focus();
    p.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function informativa() {
    if (C.inItaliano()) {
      return '<details class="club-informativa"><summary>Informativa privacy</summary>' +
        "<p><b>Chi raccoglie i dati:</b> il ristorante Vico del Carmine, Via Pisana 40/r, Firenze (titolare del trattamento). Per qualsiasi richiesta: vicodelcarmine1@gmail.com.</p>" +
        "<p><b>Quali dati:</b> nome, email, telefono, data di nascita e i premi che ricevi e usi.</p>" +
        "<p><b>Perché:</b> per gestire la tua tessera del Club e i tuoi premi (benvenuto e compleanno). Solo se metti la spunta sulle offerte, anche per mandarti le offerte del Club via email e notifica, al massimo una ogni 15 giorni. Non cediamo i dati a nessuno e non li usiamo per altro.</p>" +
        "<p><b>Dove:</b> su un database protetto (Supabase), usato solo dal ristorante.</p>" +
        "<p><b>Per quanto:</b> finché resti nel Club. Puoi uscire quando vuoi da questa pagina: i dati si cancellano subito.</p>" +
        "<p><b>I tuoi diritti:</b> puoi vedere, correggere o cancellare i tuoi dati e togliere il consenso alle offerte in ogni momento; puoi anche rivolgerti al Garante per la protezione dei dati personali.</p></details>";
    }
    return '<details class="club-informativa"><summary>Privacy notice</summary>' +
      "<p><b>Who collects the data:</b> Vico del Carmine restaurant, Via Pisana 40/r, Florence, Italy (data controller). For any request: vicodelcarmine1@gmail.com.</p>" +
      "<p><b>What data:</b> name, email, phone, date of birth and the gifts you receive and use.</p>" +
      "<p><b>Why:</b> to manage your Club card and gifts (welcome and birthday). Only if you tick the offers box, also to send you Club offers by email and notification, at most one every 15 days. We never share your data and never use it for anything else.</p>" +
      "<p><b>Where:</b> in a protected database (Supabase), used only by the restaurant.</p>" +
      "<p><b>How long:</b> as long as you stay in the Club. You can leave at any time from this page: your data is deleted right away.</p>" +
      "<p><b>Your rights:</b> you can see, correct or delete your data and withdraw consent to offers at any time; you can also contact the Italian Data Protection Authority (Garante).</p></details>";
  }

  /* ==========================================================================
     APPENA ISCRITTO
     ======================================================================== */
  function benvenuto(p) {
    const nome1 = String(p.nome || "").split(/\s+/)[0];
    const premi = p.premi.filter(function (x) { return !x.usato; });
    corpo.innerHTML =
      '<div class="club-testa club-festa"><div class="club-ico">🎉</div><h2>' + esc(t("benvenuto")) + ", " + esc(nome1) + "!</h2>" +
      "<p>" + esc(t("benvenutoSub")) + "</p></div>" +
      premi.map(schedaPremio).join("") +
      schedaCasa() +
      '<button type="button" class="club-btn club-btn-vuoto club-al-menu">' + esc(t("menu")) + "</button>";
    coriandoli();
    legaPremi();
    legaCasa();
    corpo.querySelector(".club-al-menu").addEventListener("click", chiudi);
  }

  /* ==========================================================================
     LA TESSERA
     ======================================================================== */
  function tessera(p, opz) {
    const nome1 = String(p.nome || "").split(/\s+/)[0];
    const aperti = p.premi.filter(function (x) { return x.stato !== "usato" && x.stato !== "scaduto"; });
    const chiusi = p.premi.filter(function (x) { return x.stato === "usato" || x.stato === "scaduto"; });
    corpo.innerHTML =
      '<div class="club-testa"><div class="club-ico">🎁</div><h2>' + esc(t("ciao")) + " " + esc(nome1) + " 👋</h2>" +
      "<p>" + esc(t("tessera")) + "</p></div>" +
      (p.offline ? '<p class="club-avviso">' + esc(t("offline")) + "</p>" : "") +
      (aperti.length ? aperti.map(schedaPremio).join("") : '<p class="club-niente">' + esc(t("niente")) + "</p>") +
      '<div class="club-scheda club-compleanno"><span>🎂</span><div><b>' + esc(data(p.nascita, true)) + "</b><br>" + esc(t("compleannoTesto")) + "</div></div>" +
      schedaCasa() +
      (chiusi.length ? '<div class="club-scheda"><h3>' + esc(t("usati")) + '</h3><ul class="club-usati">' + chiusi.map(function (x) {
        return "<li><span>" + esc(x.emoji) + "</span><div>" + esc(C.nomePremio(x.nome)) + "<small>" +
          (x.usato ? esc(t("usatoIl")) + " " + esc(data(C.sera(x.usato))) : esc(t("scaduto"))) + "</small></div></li>";
      }).join("") + "</ul></div>" : "") +
      '<div class="club-scheda"><label class="club-riga"><span><b>' + esc(t("offerteSw")) + '</b><small class="club-offerte-stato">' +
      esc(t(p.promo ? "offerteSi" : "offerteNo")) + '</small></span><span class="club-switch"><input type="checkbox" class="club-offerte"' +
      (p.promo ? " checked" : "") + "><i></i></span></label></div>" +
      informativa() +
      '<button type="button" class="club-esci">' + esc(t("esci")) + "</button>";
    legaPremi();
    legaCasa();
    const sw = corpo.querySelector(".club-offerte");
    sw.addEventListener("change", async function () {
      const si = sw.checked;
      try {
        const r = await C.dati.promo(C.chiave(), si);
        C.salvaTessera(C.chiave(), r);
        corpo.querySelector(".club-offerte-stato").textContent = t(si ? "offerteSi" : "offerteNo");
      } catch (e) { sw.checked = !si; alert(t("e_rete")); }
    });
    corpo.querySelector(".club-esci").addEventListener("click", async function () {
      if (!confirm(t("esciConferma"))) return;
      try {
        await C.dati.cancellami(C.chiave());
        C.dimenticaTessera();
        alert(t("esciFatto"));
        chiudi();
      } catch (e) { alert(t("e_rete")); }
    });
    if (opz && opz.ritrovata) { const h = corpo.querySelector(".club-testa p"); if (h) h.textContent = t("ritrovata"); }
  }

  function statoPremio(x) {
    if (x.stato === "valido") return t("validoStasera");
    if (x.stato === "presto") return t("presto") + " · " + (x.dal === C.piuGiorni(C.sera(), 1) ? t("domani") + ", " : t("da") + " ") + data(x.dal);
    if (x.stato === "oggi_no") return t("oggiNo") + " (" + nomeGiorno(C.giornoSettimana(C.sera())) + ")";
    if (x.stato === "usato") return t("usatoIl");
    return t("scaduto");
  }
  function schedaPremio(x) {
    const no = nonVale(x.giorniNo);
    return '<div class="club-premio st-' + esc(x.stato) + '">' +
      '<div class="club-premio-testa"><span class="club-premio-emo">' + esc(x.emoji) + "</span><div><b>" + esc(C.nomePremio(x.nome)) +
      "</b><small>" + esc(t("per")) + " " + persone(x.persone) + " · " + esc(t("tipo_" + x.tipo)) + "</small></div></div>" +
      '<div class="club-premio-stato">' + esc(statoPremio(x)) + "</div>" +
      '<button type="button" class="club-qr" data-codice="' + esc(x.codice) + '" aria-label="QR"></button>' +
      '<div class="club-codice">' + esc(x.codice.slice(0, 3) + " " + x.codice.slice(3)) + "</div>" +
      '<p class="club-premio-quando">' + esc(t("dal")) + " " + esc(data(x.dal)) + " " + esc(t("al")) + " " + esc(data(x.al)) +
      (no ? " · " + esc(no) : "") + "</p>" +
      '<p class="club-premio-come">' + esc(t("mostra")) + " · " + esc(t("tocca")) + "</p></div>";
  }
  function disegnaQR(testo) {
    const q = qrcode(0, "M");
    q.addData(testo);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }
  function legaPremi() {
    const tasti = corpo.querySelectorAll(".club-qr");
    if (!tasti.length) return;
    C.caricaQR().then(function () {
      tasti.forEach(function (b) {
        b.innerHTML = disegnaQR(C.urlPremio(b.dataset.codice));
        b.addEventListener("click", function () { qrGrande(b.dataset.codice, b.closest(".club-premio")); });
      });
    }).catch(function () {});
  }

  // il QR a tutto schermo, bianco, per la fotocamera del titolare
  let grande = null;
  function qrGrande(codice, scheda) {
    chiudiQR();
    grande = document.createElement("div");
    grande.className = "club-qr-pieno";
    grande.innerHTML = '<div class="club-qr-pieno-qr">' + disegnaQR(C.urlPremio(codice)) + "</div>" +
      "<p>" + scheda.querySelector(".club-premio-testa b").innerHTML + "</p>" +
      "<b>" + esc(codice.slice(0, 3) + " " + codice.slice(3)) + "</b>" +
      "<small>" + esc(t("mostra")) + "<br>" + esc(t("chiudiQR")) + "</small>";
    grande.addEventListener("click", chiudiQR);
    document.body.appendChild(grande);
  }
  function chiudiQR() { if (grande) { grande.remove(); grande = null; } }

  /* --- tenere il menu sulla schermata Home --- */
  function standalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  }
  function iPhone() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function schedaCasa() {
    if (standalone()) return '<p class="club-niente">' + esc(t("giaCasa")) + "</p>";
    const azione = iPhone()
      ? '<button type="button" class="club-btn club-btn-oro club-casa-ios">' + esc(t("casaIos")) + "</button>"
      : C.installa()
        ? '<button type="button" class="club-btn club-btn-oro club-casa-android">' + esc(t("casaAndroid")) + "</button>"
        : '<p class="club-casa-altro">' + esc(t("casaAltro")) + "</p>";
    return '<div class="club-scheda club-casa"><h3>' + esc(t("casaTit")) + "</h3><p>" + esc(t("casaSub")) + "</p>" + azione + "</div>";
  }
  function legaCasa() {
    // iPhone: l'icona sulla Home ha una memoria tutta sua, separata da Safari. Si aggiunge
    // da club.html?k=…: così l'icona porta con sé la tessera e la ritrova al primo avvio.
    const ios = corpo.querySelector(".club-casa-ios");
    if (ios) ios.addEventListener("click", function () { location.href = C.urlCasa(C.chiave()); });
    const and = corpo.querySelector(".club-casa-android");
    if (and) and.addEventListener("click", async function () {
      const ev = C.installa();
      if (!ev) return;
      try { await ev.prompt(); } catch (e) {}
      C.consumaInstalla();
      and.outerHTML = '<p class="club-casa-altro">' + esc(t("casaAltro")) + "</p>";
    });
  }

  function coriandoli() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.createElement("div");
    c.className = "club-coriandoli";
    const colori = ["#e6b24a", "#c8102e", "#edcf94", "#ffffff", "#86b64a"];
    for (let i = 0; i < 50; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colori[i % colori.length];
      p.style.animationDelay = Math.random() * 1.2 + "s";
      p.style.animationDuration = 2 + Math.random() * 2 + "s";
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(function () { c.remove(); }, 4500);
  }

  return { apri: apri, chiudi: chiudi };
})();
