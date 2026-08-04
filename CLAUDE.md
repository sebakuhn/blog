# Sebastian's Blog – Projektkontext

## Ziel
Persönlichen Blog von sebakuhn.notion.site auf ein eigenes Frontend migrieren.
Notion bleibt das CMS, das Frontend wird unabhängig gehosted.

## Stack
- **Framework:** nextjs-notion-starter-kit (React-Notion-X + Next.js)
- **Hosting:** Vercel (kostenlos)
- **Datenquelle:** Notion API (kein Notion Pro erforderlich)
- **Repo:** github.com/sebakuhn/blog (Push auf `main` → Vercel deployt automatisch)

## Notion
- Root Page ID: `17246312895c814e8219d8d801a40cdc`
- Root Page URL: https://www.notion.so/Hallo-Ich-bin-Sebastian-Kuhn-17246312895c814e8219d8d801a40cdc
- Kategorien: Musik & Kultur, Politik & Gesellschaft, Daten/Statistik & KI
- Aktuell publiziert via: sebakuhn.notion.site (soll abgelöst werden). Die Domain `sebakuhn.de`
  liegt bei IONOS und leitet momentan noch dorthin weiter.

## site.config.ts – Ist-Stand
```typescript
rootNotionPageId: '17246312895c814e8219d8d801a40cdc'
rootNotionSpaceId: null
name: 'Sebastian Kuhn'
domain: 'blog-one-sage.vercel.app'   // beim Umzug auf 'sebakuhn.de' -> danach neu builden
author: 'Sebastian Kuhn'
description: 'Blog über Musik & Kultur, Politik & Gesellschaft, Daten & KI'
navigationStyle: 'custom'            // + navigationLinks: Blog / Über mich / Kontakt
```
**Ungenutzte Social-Felder bleiben auskommentiert, nicht `null`.** `twitter: null` bricht den Build
ab (`TS2322`) – Details unter "Behobene Fixes".

## Umgebungsvariablen
**Es ist keine einzige Env-Variable nötig** – auch nicht auf Vercel.

Das Projekt nutzt `notion-client` (die *inoffizielle* Notion-API, `lib/notion-api.ts`) und liest
öffentlich geteilte Seiten ohne Token. `NOTION_API_SECRET` wird **nirgends im Code gelesen**
(verifiziert per Grep über das ganze Repo) – der Eintrag in `.env.local` ist wirkungslos und kann
raus. Ein `secret_*`-Token einer offiziellen Notion-Integration würde hier ohnehin nicht passen,
notion-client erwartet `token_v2`. Voraussetzung ist stattdessen, dass die Root Page in Notion
öffentlich geteilt ist ("Share to web").

Optional, alle nicht gesetzt: `NOTION_API_BASE_URL` (Proxy), `NEXT_PUBLIC_FATHOM_ID` /
`NEXT_PUBLIC_POSTHOG_ID` (Analytics), `REDIS_*` (Cache), `NEXT_PUBLIC_SITE_CONFIG` (Config-Override).
`VERCEL_URL` / `VERCEL_ENV` setzt Vercel selbst.

## Design-Ziele
- Kein generischer Notion-Look
- Sauber, editorial, typografisch stark
- Drei Kategorien sollen klar erkennbar sein
- [x] Font: **Familjen Grotesk**, eine Familie für alles (Wortmarke, Überschriften, Fließtext).
      Hierarchie über Gewicht (600 für Überschriften) und Größe, bewusst *keine* zweite Schrift.
      Geladen über `next/font/google` in `lib/fonts/site-fonts.ts` – wird beim Build self-hosted,
      zur Laufzeit kein Request an Google.
- [x] Farbschema: aus dem persönlichen Design-Konzept, siehe unten.

