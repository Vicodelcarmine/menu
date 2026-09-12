/* ============================================================================
   VICO DEL CARMINE — TRADUZIONI DELL'INTERFACCIA (i18n)
   ----------------------------------------------------------------------------
   Qui stanno SOLO i testi dell'interfaccia (pulsanti, etichette, messaggi).
   I piatti e le loro descrizioni stanno in menu-data.js.
   Lingue: it, en, fr, de, es, pt, ja, ar, ru.
   ========================================================================== */

const LANGS = ["it", "en", "fr", "de", "es", "pt", "ja", "ar", "ru"];

// Nome della lingua nella lingua stessa (per il selettore)
const LANG_NATIVE = {
  it: "Italiano", en: "English", fr: "Français", de: "Deutsch",
  es: "Español", pt: "Português", ja: "日本語", ar: "العربية", ru: "Русский",
};

// Sigla breve per il pulsante del selettore
const LANG_SHORT = {
  it: "IT", en: "EN", fr: "FR", de: "DE", es: "ES", pt: "PT", ja: "JA", ar: "AR", ru: "RU",
};

// Bandierina per ogni lingua (si vedono su iPhone/Android/Mac)
const LANG_FLAG = {
  it: "🇮🇹", en: "🇬🇧", fr: "🇫🇷", de: "🇩🇪", es: "🇪🇸", pt: "🇵🇹", ja: "🇯🇵", ar: "🇸🇦", ru: "🇷🇺",
};

// Lingue che si leggono da destra a sinistra
const RTL_LANGS = ["ar"];

// Traduzione dei tipi di vino ("tipo" nel menu-data)
const WINE_TYPES = {
  "Rossi":   { it: "Rossi", en: "Red Wines", fr: "Rouges", de: "Rotweine", es: "Tintos", pt: "Tintos", ja: "赤ワイン", ar: "نبيذ أحمر", ru: "Красные" },
  "Bianchi": { it: "Bianchi", en: "White Wines", fr: "Blancs", de: "Weißweine", es: "Blancos", pt: "Brancos", ja: "白ワイン", ar: "نبيذ أبيض", ru: "Белые" },
};

