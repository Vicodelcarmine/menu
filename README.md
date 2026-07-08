# Vico del Carmine — Menu (Osteria pizzeria napoletana)

Menu digitale a schermo, pensato per il cellulare (ideale per un QR code sul tavolo).
Categorie su **2 colonne**; toccando una categoria le schede dei piatti scorrono con
**animazione tipo carte da poker**. In cima il riquadro **Specialità**.

✨ Novità rispetto al menu de "Il Vicolo":
- **9 lingue** (IT · EN · FR · DE · ES · PT · JA · AR · RU) con selettore in alto a destra;
  la lingua si sceglie da sola in base al telefono del cliente.
- **Logo vero** in testata + **video d'apertura** con l'animazione del logo.
- Niente "Menu del Giorno": il menu è unico.

---

## 📁 I file

| File | A cosa serve |
|------|--------------|
| `index.html` | La pagina. Di solito non si tocca. |
| `assets/js/menu-data.js` | **👈 QUI c'è tutto il menu** (in 9 lingue): piatti, prezzi, descrizioni. |
| `assets/js/i18n.js` | I testi dei pulsanti nelle 9 lingue. Si tocca di rado. |
| `assets/js/app.js` | Il funzionamento (carosello, lingue, animazioni). Non toccare. |
| `assets/js/store.js` | Collegamento a Supabase (editor prezzi/foto). Vedi sotto. |
| `assets/css/style.css` | Colori e stile. In cima (`:root`) si cambiano i colori. |
| `assets/media/` | Il logo (`logo.jpg`) e il video d'apertura (`intro.mp4`). |
| `img/` | Le foto dei piatti (es. `img/margherita.jpg`). |
| `menu.json` | Copia originale del menu (riferimento/archivio). |
| `supabase-setup.sql` | Da eseguire su Supabase quando lo colleghi (vedi sotto). |

> Per vedere il menu sul computer: **doppio clic su `index.html`**. Nessuna installazione.

---

## 🌍 Le lingue

Il menu appare **da solo** nella lingua del telefono del cliente; in alto a destra c'è
il pulsante 🌐 per cambiarla a mano tra le 9 lingue. L'**arabo** si legge da destra a sinistra
(il sito si gira in automatico).

- I **nomi dei piatti** (es. "Margherita") restano uguali in tutte le lingue.
- Si traducono le **descrizioni** e i **titoli delle categorie**. Ogni piatto ha una
  descrizione per lingua in `menu-data.js`:
  ```js
  "descrizione": {
    "it": "salsa di pomodoro, mozzarella, basilico",
    "en": "tomato sauce, mozzarella, basil",
    ...
  }
  ```

---

## ✏️ Modificare il menu (metodo facile, da GitHub.com)

1. Vai su **github.com** → apri il repository del sito.
2. Entra in `assets` → `js` → clicca **`menu-data.js`** → icona **matita ✏️** (Edit).
3. Cambia i testi tra virgolette (il **prezzo è un numero**, es. `"prezzo": 11.5`).
4. In alto clicca **Commit changes**. Dopo ~1 minuto il sito è aggiornato.

Per aggiungere una foto a un piatto: metti l'immagine nella cartella `img/` e scrivi
`"image": "img/nomefoto.jpg"`. Se un piatto non ha `image`, appare una bella icona.

---

## 🎬 Cambiare il video d'apertura

Nella cartella (sul tuo computer) `MEDIA/LOGO/` ci sono più animazioni. Per usarne un'altra,
copiala in `assets/media/` rinominandola **`intro.mp4`** (sostituendo quella attuale).
Attualmente è impostata `logo-animation.mp4` (la più leggera, veloce da caricare sul telefono).
L'intro si può sempre saltare toccando lo schermo e compare **una sola volta** per visita.

---

## 📲 Installare l'app sul telefono (con il logo)

Apri l'indirizzo del menu nel browser del telefono, poi:
- **iPhone (Safari):** **Condividi** ⬆️ → **Aggiungi alla schermata Home**.
- **Android (Chrome):** menu **⋮** → **Installa app** / **Aggiungi a schermata Home**.

Comparirà l'icona 🍕 **Vico del Carmine** come un'app e si aprirà a schermo intero.

---

## 🚀 Pubblicare online (nuovo account GitHub)

1. Con il **nuovo account GitHub**, crea un repository (es. `MENU-VICO-DEL-CARMINE`).
2. Carica dentro tutti questi file (con GitHub Desktop: *Add local repository* → questa cartella → *Publish*).
   > Le cartelle `IMMAGINI PIATTI/` e `MEDIA/` **non** vengono caricate (sono già copiate in
   > `img/` e `assets/media/`): è normale, tienile solo come archivio sul computer.
3. Su GitHub: **Settings → Pages → Deploy from branch → `main` / root → Save**.
4. Dopo ~1 minuto il sito è online all'indirizzo:
   `https://TUO-UTENTE.github.io/MENU-VICO-DEL-CARMINE/`

---

## 🔐 Collegare Supabase (editor prezzi & foto)

L'editor nascosto (in basso a destra: **tieni premuto 5 secondi** → password) permette di
cambiare **prezzi e foto** senza toccare il codice. Per farlo funzionare serve un **nuovo
progetto Supabase**:

1. Crea un progetto su **supabase.com** (nuovo account).
2. **SQL Editor** → incolla e avvia il file **`supabase-setup.sql`** (crea tabelle, password e bucket foto).
   - Le password di esempio sono `staff1234` e `titolare1234`: **cambiale** (istruzioni nel file).
3. **Project Settings → API**: copia *Project URL* e la chiave *publishable*.
4. Aprili in `assets/js/store.js` e incollali al posto di `INCOLLA-QUI` / `INCOLLA_QUI`.
5. Commit + push. Fatto: l'editor ora salva online per tutti.

> Finché Supabase non è collegato, il menu funziona lo stesso (mostra i prezzi/foto di
> `menu-data.js`); solo l'editor avvisa "Supabase non ancora collegato".

---

## 📱 QR code per il tavolo
Genera un QR code gratuito dall'indirizzo del sito (cerca "QR code generator"), stampalo e
mettilo sui tavoli: i clienti inquadrano e vedono il menu nella loro lingua.

---

## 🎨 Colori
Palette calda napoletana: **carminio** (il nome!), oro, basilico, panna.
Si cambia in cima a `assets/css/style.css` (sezione `:root`).
