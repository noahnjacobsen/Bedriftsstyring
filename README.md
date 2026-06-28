# Bedriftsstyring (CLM + CRM + Sikkerhet)

Samlet bedriftsapp for en liten norsk tjenestebedrift (hage, vedlikehold,
bilvask, snømåking). Én app som dekker **kontrakter (CLM)**, **kunder (CRM)** og
**sikkerhet & etterlevelse** – med en innebygd **AI-risikovurdering**. Bygget for å
være enkel nok til at én person kan bruke den alene, også fra mobil ute hos kunder.

Grensesnittet er på **norsk**; koden og kommentarene er på **engelsk**.

## Funksjoner

- **Innlogging for to brukere** – passordbeskyttet (scrypt-hashede passord,
  httpOnly-sesjonscookie). De to eierne har hver sin konto.
- **Dashbord** – viser hva som trenger oppfølging: avtaler som fornyes/utløper de
  neste 30 og 60 dagene, forfalte avtaler, utkast som ikke er sendt, og kontrakter
  som venter på signatur.
- **Kontraktregister** – tabell over alle kontrakter med søk (tittel, motpart,
  e-post) og filtrering på type, status og datoperiode. På mobil vises listen som
  stablede kort.
- **Kunderegister (CRM)** – kundene er egne oppføringer med type (privat/bedrift/
  borettslag/sameie), status (prospekt/aktiv/inaktiv) og kontaktinfo. Hvert
  **kundekort** samler kontaktinfo, alle kundens kontrakter og en **aktivitetslogg**
  (samtaler, e-post, møter, notater, oppgaver). **Oppfølginger** med dato dukker opp
  på dashbordet. Kontrakter kan knyttes til en kunde.
- **Konfigurerbare kontrakttyper** – kundeavtale, ansettelseskontrakt,
  eier-/gründeravtale, leverandøravtale.
- **Statuser** – utkast, sendt, signert, aktiv, utløpt, avsluttet/oppsagt.
- **Maler** – generer nye kontrakter fra gjenbrukbare norske maler (f.eks. «Fast
  avtale – plenklipping») med utfyllingsfelt, og få et **utskriftsvennlig
  kontraktdokument** (skriv ut eller lagre som PDF fra nettleseren).
- **Filhåndtering** – last opp signert PDF til hver kontrakt.
- **Påminnelser** – kommende fornyelses-/utløpsdatoer er tydelig fargemerket
  (rød ≤ 30 dager, gul 31–60 dager).
- **Endringslogg** – enkel logg over hva som skjedde med hver kontrakt (og hvem).
- **Sikkerhet & etterlevelse** – register over sikkerhets- og lovkrav i to områder:
  *IT-sikkerhet & personvern* (tilgangsstyring, GDPR, databehandling, backup) og
  *drift, HMS & kontrakter* (HMS, forsikring, ansettelse, kundevilkår). Hvert punkt
  har ansvarlig, status, risikonivå og frist. Forfalte/høyrisiko-punkter dukker opp
  på dashbordet.
- **Risikovurdering (AI)** – «den ærlige kritikeren» ser på en situasjon, beslutning
  eller et tiltak og flagger risiko innen sikkerhet **og** juss, med konkrete
  anbefalinger og hva som bør sjekkes med fagperson. Streamer svaret, kan stille
  oppfølgingsspørsmål, og vurderinger kan lagres. Krever en `ANTHROPIC_API_KEY`
  (se under). Dette er beslutningsstøtte, ikke juridisk rådgivning.
- **Mørk modus** – lyst/mørkt tema med bryter i toppbaren. Følger systemets
  innstilling som standard og husker valget ditt.

## Teknologi

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript) – server-rendret.
- [Prisma](https://www.prisma.io/) + **PostgreSQL** (sky, f.eks. Neon i EU-region).
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) for AI-vurdering.
- Ren CSS – mobilvennlig grensesnitt. PDF via nettleserens utskrift.

## Legg på nett (telefon, overalt)

Se **[DEPLOY.md](DEPLOY.md)** for steg-for-steg utlegging på **Vercel** (gratis med
testdata, produksjonsklar), sikkerhets- og GDPR-sjekkliste.

## Kjøre lokalt

