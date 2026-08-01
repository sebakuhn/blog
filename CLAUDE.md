# Sebastian's Blog – Projektkontext

## Ziel
Persönlichen Blog von sebakuhn.notion.site auf ein eigenes Frontend migrieren.
Notion bleibt das CMS, das Frontend wird unabhängig gehosted.

## Stack
- **Framework:** nextjs-notion-starter-kit (React-Notion-X + Next.js)
- **Hosting:** Vercel (kostenlos)
- **Datenquelle:** Notion API (kein Notion Pro erforderlich)
- **Repo:** github.com/DEIN-USERNAME/blog

## Notion
- Root Page ID: `17246312895c814e8219d8d801a40cdc`
- Root Page URL: https://www.notion.so/Hallo-Ich-bin-Sebastian-Kuhn-17246312895c814e8219d8d801a40cdc
- Kategorien: Musik & Kultur, Politik & Gesellschaft, Daten/Statistik & KI
- Aktuell publiziert via: sebakuhn.notion.site (soll abgelöst werden)

## site.config.ts – anzupassende Felder
```typescript
rootNotionPageId: '17246312895c814e8219d8d801a40cdc'  // Root Page ID
rootNotionSpaceId: null                                 // optional, vorerst leer lassen
name: 'Sebastian Kuhn'
domain: 'DOMAIN'                                        // z.B. sebakuhn.de oder vercel-subdomain
author: 'Sebastian Kuhn'
description: 'Blog über Musik & Kultur, Politik & Gesellschaft, Daten & KI'
twitter: null                                           // falls gewünscht eintragen
github: null
linkedin: null
navigationStyle: 'default'                             // später ggf. auf 'custom' umstellen
```

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
- [ ] Font-Wahl noch offen
- [ ] Farbschema noch offen

## Setup-Checkliste
- [x] Node.js >= 18 installiert
- [x] Repo geklont
- [x] `pnpm install` durchgelaufen (pnpm via `npm install -g pnpm`; PowerShell braucht `& "$env:APPDATA\npm\pnpm.cmd"`)
- [x] ~~`.env.local` mit Notion API Secret angelegt~~ (nicht nötig, s. Umgebungsvariablen)
- [x] `site.config.ts` angepasst
- [x] `pnpm dev` läuft lokal (http://localhost:3000)
- [ ] Vercel deployment eingerichtet
- [ ] Custom Design angepasst

## Aktueller Status
Lokal lauffähig, `next build` grün (18 Seiten), `tsc --noEmit` und ESLint sauber.

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
- **Umlaut-URLs:** `normalizeTitle` aus notion-utils *löscht* Nicht-ASCII statt zu transliterieren
  ("Über mich" → `ber-mich`, "Fünf" → `fnf`). `lib/get-canonical-page-id.ts` transliteriert jetzt
  ü→ue/ö→oe/ä→ae/ß→ss, strippt Diakritika und kollabiert doppelte Bindestriche. Eine manuelle
  `Slug`-Property in Notion hat weiterhin Vorrang. Erzeugung *und* Auflösung laufen durch diese Funktion,
  bleibt also konsistent.
- **Analytics entfernt:** `posthog-js` + `fathom-client` waren in `pages/_app.tsx` **statisch** importiert
  (nur `init()` war per Env-Var gated), landeten also im Client-Bundle obwohl unbenutzt – inkl. der
  einzigen kritischen CVE (`protobufjs`-RCE) plus 5 high / 18 moderate. Raus aus `_app.tsx`,
  `lib/config.ts`, `package.json`; per Bundle-Grep verifiziert.
- **`lib/types.ts:1`:** `import type { ParsedUrlQuery }` statt `import { type ... }` – wegen
  `verbatimModuleSyntax` zog das Edge-Bundle von `/api/social-image` sonst ein Node-Builtin.

### Bundler: Dev läuft auf Webpack
`package.json` nutzt `next dev --webpack`. Next 16 nutzt sonst Turbopack, und dessen **Dev-Overlay** meldet
für die Collection-/Gallery-Blöcke einen Hydration-Mismatch (`<hr>` vs `<div>`), der im **Produktions-Build
nicht auftritt** (per `next build` + `next start` gegengeprüft, Konsole sauber). Also ein Turbopack-
Diagnostik-Artefakt, kein echter Bug. Achtung: `next build` nutzt weiterhin Turbopack – Vercel baut so,
und genau deshalb ist ein Prod-Build die verlässliche Prüfung, nicht das Dev-Overlay.

### Offene Punkte
- [ ] Notion Buttons → verlinkten Text ersetzen (react-notion-x rendert Button-Blöcke nicht korrekt)
- [ ] Vercel Deployment einrichten
- [ ] Custom Domain (sebakuhn.de oder Vercel-Subdomain) festlegen und in `site.config.ts` eintragen
- [ ] Design anpassen (Font, Farben)
- [ ] `mastodon` in `site.config.ts` ist ein **toter Wert** – wird nirgends gerendert
      (`components/PageSocial.tsx` hat keinen Mastodon-Eintrag, es fehlt auch ein Icon in `lib/icons/`)
- [ ] `next` 16.2.0 → 16.2.12 (Patch-Update, räumt 15 high Advisories)
- [ ] `.bluesky`-Klasse in `components/PageSocial.module.css` fehlt (Button rendert, kein Hover-Branding)
- [ ] `kyOptions` in `lib/get-site-map.ts:36` heißt in notion-client 7.10 `ofetchOptions` → Timeout
      wird still verworfen

## Nächster Schritt
Vercel Deployment einrichten (GitHub Repo verbinden → Vercel importieren). **Keine Environment
Variable eintragen** – siehe Abschnitt Umgebungsvariablen.

Vor dem Deployment beachten:
- `domain` in `site.config.ts` muss mit der real erreichbaren Domain übereinstimmen. Sie wird in
  Canonical-URLs, `og:image`, RSS und Sitemap **ins statische HTML gebacken** – ein Vercel-Domain-Alias
  allein genügt nicht, bei Domain-Wechsel neu builden.
- `pages/api/social-image.tsx` (Edge Runtime) liegt bei ca. 1,03 MB gzip und damit am Vercel-Limit
  für den Hobby-Plan (1 MB). Falls der Deploy mit "Edge Function size exceeded" scheitert: Route
  entfernen (dann greift das Notion-Cover als OG-Bild) oder auf Node-Runtime umstellen.

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