const I18N = {
  it: {
    kicker: "Cucina napoletana · Firenze",
    sub: "Osteria pizzeria napoletana",
    dishes: "piatti",
    specialtiesTitle: "Specialità",
    specialtiesKicker: "✦ Le specialità della casa ✦",
    specialtiesSub: "Il meglio della nostra cucina napoletana",
    discover: "Scopri ›",
    options: "proposte",
    swipeHint: "Scorri · tocca · trascina",
    close: "Chiudi",
    skipIntro: "Tocca per entrare",
    coperto: "Coperto",
    aggiunte: "Aggiunte",
    burrata: "Burrata / stracciatella",
    impasti: "Impasti speciali",
    langTitle: "Scegli la lingua",
  },
  en: {
    kicker: "Neapolitan cuisine · Florence",
    sub: "Neapolitan osteria & pizzeria",
    dishes: "dishes",
    specialtiesTitle: "Specialties",
    specialtiesKicker: "✦ House specialties ✦",
    specialtiesSub: "The best of our Neapolitan kitchen",
    discover: "Discover ›",
    options: "options",
    swipeHint: "Swipe · tap · drag",
    close: "Close",
    skipIntro: "Tap to enter",
    coperto: "Cover charge",
    aggiunte: "Extra toppings",
    burrata: "Burrata / stracciatella",
    impasti: "Special dough",
    langTitle: "Choose your language",
  },
  fr: {
    kicker: "Cuisine napolitaine · Florence",
    sub: "Osteria pizzeria napolitaine",
    dishes: "plats",
    specialtiesTitle: "Spécialités",
    specialtiesKicker: "✦ Les spécialités de la maison ✦",
    specialtiesSub: "Le meilleur de notre cuisine napolitaine",
    discover: "Découvrir ›",
    options: "propositions",
    swipeHint: "Glissez · touchez · faites glisser",
    close: "Fermer",
    skipIntro: "Touchez pour entrer",
    coperto: "Couvert",
    aggiunte: "Suppléments",
    burrata: "Burrata / stracciatella",
    impasti: "Pâtes spéciales",
    langTitle: "Choisissez votre langue",
  },
  de: {
    kicker: "Neapolitanische Küche · Florenz",
    sub: "Neapolitanische Osteria & Pizzeria",
    dishes: "Gerichte",
    specialtiesTitle: "Spezialitäten",
    specialtiesKicker: "✦ Spezialitäten des Hauses ✦",
    specialtiesSub: "Das Beste aus unserer neapolitanischen Küche",
    discover: "Entdecken ›",
    options: "Angebote",
    swipeHint: "Wischen · tippen · ziehen",
    close: "Schließen",
    skipIntro: "Zum Eintreten tippen",
    coperto: "Gedeck",
    aggiunte: "Extras",
    burrata: "Burrata / Stracciatella",
    impasti: "Spezialteige",
    langTitle: "Sprache wählen",
  },
  es: {
    kicker: "Cocina napolitana · Florencia",
    sub: "Osteria pizzería napolitana",
    dishes: "platos",
    specialtiesTitle: "Especialidades",
    specialtiesKicker: "✦ Las especialidades de la casa ✦",
    specialtiesSub: "Lo mejor de nuestra cocina napolitana",
    discover: "Descubrir ›",
    options: "propuestas",
    swipeHint: "Desliza · toca · arrastra",
    close: "Cerrar",
    skipIntro: "Toca para entrar",
    coperto: "Cubierto",
    aggiunte: "Añadidos",
    burrata: "Burrata / stracciatella",
    impasti: "Masas especiales",
    langTitle: "Elige tu idioma",
  },
  pt: {
    kicker: "Cozinha napolitana · Florença",
    sub: "Osteria pizzaria napolitana",
    dishes: "pratos",
    specialtiesTitle: "Especialidades",
    specialtiesKicker: "✦ As especialidades da casa ✦",
    specialtiesSub: "O melhor da nossa cozinha napolitana",
    discover: "Descobrir ›",
    options: "propostas",
    swipeHint: "Deslize · toque · arraste",
    close: "Fechar",
    skipIntro: "Toque para entrar",
    coperto: "Couvert",
    aggiunte: "Adicionais",
    burrata: "Burrata / stracciatella",
    impasti: "Massas especiais",
    langTitle: "Escolha o seu idioma",
  },
  ja: {
    kicker: "ナポリ料理 · フィレンツェ",
    sub: "ナポリの食堂・ピッツェリア",
    dishes: "品",
    specialtiesTitle: "スペシャリテ",
    specialtiesKicker: "✦ 当店のスペシャリテ ✦",
    specialtiesSub: "ナポリ料理の真髄をどうぞ",
    discover: "見る ›",
    options: "品",
    swipeHint: "スワイプ・タップ・ドラッグ",
    close: "閉じる",
    skipIntro: "タップして入る",
    coperto: "席料(コペルト)",
    aggiunte: "追加トッピング",
    burrata: "ブッラータ / ストラッチャテッラ",
    impasti: "特製生地",
    langTitle: "言語を選択",
  },
  ar: {
    kicker: "المطبخ النابولي · فلورنسا",
    sub: "أوستيريا وبيتزيريا نابولية",
    dishes: "أطباق",
    specialtiesTitle: "التخصصات",
    specialtiesKicker: "✦ تخصصات المطعم ✦",
    specialtiesSub: "أفضل ما في مطبخنا النابولي",
    discover: "اكتشف ›",
    options: "أصناف",
    swipeHint: "اسحب · انقر · حرّك",
    close: "إغلاق",
    skipIntro: "انقر للدخول",
    coperto: "رسوم الخدمة",
    aggiunte: "إضافات",
    burrata: "بوراتا / ستراتشاتيلا",
    impasti: "عجينة خاصة",
    langTitle: "اختر لغتك",
  },
  ru: {
    kicker: "Неаполитанская кухня · Флоренция",
    sub: "Неаполитанская остерия-пиццерия",
    dishes: "блюд",
    specialtiesTitle: "Фирменные блюда",
    specialtiesKicker: "✦ Фирменные блюда ✦",
    specialtiesSub: "Лучшее из нашей неаполитанской кухни",
    discover: "Открыть ›",
    options: "вариантов",
    swipeHint: "Свайп · тап · перетаскивание",
    close: "Закрыть",
    skipIntro: "Нажмите, чтобы войти",
    coperto: "Плата за обслуживание",
    aggiunte: "Добавки",
    burrata: "Бурата / страчателла",
    impasti: "Специальное тесто",
    langTitle: "Выберите язык",
  },
};