Krever [Node.js](https://nodejs.org/) 18+ (testet på Node 24) og en Postgres-database
(f.eks. en gratis Neon-database). Legg tilkoblingsstrengen i `.env.local`:

```
DATABASE_URL="postgresql://…"
ANTHROPIC_API_KEY=sk-ant-…
```

```bash
npm install
npm run db:push     # oppretter tabeller
npm run db:seed     # fiktive testdata
npm run dev         # starter appen på http://localhost:3001
```

> Lokalt kjører appen på port **3001** (ikke 3000), så den ikke kolliderer med
> investeringsjournal-appen.

### AI-risikovurdering (valgfritt)

Selve appen fungerer uten API-nøkkel, men **Risikovurdering (AI)** trenger en
Anthropic-nøkkel. Legg den i `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-…
```

Bruker modellen `claude-opus-4-8`. Start serveren på nytt etter at nøkkelen er lagt inn.

### Innlogging

Appen krever innlogging. Opprett de to eierne med **sterke passord** (gjelder både
lokalt og på nett – det finnes ingen standardpassord):

```bash
OWNER_USERNAME=eier1 OWNER_NAME="Eier 1" OWNER_PASSWORD='langt-unikt-passord' npm run db:owner
```

Kontoer låses midlertidig etter mange feil påloggingsforsøk (brute-force-vern).

> `npm install` kjører automatisk et `postinstall`-steg som genererer Prisma-klienten,
> oppretter SQLite-databasen og legger inn 7 eksempelkontrakter + 1 mal. Seedingen er
> idempotent – den hopper over hvis databasen allerede har data.

### Nyttige kommandoer

| Kommando          | Hva den gjør                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `npm run dev`     | Starter appen i utviklingsmodus på port 3001.                       |
| `npm run setup`   | Setter opp databasen på nytt og legger inn eksempeldata (idempotent). |
| `npm run seed`    | Legger inn eksempeldata (hopper over hvis data finnes).             |
| `npm run build`   | Bygger en produksjonsversjon.                                       |
| `npm start`       | Kjører produksjonsversjonen (krever `npm run build` først).         |

### Nullstille databasen

Slett databasefilen og kjør oppsettet på nytt:

```bash
rm prisma/clm.db
npm run setup
```

## Prosjektstruktur

```
prisma/
  schema.prisma     # datamodell (Contract, Template, ChangeLog, User, Session,
                    #   Customer, Activity, ControlItem, Assessment)
  seed.ts           # eksempeldata (kontrakter, mal, brukere, kunder, kontrollpunkter)
src/
  middleware.ts     # sender uinnloggede til /login
  app/
    layout.tsx                     # rot (html/body)
    login/page.tsx                 # innlogging
    (app)/                         # alle beskyttede sider (krever innlogging)
      layout.tsx                   # toppbar + auth-sjekk
      page.tsx                     # Dashbord
      kontrakter/                  # CLM: liste, ny, detalj, rediger, skriv-ut
      kunder/                      # CRM: kundeliste, ny, kundekort, rediger
      maler/                       # maler + generer kontrakt fra mal
      sikkerhet/                   # sikkerhet & etterlevelse: register + CRUD
      risikovurdering/             # AI-kritiker + lagrede vurderinger
    api/uploads/[name]/route.ts    # serverer opplastede PDF-er
    api/vurder/route.ts            # streamer AI-risikovurdering (Anthropic SDK)
  components/                      # gjenbrukbare UI-komponenter
  lib/
    auth.ts                  # passord-hashing (scrypt) + sesjoner
    auth-actions.ts          # login/logout server actions
    constants.ts             # kontrakttyper, statuser, prisenheter
    crm.ts                   # kundetyper, -statuser, aktivitetstyper
    security.ts              # områder, kategorier, statuser, risikonivå
    security-system-prompt.ts# systemprompt for «den ærlige kritikeren»
    actions.ts / crm-actions.ts / security-actions.ts  # server actions
    format.ts       # dato- og valutaformatering (nb-NO)
uploads/            # opplastede signerte PDF-er (lokalt)
```

## Data og personvern

Alt lagres lokalt i SQLite-filen `prisma/clm.db` og i `uploads/`. Ingenting sendes
til eksterne tjenester. Alle navn, adresser, telefonnumre og e-poster i eksempeldataene
er oppdiktet.

## Videre arbeid (kjekt-å-ha)

- E-postpåminnelser for fornyelser
- Eksport til CSV
- E-signering med signaturlenke
- «Endre passord»-side i appen