### Farbsystem
Single Source of Truth ist `styles/theme.css` (alle 5 Ramps + Neutralpalette als CSS-Variablen).
Die Werte stammen aus **`D:\analytics_ai\ds_projects\blog\Personal Design Concept 33746312895c80efbcbefd318dee2b30.md`**
(Notion-Export) – bei Änderungen dort mitziehen. Kern: Purple `#5D2A9D` als Signature-Farbe,
warme Neutrals (`#FAFAFA` … `#1E1D1B`). Purple liegt auf Links, Zitatstrich, Karten-Oberkante
und Textauswahl; im Dark Mode auf `#A87EDB` aufgehellt.

Das Konzept gilt projektübergreifend (auch für die ggplot2-Arbeiten), nicht nur für den Blog.

**Kategoriefarben werden in Notion gesetzt, nicht im CSS.** react-notion-x rendert die Tag-Pills
mit Notions eigener Farbklasse (`notion-item-<farbe>`) und bietet keinen Hook auf den Tag-Text –
per CSS ist „Musik → Coral" nicht adressierbar. `theme.css` gibt den Pills deshalb nur die
typografische Behandlung (Versalien, Sperrung, Größe). **Dort niemals `background` oder `color`
setzen**, das würde die in Notion gewählten Farben überschreiben.

