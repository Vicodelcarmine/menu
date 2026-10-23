/* ============================================================================
   PRE-ORDINE AL TAVOLO — lato cliente
   ----------------------------------------------------------------------------
   Pezzo staccato: si aggancia al menu dall'esterno e nel motore tocca UNA riga
   sola (dentro buildCard). Così lo stesso file funziona anche sul motore del
   campionario, e i due non divergono.

   REGOLA DEL TAVOLO — voluta dal titolare:
   si ordina SOLO se l'indirizzo porta il numero del tavolo (?t=12&k=8f3a).
   Senza quel numero il menu si legge come sempre, ma il pulsante non esiste.
   Così i QR vecchi già sui tavoli restano validi come semplice menu, e da fuori
   nessuno può ordinare per un tavolo che non è il suo.
   ========================================================================== */
const Ordina = (function () {
  "use strict";

  const $ = function (s) { return document.querySelector(s); };

  /* --- testi: italiano e inglese, le altre lingue ricadono sull'italiano --- */
  const TESTI = {
    it: {
      aggiungi: "Aggiungi", aggiunto: "Aggiunto", ordine: "Il tuo ordine",
      vedi: "Vedi l'ordine", piatti: "piatti", piatto: "piatto",
      coperti: "Quante persone siete?", copertiAiuto: "Serve al cameriere per portare pane, acqua e coperti",
      nota: "Nota per la cucina (facoltativa)", notaEs: "es. senza cipolla, ben cotta",
      manda: "Manda l'ordine", mando: "Mando…", svuota: "Svuota",
      tavolo: "Tavolo", vuoto: "Non hai ancora scelto niente",
      inviato: "Ordine inviato", inviatoSub: "Un cameriere arriva a confermarlo",
      visto: "Il cameriere l'ha visto", vistoSub: "Sta arrivando al tavolo",
      confermato: "Ordine confermato", confermatoSub: "È in preparazione",
      chiama: "Chiama il cameriere", chiamato: "Ho avvisato il cameriere",
      nuovo: "Ordina altro", chiudi: "Chiudi",
      inCorso: "Ordine in corso", tocca: "tocca per vedere",
      no_ORDINI_SPENTI:      "L'ordine dal telefono non è attivo in questo momento",
      no_FUORI_ORARIO:       "Adesso siamo fuori dall'orario per ordinare",
      no_TAVOLO_SCONOSCIUTO: "Questo tavolo non risulta: chiama il cameriere",
      no_TAVOLO_BLOCCATO:    "Da questo tavolo non si può ordinare: chiama il cameriere",
      no_TAVOLO_CHIUSO:      "Il tavolo non è ancora aperto: chiama il cameriere",
      no_TROPPI_ORDINI:      "Troppi ordini da questo tavolo: chiama il cameriere",
      no_ALTRO:              "Non sono riuscito a mandare l'ordine. Riprova o chiama il cameriere",
      nonAttivo: "L'ordine dal telefono non è attivo in questo momento",
      altro: "Altro", portata: "Portata", portataN: "ª portata",
      spostaUno: "Tocca un numero: ne sposta una sola",
      sequenza: "Il numero dice quando lo vuoi: 1 arriva per primo. Si cambia con un tocco, piatto per piatto.",
      // asporto
      asporto: "Asporto", asportoTitolo: "Il tuo ordine da asporto",
      aspBanner: "🛍️ Asporto · scegli i piatti e passa a ritirare stasera",
      aspChiuso: "🛍️ Stasera l'asporto è chiuso: il menu si può solo sfogliare",
      ritiro: "A che ora passi a ritirare?", ritiroAiuto: "Stasera · paghi al ritiro, alla cassa",
      pieno: "pieno", dati: "I tuoi dati", socio: "Ordini come {nome}.", nonSeiTu: "Non sei tu?",
      nome: "Nome e cognome", telefono: "Telefono", email: "Email",
      nascita: "Data di nascita", nascitaPerche: "per il regalo di compleanno",
      privacy: "Ho letto l'informativa privacy", privacyTitolo: "Informativa privacy",
      privacyTesto: "<p><b>Chi raccoglie i dati:</b> il ristorante Vico del Carmine, Via Pisana 40/r, Firenze (titolare del trattamento). Per qualsiasi richiesta: vicodelcarmine1@gmail.com.</p><p><b>Quali dati:</b> nome, email, telefono, data di nascita, i tuoi ordini e i premi del Club.</p><p><b>Perché:</b> per preparare il tuo ordine e gestire la tua tessera del Club del Vico, in cui entri ordinando (premio di benvenuto e regalo di compleanno). Solo se metti la spunta sulle offerte, anche per mandarti le offerte del Club, al massimo una ogni 15 giorni. Non cediamo i dati a nessuno.</p><p><b>Dove e per quanto:</b> su un database protetto (Supabase), finché resti nel Club. Puoi uscire quando vuoi dalla tua tessera.</p><p><b>I tuoi diritti:</b> puoi vedere, correggere o cancellare i tuoi dati in ogni momento; puoi anche rivolgerti al Garante per la protezione dei dati personali.</p>",
      promo: "Voglio ricevere le offerte del Club (email e notifiche)",
      club: "Ordinando entri nel Club del Vico, con il premio di benvenuto e il regalo di compleanno.",
      notaOrdine: "Nota per l'ordine (facoltativa)", notaOrdineEs: "es. citofono, posate, tagliata a spicchi",
      mandaAsp: "Manda l'ordine", pagaRitiro: "Paghi al ritiro",
      asp_ricevuto: "Ordine ricevuto", asp_ricevutoSub: "La cucina lo sta guardando",
      asp_preparazione: "In preparazione", asp_preparazioneSub: "Lo stiamo preparando",
      asp_pronto: "Pronto da ritirare!", asp_prontoSub: "Ti aspettiamo al banco",
      asp_ritirato: "Ritirato. Buon appetito!", asp_annullato: "Ordine annullato",
      codice: "Il tuo codice da dire al banco", ritiroAlle: "Ritiro stasera alle {ora}",
      annullaOrdine: "Annulla l'ordine", annullaChiedi: "Annullo l'ordine?",
      e_rete: "Connessione assente: riprova tra poco.", e_server: "Qualcosa non ha funzionato: riprova o chiamaci.",
      e_nome: "Scrivi nome e cognome.", e_telefono: "Scrivi un numero di telefono valido.",
      e_email: "Scrivi un'email valida.", e_nascita: "Scrivi la tua data di nascita.",
      e_privacy: "Per ordinare serve la spunta sull'informativa privacy.",
      e_ritiro: "Scegli a che ora passi a ritirare.", e_pieno: "A quell'ora la cucina è piena: scegli un altro orario.",
      e_tardi: "A quell'ora non facciamo più in tempo: scegli un orario più tardi.",
      e_chiuso: "Stasera l'asporto è chiuso.", e_grande: "Per un ordine così grande chiamaci.",
      e_troppi: "Troppi ordini: chiamaci.", e_tanti: "Hai già 2 ordini in corso stasera: chiamaci.",
      e_gia: "Questa email o questo numero sono già nel Club con altri dati: scrivili come quando ti sei iscritto.",
      e_vuoto: "Il carrello è vuoto.", e_stato: "È già in preparazione: chiamaci per cambiarlo.",
    },
    en: {
      aggiungi: "Add", aggiunto: "Added", ordine: "Your order",
      vedi: "See your order", piatti: "items", piatto: "item",
      coperti: "How many of you are there?", copertiAiuto: "The waiter needs it for bread, water and covers",
      nota: "Note for the kitchen (optional)", notaEs: "e.g. no onion, well done",
      manda: "Send the order", mando: "Sending…", svuota: "Empty",
      tavolo: "Table", vuoto: "You haven't chosen anything yet",
      inviato: "Order sent", inviatoSub: "A waiter is coming to confirm it",
      visto: "The waiter has seen it", vistoSub: "He is on his way",
      confermato: "Order confirmed", confermatoSub: "It's being prepared",
      chiama: "Call the waiter", chiamato: "The waiter has been called",
      nuovo: "Order more", chiudi: "Close",
      inCorso: "Order in progress", tocca: "tap to see",
      no_ORDINI_SPENTI:      "Ordering from your phone is not available right now",
      no_FUORI_ORARIO:       "We are outside ordering hours",
      no_TAVOLO_SCONOSCIUTO: "This table is not recognised: please call the waiter",
      no_TAVOLO_BLOCCATO:    "Ordering from this table is not allowed: please call the waiter",
      no_TAVOLO_CHIUSO:      "The table is not open yet: please call the waiter",
      no_TROPPI_ORDINI:      "Too many orders from this table: please call the waiter",
      no_ALTRO:              "I could not send the order. Try again or call the waiter",
      nonAttivo: "Ordering from your phone is not available right now",
      altro: "Other", portata: "Course", portataN: " course",
      spostaUno: "Tap a number: it moves one portion only",
      sequenza: "The number says when you want it: 1 comes first. One tap to change it, dish by dish.",
      // takeaway
      asporto: "Takeaway", asportoTitolo: "Your takeaway order",
      aspBanner: "🛍️ Takeaway · pick your dishes and collect them tonight",
      aspChiuso: "🛍️ Takeaway is closed tonight: you can still browse the menu",
      ritiro: "What time will you collect it?", ritiroAiuto: "Tonight · you pay when you collect",
      pieno: "full", dati: "Your details", socio: "Ordering as {nome}.", nonSeiTu: "Not you?",
      nome: "First and last name", telefono: "Phone", email: "Email",
      nascita: "Date of birth", nascitaPerche: "for your birthday gift",
      privacy: "I have read the privacy notice", privacyTitolo: "Privacy notice",
      privacyTesto: "<p><b>Who collects the data:</b> Vico del Carmine restaurant, Via Pisana 40/r, Florence, Italy (data controller). For any request: vicodelcarmine1@gmail.com.</p><p><b>What data:</b> name, email, phone, date of birth, your orders and your Club gifts.</p><p><b>Why:</b> to prepare your order and manage your Vico Club card, which you join by ordering (welcome gift and birthday gift). Only if you tick the offers box, also to send you Club offers, at most one every 15 days. We never share your data.</p><p><b>Where and how long:</b> in a protected database (Supabase), as long as you stay in the Club. You can leave at any time from your card.</p><p><b>Your rights:</b> you can see, correct or delete your data at any time; you can also contact the Italian Data Protection Authority (Garante).</p>",
      promo: "Send me the Club offers (email and notifications)",
      club: "Ordering makes you a member of the Vico Club, with a welcome gift and a birthday gift.",
      notaOrdine: "Note for the order (optional)", notaOrdineEs: "e.g. cutlery, sliced pizza",
      mandaAsp: "Send the order", pagaRitiro: "Pay when you collect",
      asp_ricevuto: "Order received", asp_ricevutoSub: "The kitchen is looking at it",
      asp_preparazione: "Being prepared", asp_preparazioneSub: "We are making it now",
      asp_pronto: "Ready to collect!", asp_prontoSub: "See you at the counter",
      asp_ritirato: "Collected. Enjoy!", asp_annullato: "Order cancelled",
      codice: "Your code for the counter", ritiroAlle: "Collect tonight at {ora}",
      annullaOrdine: "Cancel the order", annullaChiedi: "Cancel the order?",
      e_rete: "No connection: try again shortly.", e_server: "Something went wrong: try again or call us.",
      e_nome: "Please enter your first and last name.", e_telefono: "Please enter a valid phone number.",
      e_email: "Please enter a valid email.", e_nascita: "Please enter your date of birth.",
      e_privacy: "Please tick the privacy notice box to order.",
      e_ritiro: "Choose when you will collect it.", e_pieno: "The kitchen is full at that time: please choose another.",
      e_tardi: "We can't make it by then: please choose a later time.",
      e_chiuso: "Takeaway is closed tonight.", e_grande: "For such a large order please call us.",
      e_troppi: "Too many orders: please call us.", e_tanti: "You already have 2 orders in progress tonight: please call us.",
      e_gia: "This email or number is already in the Club with different details: type them as when you joined.",
      e_vuoto: "Your cart is empty.", e_stato: "It's already being prepared: call us to change it.",
    },
  };
  function t(k) {
    const l = document.documentElement.lang || "it";
    return (TESTI[l] && TESTI[l][k]) || TESTI.it[k];
  }

  /* --------------------------------------------------------------------------
     INDICE DELLE PORTATE
     A ogni piatto associamo la sua categoria del menu (Antipasti, Primi,
     Secondi, Pizze, Dolci…) e l'ordine in cui compare. Serve perché il cliente
     ordina tutto insieme, "a getto", ma poi cucina e cameriere hanno bisogno di
     sapere COSA VIENE PRIMA. Si costruisce dai dati del menu: nessuna modifica
     al motore.
     ------------------------------------------------------------------------ */
  const INDICE = {};
  function costruisciIndice() {
    if (typeof MENU_DATA === "undefined" || !MENU_DATA.categorie) return;
    MENU_DATA.categorie.forEach(function (c, i) {
      const nome = (c.nome && (c.nome.it || c.nome)) || c.slug || "";
      const metti = function (p) { if (p && p.id) INDICE[p.id] = { portata: nome, slug: c.slug || "", ordine: i }; };
      (c.piatti || []).forEach(metti);
      (c.sezioni || []).forEach(function (sez) { (sez.piatti || []).forEach(metti); });
    });
  }
  function categoriaDi(id) { return (INDICE[id] && INDICE[id].portata) || t("altro"); }
  function slugDi(id) { return (INDICE[id] && INDICE[id].slug) || ""; }

  /* Il numero di partenza lo indoviniamo dalla categoria, così chi non ci pensa
     manda comunque un ordine sensato. Ma resta un suggerimento: la portata la
     decide chi mangia, non il menu — due commensali possono volere lo stesso
     antipasto in momenti diversi. Si cambia con un tocco, riga per riga. */
  const PORTATA_DI_SERIE = {
    birre: 1, cocktail: 1, bevande: 1, vini: 1, aperitivi: 1,
    antipasti: 1, sfizi: 1, fritti: 1,
    primi: 2, pizze: 2, insalatone: 2, panini: 2,
    secondi: 3, contorni: 3, griglia: 3,
    dolci: 4, dessert: 4, caffe: 4,
  };
  const MAX_PORTATE = 4;
  function portataDiSerie(id) {
    const sl = slugDi(id);
    for (const k in PORTATA_DI_SERIE) if (sl.indexOf(k) !== -1) return PORTATA_DI_SERIE[k];
    return 1;
  }

  /* --- stato --- */
  let tavolo = null, chiave = null;
  // ASPORTO: il menu aperto dal sito con ?asporto=1. Stesso carrello, niente tavolo:
  // ora di ritiro di stasera e dati del Club; si paga al ritiro.
  let asporto = false;
  let aspInfo = null;           // { attive, aperto, orari:[{ora, liberi}], nonContano }
  const aspDati = { ritiro: null, nome: "", telefono: "", email: "", nascita: "", privacy: false, promo: false, nota: "" };
  let servizio = { attivo: false, aperto: true, messaggio: "" };
  let carrello = [];            // { id, nome, prezzo, qta, nota }
  let ordineId = null;          // ordine in corso
  let timerStato = null, daQuando = 0, statoCorrente = null, timerFine = null;

  const MEM = "vdc_carrello";
  const MEM_ORD = "vdc_ordine_in_corso";
  const MEM_ASP = "vdc_carrello_asporto";      // l'asporto ha il suo carrello…
  const MEM_ASP_ORD = "vdc_asporto_ordine";    // …e il suo ordine, che resta anche chiudendo il browser
  const ATTESA_CHIAMATA = 4 * 60 * 1000;   // dopo 4 minuti compare "chiama il cameriere"

  function ricorda() {
    try {
      sessionStorage.setItem(asporto ? MEM_ASP : MEM, JSON.stringify({ righe: carrello }));
      const dove = asporto ? localStorage : sessionStorage, k = asporto ? MEM_ASP_ORD : MEM_ORD;
      if (ordineId) dove.setItem(k, ordineId); else dove.removeItem(k);
    } catch (e) {}
  }
  function ripesca() {
    try {
      const m = JSON.parse(sessionStorage.getItem(asporto ? MEM_ASP : MEM) || "{}");
      carrello = m.righe || [];
      ordineId = (asporto ? localStorage.getItem(MEM_ASP_ORD) : sessionStorage.getItem(MEM_ORD)) || null;
    } catch (e) { carrello = []; ordineId = null; }
  }

  // le portate presenti nel carrello, nell'ordine del menu; chi c'era già resta
  // dov'era, perché il cliente potrebbe averlo spostato a mano
  // Le righe partono in ordine di portata; a parità, nell'ordine in cui sono
  // state scelte. È così che le leggerà il cameriere.
  function righeOrdinate() {
    return carrello.map(function (r, i) { return { r: r, i: i }; })
      .sort(function (a, b) { return ((a.r.portata || 1) - (b.r.portata || 1)) || (a.i - b.i); })
      .map(function (x) { return x.r; });
  }
  function portateUsate() {
    const n = [];
    carrello.forEach(function (r) { if (n.indexOf(r.portata) === -1) n.push(r.portata); });
    return n.sort(function (a, b) { return a - b; });
  }

  function prezzoTesto(n) {
    if (n === "" || n == null) return "";
    const num = typeof n === "number" ? n : parseFloat(String(n).replace(",", "."));
    if (isNaN(num)) return String(n);
    return "€ " + (Number.isInteger(num) ? String(num) : num.toFixed(2).replace(".", ","));
  }
  function totale() {
    return carrello.reduce(function (s, r) {
      const p = typeof r.prezzo === "number" ? r.prezzo : parseFloat(String(r.prezzo).replace(",", "."));
      return s + (isNaN(p) ? 0 : p) * r.qta;
    }, 0);
  }
  function pezzi() { return carrello.reduce(function (s, r) { return s + r.qta; }, 0); }

  /* --- il tavolo arriva dall'indirizzo, e senza tavolo non si ordina --- */
  function leggiIndirizzo() {
    const q = new URLSearchParams(location.search);
    const n = (q.get("t") || q.get("tavolo") || "").trim();
    tavolo = /^[A-Za-z0-9-]{1,8}$/.test(n) ? n : null;
    chiave = (q.get("k") || "").trim() || null;
    asporto = !tavolo && q.get("asporto") === "1";
  }
  function puoOrdinare() {
    // in asporto serve anche almeno un orario di ritiro ancora possibile stasera
    if (asporto) return !!(aspInfo && aspInfo.attive && aspInfo.aperto && aspInfo.orari && aspInfo.orari.length);
    return !!(tavolo && servizio.attivo && servizio.aperto);
  }

  function aggiornaCorpo() {
    // Il totale si nasconde da CSS, non togliendo i numeri: il conto continua
    // a essere calcolato e mandato al banco, semplicemente il cliente non lo vede.
    document.body.classList.toggle("ord-senza-totale", servizio.mostraTotale === false);
    document.body.classList.toggle("puo-ordinare", puoOrdinare());
    // un ordine da asporto già mandato si segue anche se intanto l'asporto ha chiuso
    const conOrdine = asporto ? !!ordineId : (puoOrdinare() && !!ordineId);
    document.body.classList.toggle("ha-carrello", (puoOrdinare() && carrello.length > 0) || conOrdine);
    if (asporto) bannerAsporto();
  }

  /* ==========================================================================
     IL PULSANTE SULLA CARTA DEL PIATTO
     Il motore lo chiama per ogni piatto che costruisce.
     ======================================================================== */
  function decora(card, p) {
    if (!p || p.ordinabile === false) return;      // piatto escluso dal titolare
    const corpo = card.querySelector(".body");
    if (!corpo || corpo.querySelector(".ord-add")) return;

    const b = document.createElement("button");
    b.type = "button";
    b.className = "ord-add";
    b.innerHTML = '<span class="ord-piu">+</span><span class="ord-testo">' + t("aggiungi") + "</span>";

    // il tocco sul pulsante NON deve far girare pagina né trascinare il mazzo
    ["touchstart", "touchend", "mousedown", "mouseup", "pointerdown"].forEach(function (ev) {
      b.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });
    b.addEventListener("click", function (e) {
      e.stopPropagation(); e.preventDefault();
      aggiungi(p);
      b.classList.remove("fatto"); void b.offsetWidth; b.classList.add("fatto");
      b.querySelector(".ord-testo").textContent = t("aggiunto");
      setTimeout(function () { b.querySelector(".ord-testo").textContent = t("aggiungi"); }, 1200);
    });
    corpo.appendChild(b);
  }

  function aggiungi(p) {
    const id = p.id || ("x" + (p.nome || "").replace(/\s+/g, "-").toLowerCase());
    const nome = String(p.nome || "").replace(/^[\s]*[⭐★✦✧☆*]+[\s]*/, "").trim();
    const dove = portataDiSerie(id);
    const riga = carrello.filter(function (r) { return r.id === id && r.portata === dove && !r.nota; })[0];
    if (riga) riga.qta += 1;
    else carrello.push({ id: id, nome: nome, prezzo: p.prezzo, qta: 1, nota: "",
                        portata: dove, categoria: categoriaDi(id), slug: slugDi(id) });
    ricorda(); aggiornaCorpo(); disegnaBarra();
  }
  // Attenzione: si lavora sulla RIGA, non sul piatto. Lo stesso piatto può
  // stare su più righe, in portate diverse — due commensali possono volere la
  // stessa margherita, uno come antipasto e uno dopo l'insalatona.
  function togli(riga) {
    riga.qta -= 1;
    if (riga.qta <= 0) carrello = carrello.filter(function (r) { return r !== riga; });
    ricorda(); aggiornaCorpo(); disegnaBarra(); disegnaFoglio();
  }

  function gemella(riga, n) {
    return carrello.filter(function (x) {
      return x !== riga && x.id === riga.id && x.portata === n && (x.nota || "") === (riga.nota || "");
    })[0];
  }
  // Cambiare portata su una riga da più porzioni ne sposta UNA: è quello che
  // vuol dire "la mia prima, la sua dopo".
  function cambiaPortata(riga, n) {
    if (riga.portata === n) return;
    const g = gemella(riga, n);
    if (riga.qta > 1) {
      riga.qta -= 1;
      if (g) g.qta += 1;
      else carrello.splice(carrello.indexOf(riga) + 1, 0, Object.assign({}, riga, { qta: 1, portata: n }));
    } else {
      if (g) { g.qta += 1; carrello = carrello.filter(function (r) { return r !== riga; }); }
      else riga.portata = n;
    }
    ricorda(); disegnaFoglio();
  }

  /* ==========================================================================
     LA BARRA IN FONDO
     ======================================================================== */
  let barra = null;
  function disegnaBarra() {
    if (!barra) {
      barra = document.createElement("button");
      barra.type = "button";
      barra.className = "ord-barra";
      barra.addEventListener("click", function () { if (barra.dataset.modo === "stato") apriStato(); else apriFoglio(); });
      document.body.appendChild(barra);
    }
    if (carrello.length) {
      barra.dataset.modo = "carrello";
      barra.classList.remove("ord-barra-stato");
      barra.innerHTML =
        '<span class="ord-barra-n">' + pezzi() + "</span>" +
        '<span class="ord-barra-txt">' + t("vedi") + "</span>" +
        '<span class="ord-barra-tot">' + prezzoTesto(totale()) + "</span>";
    } else if (ordineId) {
      // Nessun carrello ma un ordine in viaggio: la barra diventa il suo stato.
      // Prima il pannello si riapriva da solo a ogni caricamento e stava in mezzo.
      barra.dataset.modo = "stato";
      barra.classList.add("ord-barra-stato");
      barra.innerHTML =
        '<span class="ord-barra-n">✓</span>' +
        '<span class="ord-barra-txt">' + (statoCorrente ? t(asporto ? "asp_" + statoCorrente : statoCorrente) : t("inCorso")) + "</span>" +
        '<span class="ord-barra-tot">' + t("tocca") + "</span>";
    }
  }

  /* ==========================================================================
     IL FOGLIO DELL'ORDINE
     ======================================================================== */
  let foglio = null;
  function creaFoglio() {
    foglio = document.createElement("div");
    foglio.className = "ord-foglio";
    foglio.innerHTML =
      '<div class="ord-foglio-int">' +
      '<button type="button" class="ord-chiudi" aria-label="Chiudi">✕</button>' +
      '<p class="ord-tavolo"></p>' +
      '<h2 class="ord-titolo"></h2>' +
      '<div class="ord-righe"></div>' +
      '<div class="ord-coperti">' +
      '<label class="ord-lab" for="ord-coperti-n"></label>' +
      '<div class="ord-coperti-riga">' +
      '<button type="button" class="ord-cop-meno">−</button>' +
      '<input id="ord-coperti-n" class="ord-cop-n" type="number" inputmode="numeric" min="1" max="30" value="2">' +
      '<button type="button" class="ord-cop-piu">+</button>' +
      "</div>" +
      '<p class="ord-aiuto"></p>' +
      "</div>" +
      '<div class="ord-tot"></div>' +
      '<button type="button" class="ord-manda"></button>' +
      "</div>";
    document.body.appendChild(foglio);
    foglio.querySelector(".ord-chiudi").addEventListener("click", chiudiFoglio);
    foglio.addEventListener("click", function (e) { if (e.target === foglio) chiudiFoglio(); });
    foglio.querySelector(".ord-manda").addEventListener("click", manda);
    foglio.querySelector(".ord-cop-meno").addEventListener("click", function () { cambiaCoperti(-1); });
    foglio.querySelector(".ord-cop-piu").addEventListener("click", function () { cambiaCoperti(1); });
  }
  function cambiaCoperti(d) {
    const i = foglio.querySelector(".ord-cop-n");
    i.value = Math.max(1, Math.min(30, (parseInt(i.value, 10) || 1) + d));
  }
  function disegnaFoglio() {
    if (!foglio || !foglio.classList.contains("aperto")) return;
    if (asporto) return disegnaFoglioAsporto();
    foglio.querySelector(".ord-tavolo").textContent = t("tavolo") + " " + tavolo;
    foglio.querySelector(".ord-titolo").textContent = t("ordine");
    foglio.querySelector(".ord-lab").textContent = t("coperti");
    foglio.querySelector(".ord-aiuto").textContent = t("copertiAiuto");
    const bottoneManda = foglio.querySelector(".ord-manda");
    bottoneManda.textContent = t("manda");
    bottoneManda.disabled = false;
    const vecchioAvviso = foglio.querySelector(".ord-rifiuto");
    if (vecchioAvviso) vecchioAvviso.remove();      // ⚠️ dopo un invio restava spento: si poteva ordinare una volta sola
    foglio.querySelector(".ord-tot").textContent = prezzoTesto(totale());

    const cont = foglio.querySelector(".ord-righe");
    cont.innerHTML = "";
    if (!carrello.length) {
      cont.innerHTML = '<p class="ord-vuoto">' + t("vuoto") + "</p>";
      return;
    }
    // Il cliente sceglie tutto insieme, "a getto". Poi su OGNI RIGA dice quando
    // la vuole: 1 arriva per prima, 4 per ultima. Non è la categoria del menu a
    // decidere — allo stesso tavolo uno può volere il primo prima dell'antipasto.
    const nota = document.createElement("p");
    nota.className = "ord-seq-aiuto";
    nota.textContent = t("sequenza");
    cont.appendChild(nota);

    portateUsate().forEach(function (num) {
      const blocco = document.createElement("section");
      blocco.className = "ord-portata";
      const testa = document.createElement("header");
      testa.className = "ord-portata-testa";
      testa.innerHTML = '<span class="ord-portata-n">' + num + "</span><h3>" + num + t("portataN") + "</h3>";
      blocco.appendChild(testa);
      cont.appendChild(blocco);

      carrello.filter(function (r) { return r.portata === num; }).forEach(function (r) {
        const d = document.createElement("div");
        d.className = "ord-riga";
        let scelte = "";
        for (let n = 1; n <= MAX_PORTATE; n++) {
          scelte += '<button type="button" class="ord-p' + (r.portata === n ? " scelto" : "") + '" data-n="' + n + '">' + n + "</button>";
        }
        d.innerHTML =
          '<div class="ord-riga-alto">' +
          '<span class="ord-qta">' + r.qta + "×</span>" +
          '<span class="ord-nome">' + r.nome + "</span>" +
          '<span class="ord-prezzo">' + prezzoTesto(r.prezzo) + "</span>" +
          "</div>" +
          '<div class="ord-riga-basso">' +
          '<button type="button" class="ord-meno">−</button>' +
          '<button type="button" class="ord-piu">+</button>' +
          '<span class="ord-scelte-lab">' + t("portata") + "</span>" +
          '<span class="ord-scelte">' + scelte + "</span>" +
          "</div>" +
          (r.qta > 1 ? '<p class="ord-spostauno">' + t("spostaUno") + "</p>" : "") +
          '<input class="ord-nota" type="text" placeholder="' + t("notaEs") + '" value="' + (r.nota || "").replace(/"/g, "&quot;") + '">';
        d.querySelector(".ord-meno").addEventListener("click", function () { togli(r); });
        d.querySelector(".ord-piu").addEventListener("click", function () {
          r.qta += 1; ricorda(); disegnaBarra(); disegnaFoglio();
        });
        d.querySelectorAll(".ord-p").forEach(function (b) {
          b.addEventListener("click", function () { cambiaPortata(r, parseInt(b.dataset.n, 10)); });
        });
        d.querySelector(".ord-nota").addEventListener("input", function (e) { r.nota = e.target.value; ricorda(); });
        blocco.appendChild(d);
      });
    });
  }
  function apriFoglio() {
    if (!foglio) creaFoglio();
    foglio.classList.add("aperto");
    document.body.classList.add("ord-bloccato");
    disegnaFoglio();
  }
  function chiudiFoglio() {
    if (foglio) foglio.classList.remove("aperto");
    document.body.classList.remove("ord-bloccato");
  }

  /* ==========================================================================
     MANDARE L'ORDINE E SEGUIRLO
     ======================================================================== */
  async function manda() {
    if (asporto) return mandaAsporto();
    if (!carrello.length || !puoOrdinare()) return;
    const bottone = foglio.querySelector(".ord-manda");
    bottone.disabled = true; bottone.textContent = t("mando");
    const coperti = parseInt(foglio.querySelector(".ord-cop-n").value, 10) || 1;
    try {
      const o = await OrdiniStore.manda({
        tavolo: tavolo, chiave: chiave, coperti: coperti,
        righe: righeOrdinate().map(function (r) {
          return { id: r.id, nome: r.nome, prezzo: r.prezzo, qta: r.qta,
                   nota: r.nota || "", portata: r.portata, categoria: r.categoria };
        }),
        totale: totale(),
      });
      ordineId = o.id;
      carrello = []; ricorda(); aggiornaCorpo(); disegnaBarra();
      chiudiFoglio();
      apriStato();
    } catch (e) {
      // Il database rifiuta con un codice preciso: qui diventa una frase che
      // il cliente capisce, invece di un pulsante che non fa niente.
      const codice = String((e && e.message) || "").match(/[A-Z_]{5,}/);
      const chiave = "no_" + (codice ? codice[0] : "ALTRO");
      mostraRifiuto(TESTI.it[chiave] ? t(chiave) : t("no_ALTRO"));
      bottone.disabled = false; bottone.textContent = t("manda");
    }
  }

  function mostraRifiuto(testo) {
    if (!foglio) return;
    let avviso = foglio.querySelector(".ord-rifiuto");
    if (!avviso) {
      avviso = document.createElement("p");
      avviso.className = "ord-rifiuto";
      foglio.querySelector(".ord-manda").parentNode.insertBefore(avviso, foglio.querySelector(".ord-manda"));
    }
    avviso.textContent = "⚠️ " + testo;
  }

  let pannello = null;
  function creaPannello() {
    pannello = document.createElement("div");
    pannello.className = "ord-stato";
    pannello.innerHTML =
      '<div class="ord-stato-int">' +
      '<div class="ord-passi">' +
      '<div class="ord-passo" data-p="inviato"><span class="ord-pallino"></span><b></b><small></small></div>' +
      '<div class="ord-passo" data-p="visto"><span class="ord-pallino"></span><b></b><small></small></div>' +
      '<div class="ord-passo" data-p="confermato"><span class="ord-pallino"></span><b></b><small></small></div>' +
      "</div>" +
      '<button type="button" class="ord-chiudi" aria-label="Chiudi">✕</button>' +
      '<button type="button" class="ord-chiama"></button>' +
      '<button type="button" class="ord-ancora"></button>' +
      "</div>";
    document.body.appendChild(pannello);
    pannello.querySelector(".ord-chiudi").addEventListener("click", chiudiStato);
    pannello.addEventListener("click", function (e) { if (e.target === pannello) chiudiStato(); });
    pannello.querySelector(".ord-ancora").addEventListener("click", chiudiStato);
    pannello.querySelector(".ord-chiama").addEventListener("click", async function () {
      const b = pannello.querySelector(".ord-chiama");
      b.disabled = true; b.textContent = t("chiamato");
      if (OrdiniStore.chiama) await OrdiniStore.chiama(ordineId);
    });
  }
  function chiudiStato() {
    if (pannello) pannello.classList.remove("aperto");
    document.body.classList.remove("ord-bloccato");
  }
  function apriStato() {
    if (!pannello) { if (asporto) creaPannelloAsporto(); else creaPannello(); }
    pannello.classList.add("aperto");
    document.body.classList.add("ord-bloccato");
    daQuando = Date.now();
    aggiornaStato();
    clearInterval(timerStato);
    timerStato = setInterval(aggiornaStato, asporto ? 5000 : 2000);
  }
  async function aggiornaStato() {
    if (asporto) return aggiornaStatoAsporto();
    if (!ordineId) return;
    const o = await OrdiniStore.leggiOrdine(ordineId);
    const stato = (o && o.stato) || "inviato";
    if (stato !== statoCorrente) { statoCorrente = stato; disegnaBarra(); }
    // a lavoro finito la barra si toglie di mezzo da sola
    if (stato === "confermato" && !timerFine) {
      timerFine = setTimeout(function () {
        ordineId = null; statoCorrente = null; timerFine = null;
        ricorda(); aggiornaCorpo(); chiudiStato();
      }, 45000);
    }
    if (!pannello) return;
    const ordine = ["inviato", "visto", "confermato"];
    const quale = ordine.indexOf(stato);
    pannello.querySelectorAll(".ord-passo").forEach(function (el, i) {
      const p = el.dataset.p;
      el.querySelector("b").textContent = t(p);
      el.querySelector("small").textContent = t(p + "Sub");
      el.classList.toggle("fatto", i <= quale);
      el.classList.toggle("adesso", i === quale);
    });
    const chiama = pannello.querySelector(".ord-chiama");
    chiama.textContent = (o && o.chiamatoAlle) ? t("chiamato") : t("chiama");
    chiama.disabled = !!(o && o.chiamatoAlle);
    // il pulsante compare solo se nessuno si è fatto vivo dopo qualche minuto
    chiama.style.display = (quale < 1 && Date.now() - daQuando > ATTESA_CHIAMATA) ? "" : "none";
    pannello.querySelector(".ord-ancora").textContent = t("nuovo");
    if (stato === "confermato") { clearInterval(timerStato); timerStato = null; }
  }

  /* ==========================================================================
     ASPORTO — stesso carrello, niente tavolo né portate: ora di ritiro e dati
     del Club. Chi ha già la tessera su questo telefono non riscrive niente.
     ======================================================================== */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function riempi(testo, v) { return String(testo).replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ""; }); }
  function clubPronto() { return typeof Club !== "undefined" && Club && typeof Club.chiave === "function"; }
  function chiaveClub() { try { return clubPronto() ? Club.chiave() : null; } catch (e) { return null; } }
  function nomeClub() {
    try {
      const p = clubPronto() && Club.profiloSalvato();
      return p && p.nome ? String(p.nome).split(/\s+/)[0] : "";
    } catch (e) { return ""; }
  }
  function dispositivo() {
    try {
      let d = localStorage.getItem("vdc_disp_asporto");
      if (!d) { d = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("vdc_disp_asporto", d); }
      return d;
    } catch (e) { return ""; }
  }
  // i piatti che pesano sulla cucina (bevande e dolci no): servono a scegliere un orario con posto
  function pezziCucina() {
    const no = (aspInfo && aspInfo.nonContano) || [];
    return carrello.reduce(function (s, r) { return s + (no.indexOf(r.slug || slugDi(r.id)) >= 0 ? 0 : r.qta); }, 0);
  }

  // una striscia in basso, finché il carrello è vuoto: si capisce subito che si può ordinare
  function bannerAsporto() {
    let b = $(".ord-asp-banner");
    if (!b) {
      b = document.createElement("div");
      b.className = "ord-asp-banner";
      document.body.appendChild(b);
    }
    b.textContent = puoOrdinare() ? t("aspBanner") : t("aspChiuso");
  }

  function disegnaFoglioAsporto() {
    foglio.classList.add("asporto");
    foglio.querySelector(".ord-tavolo").textContent = "🛍️ " + t("asporto");
    foglio.querySelector(".ord-titolo").textContent = t("asportoTitolo");
    const bottone = foglio.querySelector(".ord-manda");
    bottone.textContent = t("mandaAsp");
    bottone.disabled = false;
    const vecchio = foglio.querySelector(".ord-rifiuto");
    if (vecchio) vecchio.remove();
    foglio.querySelector(".ord-tot").textContent = prezzoTesto(totale()) + " · " + t("pagaRitiro");

    const cont = foglio.querySelector(".ord-righe");
    cont.innerHTML = "";
    if (!carrello.length) {
      cont.innerHTML = '<p class="ord-vuoto">' + t("vuoto") + "</p>";
      partiAsporto(false);
      return;
    }
    carrello.forEach(function (r) {
      const d = document.createElement("div");
      d.className = "ord-riga";
      d.innerHTML =
        '<div class="ord-riga-alto">' +
        '<span class="ord-qta">' + r.qta + "×</span>" +
        '<span class="ord-nome">' + esc(r.nome) + "</span>" +
        '<span class="ord-prezzo">' + prezzoTesto(r.prezzo) + "</span>" +
        "</div>" +
        '<div class="ord-riga-basso">' +
        '<button type="button" class="ord-meno">−</button>' +
        '<button type="button" class="ord-piu">+</button>' +
        "</div>" +
        '<input class="ord-nota" type="text" maxlength="120" placeholder="' + esc(t("notaEs")) + '" value="' + esc(r.nota || "") + '">';
      d.querySelector(".ord-meno").addEventListener("click", function () { togli(r); });
      d.querySelector(".ord-piu").addEventListener("click", function () {
        r.qta += 1; ricorda(); disegnaBarra(); disegnaFoglio();
      });
      d.querySelector(".ord-nota").addEventListener("input", function (e) { r.nota = e.target.value; ricorda(); });
      cont.appendChild(d);
    });
    partiAsporto(true);
  }

  // ora di ritiro, dati del Club e nota: si ridisegnano senza perdere quello che è già scritto
  function campoAsporto(c, tipo, auto) {
    return '<label class="ord-campo"><span>' + esc(t(c)) + '</span><input data-c="' + c + '" type="' + tipo +
      '" autocomplete="' + auto + '"' + (tipo === "tel" ? ' inputmode="tel"' : "") + ' value="' + esc(aspDati[c]) + '"></label>';
  }
  let cercoNome = false;
  function partiAsporto(mostra) {
    let box = foglio.querySelector(".ord-asp");
    if (!box) {
      box = document.createElement("div");
      box.className = "ord-asp";
      foglio.querySelector(".ord-foglio-int").insertBefore(box, foglio.querySelector(".ord-tot"));
      box.addEventListener("click", function (e) {
        const b = e.target.closest("button");
        if (!b || b.disabled) return;
        if (b.dataset.ora) { aspDati.ritiro = b.dataset.ora; partiAsporto(true); }
        else if (b.classList.contains("ord-non-io")) {
          try { Club.dimenticaTessera(); } catch (er) {}
          partiAsporto(true);
        }
      });
      const scrivi = function (e) {
        const c = e.target.dataset && e.target.dataset.c;
        if (c) aspDati[c] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      };
      box.addEventListener("input", scrivi);
      box.addEventListener("change", scrivi);
    }
    if (!mostra) { box.innerHTML = ""; return; }
    const servono = Math.max(1, pezziCucina());
    const orari = (aspInfo && aspInfo.orari) || [];
    if (aspDati.ritiro && !orari.some(function (o) { return o.ora === aspDati.ritiro && o.liberi >= servono; })) aspDati.ritiro = null;
    const socio = chiaveClub();
    // tessera senza nome salvato (es. appena iscritto qui): lo chiediamo una volta al Club
    if (socio && !nomeClub() && !cercoNome) {
      cercoNome = true;
      Club.profilo().then(function () {
        if (nomeClub() && foglio.classList.contains("aperto")) partiAsporto(true);
      }).catch(function () {});
    }
    box.innerHTML =
      '<p class="ord-lab">' + esc(t("ritiro")) + "</p>" +
      '<p class="ord-aiuto">' + esc(t("ritiroAiuto")) + "</p>" +
      '<div class="ord-orari">' + orari.map(function (o) {
        const ok = o.liberi >= servono;
        return '<button type="button" class="ord-ora' + (o.ora === aspDati.ritiro ? " scelto" : "") + '" data-ora="' + esc(o.ora) + '"' +
          (ok ? "" : " disabled") + ">" + esc(o.ora) + (ok ? "" : "<small>" + esc(t("pieno")) + "</small>") + "</button>";
      }).join("") + "</div>" +
      '<p class="ord-lab ord-lab-dati">' + esc(t("dati")) + "</p>" +
      (socio
        ? '<p class="ord-socio">' + esc(riempi(t("socio"), { nome: nomeClub() || "…" })) +
          ' <button type="button" class="ord-link ord-non-io">' + esc(t("nonSeiTu")) + "</button></p>"
        : campoAsporto("nome", "text", "name") + campoAsporto("telefono", "tel", "tel") + campoAsporto("email", "email", "email") +
          '<label class="ord-campo"><span>' + esc(t("nascita")) + " <small>· " + esc(t("nascitaPerche")) + "</small></span>" +
          '<input data-c="nascita" type="date" autocomplete="bday" value="' + esc(aspDati.nascita) + '"></label>' +
          '<label class="ord-spunta"><input type="checkbox" data-c="privacy"' + (aspDati.privacy ? " checked" : "") + "><span>" + esc(t("privacy")) + "</span></label>" +
          '<details class="ord-privacy"><summary>' + esc(t("privacyTitolo")) + "</summary>" + t("privacyTesto") + "</details>" +
          '<label class="ord-spunta"><input type="checkbox" data-c="promo"' + (aspDati.promo ? " checked" : "") + "><span>" + esc(t("promo")) + "</span></label>" +
          '<p class="ord-club">' + esc(t("club")) + "</p>") +
      '<label class="ord-campo"><span>' + esc(t("notaOrdine")) + '</span><textarea data-c="nota" rows="2" maxlength="300" placeholder="' +
        esc(t("notaOrdineEs")) + '">' + esc(aspDati.nota) + "</textarea></label>";
  }

  async function mandaAsporto() {
    if (!carrello.length || !puoOrdinare()) return;
    const bottone = foglio.querySelector(".ord-manda");
    const socio = chiaveClub();
    const no = function (k) { mostraRifiuto(t(k)); };
    if (!aspDati.ritiro) return no("e_ritiro");
    if (!socio) {
      if (aspDati.nome.trim().length < 2) return no("e_nome");
      if (aspDati.telefono.replace(/\D/g, "").length < 8) return no("e_telefono");
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(aspDati.email.trim())) return no("e_email");
      if (!aspDati.nascita) return no("e_nascita");
      if (!aspDati.privacy) return no("e_privacy");
    }
    bottone.disabled = true; bottone.textContent = t("mando");
    try {
      const o = await OrdiniStore.asporto.manda({
        ritiro: aspDati.ritiro, totale: totale(), nota: aspDati.nota.trim(), chiave: socio || "",
        righe: carrello.map(function (r) {
          return { id: r.id, nome: r.nome, prezzo: r.prezzo, qta: r.qta, nota: r.nota || "",
                   categoria: r.categoria, slug: r.slug || slugDi(r.id) };
        }),
        nome: aspDati.nome.trim(), telefono: aspDati.telefono.trim(), email: aspDati.email.trim(),
        nascita: aspDati.nascita, promo: aspDati.promo, lingua: document.documentElement.lang || "it",
        dispositivo: dispositivo(),
      });
      // chi è appena entrato nel Club si ritrova la tessera nel menu (il regalo 🎁 in alto)
      if (o.chiave && clubPronto()) {
        try { Club.salvaTessera(o.chiave); Club.profilo().catch(function () {}); } catch (er) {}
      }
      ordineId = o.segreto; statoCorrente = null;
      carrello = []; aspDati.ritiro = null; aspDati.nota = "";
      ricorda(); aggiornaCorpo(); disegnaBarra();
      chiudiFoglio();
      apriStato();
    } catch (e) {
      // la tessera salvata non vale più (es. uscito dal Club): si torna ai dati da scrivere
      if (e.codice === "telefono" && socio) { try { Club.dimenticaTessera(); } catch (er) {} }
      if (e.codice === "pieno" || e.codice === "tardi" || e.codice === "telefono") {
        try { aspInfo = await OrdiniStore.asporto.info(); } catch (er) {}
        partiAsporto(true);
      }
      const k = "e_" + (e.codice || "server");
      mostraRifiuto(TESTI.it[k] ? t(k) : t("e_server"));
      bottone.disabled = false; bottone.textContent = t("mandaAsp");
    }
  }

  function creaPannelloAsporto() {
    pannello = document.createElement("div");
    pannello.className = "ord-stato ord-stato-asp";
    pannello.innerHTML =
      '<div class="ord-stato-int">' +
      '<button type="button" class="ord-chiudi" aria-label="Chiudi">✕</button>' +
      '<p class="ord-asp-cod-lab"></p><p class="ord-asp-cod"></p><p class="ord-asp-ritiro"></p>' +
      '<div class="ord-passi">' + ["ricevuto", "preparazione", "pronto"].map(function (p) {
        return '<div class="ord-passo" data-p="' + p + '"><span class="ord-pallino"></span><b></b><small></small></div>';
      }).join("") + "</div>" +
      '<p class="ord-asp-fine"></p>' +
      '<button type="button" class="ord-asp-annulla"></button>' +
      '<button type="button" class="ord-ancora"></button>' +
      "</div>";
    document.body.appendChild(pannello);
    pannello.querySelector(".ord-chiudi").addEventListener("click", chiudiStato);
    pannello.addEventListener("click", function (e) { if (e.target === pannello) chiudiStato(); });
    pannello.querySelector(".ord-ancora").addEventListener("click", chiudiStato);
    pannello.querySelector(".ord-asp-annulla").addEventListener("click", async function () {
      if (!confirm(t("annullaChiedi"))) return;
      const b = this;
      b.disabled = true;
      try { await OrdiniStore.asporto.annulla(ordineId); }
      catch (e) { alert(TESTI.it["e_" + e.codice] ? t("e_" + e.codice) : t("e_server")); }
      b.disabled = false;
      aggiornaStatoAsporto();
    });
  }

  async function aggiornaStatoAsporto() {
    if (!ordineId) return;
    let o = null;
    try { o = await OrdiniStore.asporto.leggi(ordineId); } catch (e) { return; }
    if (!o) { ordineId = null; ricorda(); aggiornaCorpo(); return; }
    if (o.stato !== statoCorrente) { statoCorrente = o.stato; disegnaBarra(); }
    const finito = o.stato === "ritirato" || o.stato === "annullato";
    if (finito) {
      clearInterval(timerStato); timerStato = null;
      if (!timerFine) {
        timerFine = setTimeout(function () {
          ordineId = null; statoCorrente = null; timerFine = null;
          ricorda(); aggiornaCorpo(); chiudiStato();
        }, 30000);
      }
    }
    if (!pannello) return;
    pannello.querySelector(".ord-asp-cod-lab").textContent = t("codice");
    pannello.querySelector(".ord-asp-cod").textContent = o.codice;
    pannello.querySelector(".ord-asp-ritiro").textContent = riempi(t("ritiroAlle"), { ora: o.ritiro });
    const passi = ["ricevuto", "preparazione", "pronto"];
    const quale = o.stato === "ritirato" ? 3 : passi.indexOf(o.stato);
    pannello.querySelectorAll(".ord-passo").forEach(function (el, i) {
      const p = el.dataset.p;
      el.querySelector("b").textContent = t("asp_" + p);
      el.querySelector("small").textContent = t("asp_" + p + "Sub");
      el.classList.toggle("fatto", i <= quale);
      el.classList.toggle("adesso", i === quale);
    });
    pannello.querySelector(".ord-passi").style.display = o.stato === "annullato" ? "none" : "";
    pannello.querySelector(".ord-asp-fine").textContent = finito ? t("asp_" + o.stato) : "";
    const annulla = pannello.querySelector(".ord-asp-annulla");
    annulla.textContent = t("annullaOrdine");
    annulla.style.display = o.stato === "ricevuto" ? "" : "none";
    pannello.querySelector(".ord-ancora").textContent = finito ? t("chiudi") : t("nuovo");
  }

  /* ==========================================================================
     IL PANNELLO DEL TITOLARE — dentro il menu segreto
     --------------------------------------------------------------------------
     L'interruttore deve stare dove il titolare sa già andare: dito premuto 5
     secondi in basso a destra, password, ed eccolo in cima all'editor.
     Si infila da fuori guardando quando l'editor si apre: nel motore non
     tocchiamo un'altra riga.
     ======================================================================== */
  function pannelloTitolare(dentro) {
    if (dentro.querySelector(".ord-tit")) return;
    const box = document.createElement("section");
    box.className = "ord-tit";
    box.innerHTML =
      '<p class="ord-tit-kick">📱 Ordine dal tavolo</p>' +
      '<div class="ord-tit-riga" data-sw="attivo">' +
      '<button type="button" class="ord-tit-sw" role="switch"><span class="ord-tit-pallina"></span></button>' +
      '<span class="ord-tit-stato"></span>' +
      "</div>" +
      '<p class="ord-tit-spiega">Quando è acceso, chi inquadra il QR del proprio tavolo può mandare l\'ordine. ' +
      "I QR vecchi, senza numero di tavolo, restano semplici menu e non possono ordinare.</p>" +
      '<div class="ord-tit-riga" data-sw="totale">' +
      '<button type="button" class="ord-tit-sw" role="switch"><span class="ord-tit-pallina"></span></button>' +
      '<span class="ord-tit-stato"></span>' +
      "</div>" +
      '<p class="ord-tit-spiega">Il totale della spesa mentre il cliente ordina. ' +
      "Spento, il cliente non vede quanto sta spendendo: c'è chi ordina di più. " +
      "I prezzi del menu restano comunque visibili, e il totale arriva al banco lo stesso.</p>" +
      '<div class="ord-tit-link">' +
      '<a href="tavoli.html">🪑 Tavoli e QR</a>' +
      '<a href="banco.html">📋 Schermata del banco</a>' +
      "</div>";
    dentro.insertBefore(box, dentro.firstChild);

    /* Due interruttori uguali, uno per riga. "acceso" sta sulla riga e non
       sul riquadro, altrimenti il secondo accenderebbe anche il primo.
       Il totale parte acceso: un database che non conosce ancora questa
       colonna non deve far sparire il conto a nessuno. */
    const ETICHETTE = {
      attivo: ["Ordine dal tavolo acceso", "Ordine dal tavolo spento"],
      totale: ["Il cliente vede il totale", "Totale nascosto al cliente"],
    };
    function leggi(st, quale) {
      return quale === "attivo" ? !!st.attivo : st.mostraTotale !== false;
    }
    function mostra(st) {
      box.querySelectorAll(".ord-tit-riga").forEach(function (riga) {
        const quale = riga.dataset.sw;
        const acceso = leggi(st, quale);
        riga.classList.toggle("acceso", acceso);
        riga.querySelector(".ord-tit-sw").setAttribute("aria-checked", acceso ? "true" : "false");
        riga.querySelector(".ord-tit-stato").textContent = ETICHETTE[quale][acceso ? 0 : 1];
      });
    }
    OrdiniStore.stato().then(mostra);
    box.querySelectorAll(".ord-tit-sw").forEach(function (sw) {
      sw.addEventListener("click", async function () {
        const quale = sw.parentNode.dataset.sw;
        const st = await OrdiniStore.stato();
        const parziale = quale === "attivo"
          ? { attivo: !leggi(st, "attivo") }
          : { mostraTotale: !leggi(st, "totale") };
        const nuovo = await OrdiniStore.cambiaStato(parziale);
        servizio = nuovo;
        mostra(nuovo);
        aggiornaCorpo();
      });
    });
  }
  function sorvegliaEditor() {
    const dentro = $("#edit-inner");
    if (!dentro) return;
    new MutationObserver(function () {
      if (dentro.querySelector("#me-pager")) pannelloTitolare(dentro);
    }).observe(dentro, { childList: true });
  }

  /* ==========================================================================
     AVVIO
     ======================================================================== */
  async function avvia() {
    leggiIndirizzo();
    costruisciIndice();
    ripesca();
    if (asporto) {
      document.body.classList.add("ord-asporto");
      try { aspInfo = await OrdiniStore.asporto.info(); } catch (e) { aspInfo = null; }
    } else {
      try { servizio = await OrdiniStore.stato(); } catch (e) {}
    }
    sorvegliaEditor();          // l'interruttore del titolare vive nel menu segreto
    aggiornaCorpo();
    if (!puoOrdinare() && !(asporto && ordineId)) return;
    disegnaBarra();
    // se il motore ha già costruito delle carte prima di noi, le decoriamo adesso
    document.querySelectorAll("#deck .card, #spec-cards .card").forEach(function (c) {
      if (!c.querySelector(".ord-add")) c.classList.add("ord-da-fare");
    });
    if (ordineId) {                      // ordine già in viaggio: lo seguiamo dalla
      aggiornaStato();                   // barra, senza sbattere il pannello in faccia
      clearInterval(timerStato);
      timerStato = setInterval(aggiornaStato, asporto ? 5000 : 2000);
    }
  }
  document.addEventListener("DOMContentLoaded", avvia);

  return { decora: decora, puoOrdinare: puoOrdinare, tavolo: function () { return tavolo; } };
})();
