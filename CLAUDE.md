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
- [ ] Node.js >= 18 installiert (`node --version`)
- [ ] Repo geklont (`git clone ...`)
- [ ] `npm install` durchgelaufen
- [ ] `.env.local` mit Notion API Secret angelegt
- [ ] `site.config.ts` angepasst (siehe oben)
- [ ] `npm run dev` läuft lokal (http://localhost:3000)
- [ ] Vercel deployment eingerichtet
- [ ] Custom Design angepasst

## Aktueller Status
Setup-Phase – noch nicht gestartet

## Nächster Schritt
`npm install` ausführen, dann `.env.local` anlegen und `site.config.ts` anpassen.

## Hinweise / Learnings
- isRedisEnabled: false lassen (kein Redis-Setup nötig)
- isPreviewImageSupportEnabled: true lassen (bessere UX)
- pageUrlOverrides vorerst null lassen
