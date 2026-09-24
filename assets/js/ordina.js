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
  let servizio = { attivo: false, aperto: true, messaggio: "" };
  let carrello = [];            // { id, nome, prezzo, qta, nota }
  let ordineId = null;          // ordine in corso
  let timerStato = null, daQuando = 0, statoCorrente = null, timerFine = null;

  const MEM = "vdc_carrello";
  const MEM_ORD = "vdc_ordine_in_corso";
  const ATTESA_CHIAMATA = 4 * 60 * 1000;   // dopo 4 minuti compare "chiama il cameriere"

  function ricorda() {
    try {
      sessionStorage.setItem(MEM, JSON.stringify({ righe: carrello }));
      if (ordineId) sessionStorage.setItem(MEM_ORD, ordineId); else sessionStorage.removeItem(MEM_ORD);
    } catch (e) {}
  }
  function ripesca() {
    try {
      const m = JSON.parse(sessionStorage.getItem(MEM) || "{}");
      carrello = m.righe || [];
      ordineId = sessionStorage.getItem(MEM_ORD) || null;
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
  }
  function puoOrdinare() { return !!(tavolo && servizio.attivo && servizio.aperto); }

  function aggiornaCorpo() {
    // Il totale si nasconde da CSS, non togliendo i numeri: il conto continua
    // a essere calcolato e mandato al banco, semplicemente il cliente non lo vede.
    document.body.classList.toggle("ord-senza-totale", servizio.mostraTotale === false);
    document.body.classList.toggle("puo-ordinare", puoOrdinare());
    document.body.classList.toggle("ha-carrello", puoOrdinare() && (carrello.length > 0 || !!ordineId));
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
                        portata: dove, categoria: categoriaDi(id) });
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
        '<span class="ord-barra-txt">' + (statoCorrente ? t(statoCorrente) : t("inCorso")) + "</span>" +
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
    if (!pannello) creaPannello();
    pannello.classList.add("aperto");
    document.body.classList.add("ord-bloccato");
    daQuando = Date.now();
    aggiornaStato();
    clearInterval(timerStato);
    timerStato = setInterval(aggiornaStato, 2000);
  }
  async function aggiornaStato() {
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
    try { servizio = await OrdiniStore.stato(); } catch (e) {}
    sorvegliaEditor();          // l'interruttore del titolare vive nel menu segreto
    aggiornaCorpo();
    if (!puoOrdinare()) return;
    disegnaBarra();
    // se il motore ha già costruito delle carte prima di noi, le decoriamo adesso
    document.querySelectorAll("#deck .card, #spec-cards .card").forEach(function (c) {
      if (!c.querySelector(".ord-add")) c.classList.add("ord-da-fare");
    });
    if (ordineId) {                      // ordine già in viaggio: lo seguiamo dalla
      aggiornaStato();                   // barra, senza sbattere il pannello in faccia
      clearInterval(timerStato);
      timerStato = setInterval(aggiornaStato, 2000);
    }
  }
  document.addEventListener("DOMContentLoaded", avvia);

  return { decora: decora, puoOrdinare: puoOrdinare, tavolo: function () { return tavolo; } };
})();