## Setup-Checkliste
- [x] Node.js >= 18 installiert
- [x] Repo geklont
- [x] `pnpm install` durchgelaufen (pnpm via `npm install -g pnpm`; PowerShell braucht `& "$env:APPDATA\npm\pnpm.cmd"`)
- [x] ~~`.env.local` mit Notion API Secret angelegt~~ (nicht nötig, s. Umgebungsvariablen)
- [x] `site.config.ts` angepasst
- [x] `pnpm dev` läuft lokal (http://localhost:3000)
- [x] Vercel deployment eingerichtet (https://blog-one-sage.vercel.app)
- [x] Custom Design: Font + Farbsystem stehen (`styles/theme.css`, `lib/fonts/site-fonts.ts`)

## Aktueller Status
Live auf Vercel: **https://blog-one-sage.vercel.app** (Projekt `seba25/sebakuhn`, Branch `main`,
Auto-Deploy bei Push). `next` 16.2.12, `next build` grün (18 Seiten), `tsc --noEmit` und ESLint sauber.

Nach dem ersten Deploy gegen die Live-URL verifiziert: robots.txt, Canonical, `og:url`, RSS (9 Items
mit korrekten Links) zeigen alle auf die konfigurierte Domain; `/api/social-image` liefert 200 (PNG,
26 kB) – das befürchtete Edge-Function-Size-Limit hat *nicht* zugeschlagen.

**Vercel vergibt `.vercel.app`-Subdomains nicht mehr manuell.** Der Dialog unter Settings → Domains
sucht nur noch *kaufbare* Domains; `sebakuhn.vercel.app` ließ sich nicht zuweisen. Auch das Umbenennen
des Projekts (`blog` → `sebakuhn`) ändert die bereits vergebene Deployment-Domain nicht – `blog-one-sage`
ist ein zufällig generierter Name. Deshalb steht `domain` in `site.config.ts` auf `blog-one-sage.vercel.app`.

### Behobene Fixes (alle verifiziert)
- **Build war kaputt:** `twitter: null` in `site.config.ts` brach `next build` ab (`TS2322`). Ursache: in
  `lib/site-config.ts` sind die Social-Felder als `twitter?: string` deklariert, also *nicht* nullable –
  im Gegensatz zu `rootNotionSpaceId`/`defaultPageIcon`/… die explizit `| null` erlauben. Deshalb schlug
  nur `twitter` fehl. Ungenutzte Social-Felder werden hier auskommentiert (Konvention wie `newsletter`/`youtube`).
  **Das hätte das Vercel-Deployment scheitern lassen.**
- **Dark-Mode-Hydration:** `components/NotionPage.tsx` rendert Dark Mode erst nach dem Mount
  (`hasMounted`-Gate); SSR liefert immer `light-mode`, der Client übernimmt die echte Präferenz danach.
  Kurzes Aufblitzen bei Dark-Mode-Systemen möglich. (`Footer.tsx` und `NotionPageHeader.tsx` hatten
  bereits eigene `hasMounted`-Gates.)
- **Reihenfolge der Blog-Gallery:** `notion.getPage()` liefert `collection_query`-Ergebnisse in einer von
  der Notion-View abweichenden, teils veralteten Reihenfolge. `sortCollectionQueryResults` in
  `lib/notion.ts` sortiert nach dem `query2.sort` der Collection-View nach (aktuell "Publication Date"
  absteigend). Wichtig: läuft **nach** `mergeRecordMaps`, das `collection_query` sonst wieder ersetzt;
  nutzt `getBlockValue` (die Notion-API hat zwei Nesting-Varianten, hartkodiertes `.value.value` würde
  still ins Leere greifen); behandelt `created_time`/`last_edited_time` (liegen am Block, nicht in
  `properties`) und sortiert Zahlen numerisch statt lexikografisch.
- **RSS-Feed war komplett leer (0 Einträge):** zwei Bugs in `pages/feed.tsx`. (1) Der Filter verglich
  `getBlockParentPage(...)?.id` gegen die Root-Page – bei Collection-Kindern liefert das aber `undefined`,
  also fiel *jeder* Post raus. Jetzt dieselbe Bedingung wie `components/NotionPage.tsx` (`type === 'page'
  && parent_table === 'collection'`). (2) Gelesen wurden `'Last Updated'`/`'Published'`/`'Description'` –
  existieren alle nicht, die Property heißt **`Publication Date`**. Jeder Eintrag bekam dadurch
  `new Date()` = Build-Zeit. Fallback ist jetzt `block.created_time`, Items werden nach Datum sortiert.

  Beides ist **bewusst projektspezifisch** und gehört nicht upstream: Der Maintainer hat zur Filterlogik
  in Issue #303 geschrieben, sie sei "really subjective logic", man solle Bedingungen nach Bedarf
  entfernen. Und `'Publication Date'` ist der Name in *unserer* Notion-DB. Bei Schema-Änderungen in Notion
  muss diese Zeile mitgezogen werden.
- **Umlaut-URLs:** `normalizeTitle` aus notion-utils *löscht* Nicht-ASCII statt zu transliterieren
  ("Über mich" → `ber-mich`, "Fünf" → `fnf`). `lib/get-canonical-page-id.ts` transliteriert jetzt
  ü→ue/ö→oe/ä→ae/ß→ss, strippt Diakritika und kollabiert doppelte Bindestriche. Eine manuelle
  `Slug`-Property in Notion hat weiterhin Vorrang. Erzeugung *und* Auflösung laufen durch diese Funktion,
  bleibt also konsistent.

  **Falle – NFKD nicht global anwenden.** Der erste Versuch normalisierte den ganzen Titel per NFKD und
  hat damit nicht-lateinische Schriften zerstört: Hangul-Silben zerfallen in Jamo, die `normalizeTitle`
  danach komplett verwirft (→ **leerer Slug**, Seite bekommt nur noch die nackte ID), und bei japanischen
  Kana wird das Dakuten abgetrennt ("ページ" → "ヘーシ"). Die Zerlegung ist deshalb auf die lateinischen
  Blöcke `U+00C0–U+024F` beschränkt. Bei Änderungen an der Funktion gegen CJK/Hangul gegentesten, nicht
  nur gegen Deutsch.
- **Analytics entfernt:** `posthog-js` + `fathom-client` waren in `pages/_app.tsx` **statisch** importiert
  (nur `init()` war per Env-Var gated), landeten also im Client-Bundle obwohl unbenutzt – inkl. der
  einzigen kritischen CVE (`protobufjs`-RCE) plus 5 high / 18 moderate. Raus aus `_app.tsx`,
  `lib/config.ts`, `package.json`; per Bundle-Grep verifiziert.
- **`lib/types.ts:1`:** `import type { ParsedUrlQuery }` statt `import { type ... }` – wegen
  `verbatimModuleSyntax` zog das Edge-Bundle von `/api/social-image` sonst ein Node-Builtin.
- **Datumsangaben waren durchgängig englisch** („Feb 11, 2026"). `notion-utils`' `formatDate`
  kodiert `en-US` fest ein. `components/NotionPage.tsx` hatte zwar schon einen
  `propertyDateValue`-Override, der prüfte aber auf eine Property namens **`Published`** – die es
  in unserer Datenbank nicht gibt (sie heißt `Publication Date`), also griff er nie. Exakt
  dieselbe Falle wie beim leeren RSS-Feed. Jetzt formatiert `lib/format-date-de.ts` jedes
  Datums-Property auf Deutsch, ohne Namensabgleich – damit auch auf den Collection-Karten, die
  ohne `pageHeader` rendern. Gelesen wird in **UTC**: Notion speichert reine Datumswerte als
  `YYYY-MM-DD` ohne Zeitzone, lokale Formatierung schöbe sie westlich von UTC einen Tag zurück.
  Dazu `<Html lang='en'>` → `lang='de'` in `pages/_document.tsx`.
- **Profilbild auf der Startseite war oben und unten abgeschnitten.** Notion speichert den Block mit
  `block_aspect_ratio: 1`, `block_preserve_scale: true` und `image_edit_metadata.mask: 'Circle'`.
  react-notion-x wertet **nichts davon** aus: Es zieht die Box auf die volle Spaltenbreite (434px),
  behält aber die gespeicherte Höhe (320px), und `object-fit: cover` beschneidet das quadratische
  Bild (915×915) entsprechend. Die Regel in `styles/theme.css` stellt das Quadrat wieder her und
  baut die Kreismaske nach.

  **Die Regel hängt an der Block-ID** (`notion-block-17246312895c810eb8f3c53cf40841f2`) – die Maske
  taucht im Markup nicht auf, es gibt also keinen generischen Selektor. Wird das Bild in Notion
  gelöscht und neu eingefügt, ändert sich die ID und die Regel läuft ins Leere; sie bricht dann
  nichts, das Bild ist nur wieder beschnitten. Gleiches gilt für jedes weitere kreisförmig
  maskierte Bild – das braucht jeweils eine eigene Zeile.
- **Wortmarken-Selektor traf auch den ersten Navigationslink.** `.notion-header
  .breadcrumb:first-child` matcht jedes `.breadcrumb`, das erstes Kind seines Elternelements ist –
  und `.notion-nav-header-rhs` trägt die Klasse `breadcrumbs` ebenfalls. „Blog" bekam dadurch
  Größe und Gewicht der Wortmarke. Jetzt über
  `.breadcrumbs:not(.notion-nav-header-rhs) > .breadcrumb` eingegrenzt.
- **`--notion-font` wurde in `styles/global.css` auf `body` deklariert.** Eine Deklaration auf
  `body` schlägt eine von `:root` geerbte, also fiel die ganze Seite still auf die System-Schrift
  zurück, obwohl `theme.css` die Variable korrekt setzte. Im Code unsichtbar, nur im Rendering.
  Die Deklaration in `global.css` ist entfernt, `font-family: var(--notion-font)` bleibt dort.
- **Notion-Variablen gehören auf `:root` und `.dark-mode`, nicht auf `.notion`.** Genau dort
  deklariert react-notion-x sie. Auf `.notion` beschränkte Overrides lassen alles *außerhalb* des
  Wrappers auf Notions Defaults stehen – Ladebildschirm und 404 blieben auf `#2f3437` statt
  `#1E1D1B`.
- **`next/font` lässt sich nicht in `_document` anwenden.** `<Html className={font.variable}>`
  setzt zwar die Klasse, das zugehörige Stylesheet wird aber nicht eingebunden: `--font-sans` war
  in Produktion leer (im Dev-Server fiel es nicht auf). Die Font wird deshalb in `pages/_app.tsx`
  importiert – das erzeugt die `@font-face`-Regeln – und die Variable dort über ein schlichtes
  `<style>` in `next/head` auf `:root` gesetzt. **Kein `<style jsx global>`**: Turbopack kann
  `styled-jsx/style.js` nicht auflösen und warnt bei jedem Build.
- **Notion blockt Requests ohne Browser-User-Agent (403).** Der Build brach beim allerersten
  `getPage` ab – Notions Cloudflare antwortete mit einer **HTML**-Fehlerseite, nicht mit einem
  JSON-API-Fehler. notion-client schickt keinen User-Agent. Von Hand gegengeprüft: derselbe POST auf
  `/api/v3/loadPageChunk` liefert ohne den Header 403 und mit ihm 200 – bei unverändert öffentlich
  geteilter Seite. Die Freigabe war also nie das Problem, und der Fehler hätte auch jeden
  Vercel-Build getroffen. Der Header sitzt in `lib/notion-api.ts` am **Konstruktor**, nicht am
  einzelnen Aufruf: `fetch()` in notion-client merged
  `{...this._ofetchOptions?.headers, ...ofetchOptions?.headers}`, damit überlebt er das per-Call
  `ofetchOptions` aus `lib/get-site-map.ts` und gilt auch für `getCollectionData` /
  `getSignedFileUrls` / `search`.
- **429 beim Prerendering.** `next build` rendert alle Seiten parallel vor (hier 12 Worker) und lief
  damit in Notions Rate Limit; der Export brach ab. ofetch führt `429` zwar in seinen
  `retryStatusCodes`, setzt `retry` bei POST aber auf 0, weil die Methode nicht idempotent ist –
  diese Lesezugriffe sind gefahrlos wiederholbar. Jetzt `retry: 5` mit linearem Backoff 1s→5s.
  ofetch rekursiert mit `retry: retries - 1`, `retryDelay` sieht also den aktuellen Reststand.
- **`kyOptions` war ein toter Name.** notion-client ist mit 7.10 von `ky` auf `ofetch` umgestiegen und
  hat die Option in `ofetchOptions` umbenannt. Unter dem alten Namen fiel das 30-Sekunden-Timeout in
  `lib/get-site-map.ts` still unter den Tisch – kein Fehler, nur wirkungslos. `FetchOptions` von
  ofetch 1.5.1 kennt `timeout?: number`, der Wert greift jetzt.
- **Mastodon wurde nirgends gerendert.** `mastodon` stand in `site.config.ts`, wurde in
  `lib/config.ts` gelesen, und endete im Nichts: weder `components/PageSocial.tsx` noch
  `components/Footer.tsx` hatten einen Eintrag, `lib/icons/` kein Icon. Sogar der Helper
  `getMastodonHandle()` war exportiert, aber von keiner Stelle aufgerufen. Übrig war nur eine
  verwaiste `.mastodon:hover`-Regel in `components/styles.module.css`. Jetzt in beiden Komponenten
  ergänzt, Icon in `lib/icons/mastodon.tsx`.

  **Der href kommt direkt aus `config.mastodon`**, nicht aus einem zusammengebauten Handle: Mastodon
  ist föderiert, die Instanz steckt in der URL. `getMastodonHandle()` liefert die kanonische Form
  `@name@instanz` und wird nur fürs `title`-Attribut benutzt. Der Footer-Link trägt zusätzlich
  `rel='me'` – damit lässt sich das Profil in Mastodon als verifiziert markieren.

### Kategorien sind im Frontend nicht klickbar
Auf `sebakuhn.notion.site` öffnet ein Klick auf eine Kategorie-Pill eine gefilterte Ansicht. Das ist
Funktionalität der Notion-App und steckt nicht in den Daten, die die API liefert: react-notion-x
rendert Multi-Select-Werte als stumpfes `<div class="notion-property-multi_select-item
notion-item-<farbe>">`, ohne `<a>`, ohne `onClick`.

Geplanter Weg (Stand 04.08.2026), bewusst **ohne** eigenen Datenlayer:
1. [x] In Notion je eine Seite pro Kategorie als direktes Kind der Root Page, Inhalt jeweils eine
   *verlinkte Ansicht* der bestehenden Blog-Datenbank, gefiltert auf `Tags`. Am einfachsten die
   Seite „Blog" duplizieren und nur den Filter ergänzen – dabei darf die Datenbank **nicht**
   mitkopiert werden, sonst werden Beiträge doppelt gepflegt.
   Erledigt, die Seiten bauen durch: `/musik-kultur`, `/politik-gesellschaft`, `/daten-statistik-ki`.
2. Im Code nur ein `propertySelectValue`-Override in `components/NotionPage.tsx` (gleiches Muster
   wie `propertyDateValue`/`propertyTextValue`, registriert in `notionRendererComponents`), der die
   Pill in einen Link auf die jeweilige Kategorieseite hüllt. Bei drei Kategorien ist die Zuordnung
   Tag → Page-ID eine Konstante, keine Slug-Mechanik.

Dabei beachten: Das `notion-item-<farbe>` muss am inneren `div` bleiben, sonst sind die in Notion
gesetzten Kategoriefarben weg. Und der Override greift für *jedes* Select-Property, also auf
`schema.name === 'Tags'` prüfen.

`/blog` bleibt als ungefilterte Gesamtübersicht bestehen, die Kategorieseiten kommen **nicht** ins
Menü – sie sind das Ziel der Pills.

Die Alternative wäre eine eigene Route `pages/tag/[tag].tsx` gewesen. Der Datenteil wäre überschaubar
(`pages/feed.tsx:41-73` macht die Schleife bereits), aber die Darstellung müsste die Gallery-Karten
samt `preview_images` von Hand nachbauen. Deshalb verworfen.

### Bundler: Dev läuft auf Webpack
`package.json` nutzt `next dev --webpack`. Next 16 nutzt sonst Turbopack, und dessen **Dev-Overlay** meldet
für die Collection-/Gallery-Blöcke einen Hydration-Mismatch (`<hr>` vs `<div>`), der im **Produktions-Build
nicht auftritt** (per `next build` + `next start` gegengeprüft, Konsole sauber). Also ein Turbopack-
Diagnostik-Artefakt, kein echter Bug. Achtung: `next build` nutzt weiterhin Turbopack – Vercel baut so,
und genau deshalb ist ein Prod-Build die verlässliche Prüfung, nicht das Dev-Overlay.

### Offene Punkte

**In Notion zu erledigen** (Sebastian, Stand 03.08.2026 zugesagt):
- [ ] Kategoriefarben der Tags setzen (bewusst dort, nicht im CSS – s. Farbsystem)
- [ ] Impressum auf der Kontakt-Seite: Normverweise aktualisieren – **§ 5 TMG** → seit 14.05.2024
      **§ 5 DDG**, **§ 55 Abs. 2 RStV** → seit 2020 **§ 18 Abs. 2 MStV**. Der „Hinweis zur
      Datenverarbeitung" ist ein Einzeiler und keine Datenschutzerklärung nach Art. 13 DSGVO.
      (Sachhinweis, keine Rechtsberatung.)
- [ ] Copyright-Zeilen in den Notion-Seiten sind fest eingetippt und driften: Startseite „2026",
      Kontakt-Seite „2025". Die Fußzeile des Frontends rechnet dagegen mit `new Date()`.

**Im Code:**
- [ ] Notion Buttons → verlinkten Text ersetzen (react-notion-x rendert Button-Blöcke nicht korrekt;
      auf der Live-Seite als graue Kästchen mit Aufschrift "Button" sichtbar)
- [ ] Umzug auf `sebakuhn.de` (s. Nächster Schritt) – bewusst ans Ende geschoben, erst nach dem Design
- [ ] Lange Artikeltitel stehen zentriert über bis zu vier Zeilen (`.notion-title` in
      `styles/notion.css` hat `text-align: center`). Linksbündig wäre ruhiger – noch nicht entschieden.
- [ ] Kategorie-Pills klickbar machen – s. Kasten „Kategorien sind im Frontend nicht klickbar"
- [ ] Restliche Advisories sind **nicht selbst behebbar** – alle stecken in Abhängigkeiten fremder
      Pakete: `postcss` (3×, in `next` selbst), `js-cookie` (via `react-use`), `sharp` (via
      `lqip-modern`, nur Build-Zeit für Preview-Bilder), `@babel/core` (low, via `styled-jsx`).
      Nur mit Upstream-Updates lösbar, gelegentlich `pnpm audit --prod` gegenprüfen.

### Navigation: Titel stehen im Code, nicht in Notion
`navigationLinks` in `site.config.ts` enthält **fest eingetragene Titel und Page-IDs**. Der Titel
folgt der Notion-Seite *nicht*: Wird die Seite in Notion umbenannt, steht im Menü weiterhin der alte
Text. Wird sie gelöscht und neu angelegt, ändert sich ihre ID und der Link läuft ins Leere. Beides
muss hier von Hand nachgezogen werden.

Aktuell verlinkt:

| Menü                | Page-ID                            | Pfad                  |
| ------------------- | ---------------------------------- | --------------------- |
| Blog                | `17246312895c81298d9dc48ee00cf5f2` | `/blog`               |
| Über mich           | `17246312895c81e38fddc89fd9ab11aa` | `/ueber-mich`         |
| Kontakt & Impressum | `17246312895c81dcbe88ee2269e0cd0b` | `/kontakt-impressum`  |

Der **Pfad** folgt dagegen sehr wohl dem Notion-Titel – er wird von `getCanonicalPageId` aus ihm
gebaut. Beim Umbenennen von „Kontakt" auf „Kontakt & Impressum" ist `/kontakt` deshalb weggefallen.
Wer eine URL festnageln will, setzt in Notion eine `Slug`-Property; die hat Vorrang
(`lib/get-canonical-page-id.ts:75`).

Bewusst nicht verlinkt: `/blog-posts` – sieht nach einer internen Datenbank-Ansicht aus.
Page-IDs findet man über `pageProps.pageId` im `__NEXT_DATA__` der jeweiligen Seite.

## Nächster Schritt
Design steht (Font + Farbsystem), Navigation und Fußzeile sind eingerichtet. Als Nächstes die
Notion-Aufgaben oben (Kategoriefarben, Impressum), dann die offene Frage zu den zentrierten Titeln,
danach der **Umzug auf sebakuhn.de**. Das Deployment aktualisiert sich bei jedem Push auf `main`
von selbst.

### Danach: Umzug auf sebakuhn.de
Die Domain liegt bei **IONOS** und leitet aktuell auf die alte `sebakuhn.notion.site` weiter. Bewusst
ans Ende gelegt, damit die alte Seite bis zum Schluss erreichbar bleibt. Ablauf:
1. IONOS: Weiterleitung auflösen und auf "DNS verwalten" umstellen – solange die Domain als
   Weiterleitung konfiguriert ist, blockiert das die DNS-Einträge.
2. Vercel: Settings → Domains → `sebakuhn.de` + `www.sebakuhn.de` hinzufügen. Die anzulegenden
   Records **aus dem Dashboard** übernehmen, nicht aus Tutorials – Vercels IPs haben sich geändert.
3. Records bei IONOS eintragen, TLS macht Vercel automatisch.
4. `domain: 'sebakuhn.de'` in `site.config.ts` + neu deployen. **Kein Kosmetik-Schritt:** die Domain
   wird in Canonical-URLs, `og:image`, RSS und Sitemap ins statische HTML gebacken, ein Vercel-Alias
   allein genügt nicht.

Bewusst nicht getan: Bis zum Umzug läuft die `.vercel.app`-URL crawlbar (`pages/robots.txt.tsx:22`
schaltet bei `VERCEL_ENV === 'production'` auf `Allow: /`), parallel zur weitergeleiteten Notion-Seite.
Für die wenigen Tage als Duplicate-Content-Risiko akzeptiert – eine frische, unverlinkte URL indexiert
Google in dem Zeitraum praktisch nicht.

## Fork / Upstream
Das Repo ist ein Fork von `transitive-bullshit/nextjs-notion-starter-kit` (582 Commits, davon nur ~14
eigene). Remotes: `origin` = eigenes Repo, `upstream` = Original (Push dort lokal auf `DISABLED` gesetzt,
nur noch `git fetch upstream` möglich).

Achtung: `normalizeTitle` und `getCanonicalPageId` liegen **nicht** im Starter-Kit, sondern in
`NotionX/react-notion-x` (Paket `notion-utils`) – zwei verschiedene Repos, gleicher Maintainer.

Stand der Umlaut-Frage upstream (geprüft 08/2026): Issue #422 ist geschlossen, der zugehörige PR #423
("add transliteration module") ist **seit Januar 2023 offen**. Er ersetzt `normalizeTitle` komplett durch
generisches `slugify` und würde damit die CJK-Unterstützung zerstören, die extra wegen Issue #176 ergänzt
wurde – vermutlich der Grund für den Stillstand. Beide Repos sind aktiv (Merges bis Mai 2026).

## Hinweise / Learnings
- isRedisEnabled: false lassen (kein Redis-Setup nötig; `lib/db.ts` fällt auf In-Memory-Keyv zurück,
  kein Crash, keine Env-Var)
- isPreviewImageSupportEnabled: true lassen (bessere UX)
- pageUrlOverrides vorerst null lassen
- **Vor jedem Deploy `pnpm build` laufen lassen.** `pnpm dev` und `tsc` allein reichen nicht: der
  `twitter: null`-Fehler war erst im Build sichtbar. Und Turbopack-Dev-Overlay-Fehler sind nicht
  automatisch echt – gegen `next build` + `next start` prüfen.
- Notion-Property-Namen im Code müssen exakt zum Datenbank-Schema passen. Ist-Stand des Schemas:
  `Titel` (title), `Publication Date` (date), `Tags` (multi_select), `Featured Image` (file).
  `getPageProperty` gibt bei falschem Namen still `null` zurück – daher der leere RSS-Feed.
- Die 247-kB-Page-Data-Warnung ist inhärent (233 kB davon der `block`-Teil des recordMap, den
  react-notion-x clientseitig zum Hydrieren braucht). Nicht sinnvoll reduzierbar, kein Blocker.
- `next/legacy/image` ist deprecated; react-notion-x unterstützt auch `nextImage`. Wechsel möglich
  (`NotionPage.tsx` Z. 3 + `nextLegacyImage:` → `nextImage:`), aber `fill` verhält sich anders als
  `layout="fill"` – visuell nachprüfen. Kein Handlungsdruck.
- **Dependency-Pflege:** gelegentlich `pnpm update && pnpm audit --prod && pnpm build`. `--prod` ist
  entscheidend – das volle Audit meldet ~31 Funde, davon der Großteil in der ESLint-Toolchain, die
  nie im Bundle landet. Was übrig bleibt, steckt in Fremdpaketen und ist nur über deren Releases zu
  beheben. Notnagel wäre `pnpm.overrides` in `package.json` (erzwingt eine Version quer durch den
  Baum, am Maintainer vorbei) – kann Dinge brechen, nur mit Build-Check danach.
- Advisory-Schweregrade nicht ungeprüft übernehmen: `postcss`/`@babel/core`/`sharp` laufen hier nur
  zur **Build-Zeit** über eigenen Input, `js-cookie` läuft im Browser, aber die Seite hat weder Login
  noch Session-Cookies. Statischer Blog ohne Nutzerdaten = kaum Angriffsfläche.
- `pnpm audit` beendet sich mit **Exit-Code 1**, sobald irgendein Fund existiert – das ist kein
  Werkzeugfehler und taugt hier nicht als CI-Gate.
- pnpm-JSON-Ausgaben (`--json`) haben ein **UTF-8-BOM**; `JSON.parse` scheitert daran. Vor dem
  Parsen `.replace(/^﻿/, '')`.
