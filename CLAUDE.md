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

## Umgebungsvariablen (.env.local)
```
NOTION_API_SECRET=secret_XXXX    # Notion Integration Token
```
Notion Integration anlegen unter: https://www.notion.com/my-integrations
Danach die Root Page mit der Integration teilen (Share → Integration einladen).

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
- [x] `.env.local` mit Notion API Secret angelegt
- [x] `site.config.ts` angepasst
- [x] `pnpm dev` läuft lokal (http://localhost:3000)
- [ ] Vercel deployment eingerichtet
- [ ] Custom Design angepasst

## Aktueller Status
Lokal lauffähig. `pnpm install` durch, `.env.local` angelegt, `site.config.ts` angepasst, Bluesky-Support ergänzt. Hydration Warning (dark/light-mode) ist ein bekanntes Starter-Kit-Problem, kein Blocker.

Offene Punkte:
- [ ] Notion Buttons → verlinkten Text ersetzen (react-notion-x rendert Button-Blöcke nicht korrekt)
- [ ] Vercel Deployment einrichten
- [ ] Custom Domain (sebakuhn.de oder Vercel-Subdomain) festlegen und in `site.config.ts` eintragen
- [ ] Design anpassen (Font, Farben)

## Nächster Schritt
Vercel Deployment einrichten (GitHub Repo verbinden → Vercel importieren → `NOTION_API_SECRET` als Environment Variable eintragen).

## Hinweise / Learnings
- isRedisEnabled: false lassen (kein Redis-Setup nötig)
- isPreviewImageSupportEnabled: true lassen (bessere UX)
- pageUrlOverrides vorerst null lassen
