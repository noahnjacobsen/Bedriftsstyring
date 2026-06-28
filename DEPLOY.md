# Legg appen på nett (Vercel) – steg for steg

Denne guiden setter opp appen **gratis på Vercel med kun testdata**, men
produksjonsklar slik at du enkelt kan bytte til ekte kundedata senere.

> **Viktig om gratis vs. ekte data:**
> Vercels gratisplan (Hobby) er for **privat/ikke-kommersiell** bruk, og du har
> ikke databehandleravtale (DPA) der. Derfor: **kun fiktive testdata på den gratis
> versjonen.** Ekte kundedata krever Vercel Pro + DPA + EU-region (se nederst).

---

## Du trenger
- En **GitHub**-konto og en **Vercel**-konto (du har begge fra investeringsjournalen).
- Din **Anthropic API-nøkkel** (samme som journalen bruker).

## 1. Legg koden på GitHub (privat repo)
Appen er allerede et git-repo. Opprett et **privat** repo på GitHub og push:

```bash
cd ~/Desktop/clm-app
# Bytt ut <brukernavn>:
git branch -M main
git remote add origin https://github.com/<brukernavn>/bedriftsstyring.git
git push -u origin main
```
(Hemmeligheter som `.env.local` blir IKKE pushet – de er git-ignorert.)

## 2. Importer til Vercel
- Vercel → **Add New… → Project** → velg GitHub-repoet → **Import**.
- Framework oppdages automatisk (Next.js). Ikke deploy ennå – gjør steg 3 og 4 først.

## 3. Legg til database (Postgres, EU-region)
- I prosjektet på Vercel: **Storage → Create Database → Postgres (Neon)**.
- Velg **region i EU** (f.eks. Frankfurt). Dette setter `DATABASE_URL` automatisk.

## 4. Sett miljøvariabel
- **Settings → Environment Variables**: legg til
  `ANTHROPIC_API_KEY` = din nøkkel (`sk-ant-…`).

## 5. Klargjør databasen (én gang)
Kopier Neon-tilkoblingsstrengen fra Vercel (Storage → databasen → `.env.local`-fanen)
og kjør lokalt:

```bash
cd ~/Desktop/clm-app
# Lim Neon-URL-en inn i .env.local:
echo 'DATABASE_URL="postgresql://…din-neon-url…"' >> .env.local

npm run db:push     # oppretter tabellene i sky-databasen
npm run db:seed     # legger inn FIKTIVE testdata
# Opprett de to eierne med STERKE passord (minst 12 tegn):
OWNER_USERNAME=eier1 OWNER_NAME="Eier 1" OWNER_PASSWORD='langt-unikt-passord-1' npm run db:owner
OWNER_USERNAME=eier2 OWNER_NAME="Eier 2" OWNER_PASSWORD='langt-unikt-passord-2' npm run db:owner
```

## 6. Deploy og test på telefonen
- Trykk **Deploy** i Vercel. Du får en URL (`https://…vercel.app`).
- Åpne den på telefonen, logg inn, og bruk **«Legg til på Hjem-skjerm»** for et app-ikon.

---

## Hva er sikret (industrielt baseline)
- HTTPS tvunget (HSTS) + hardede sikkerhetsheadere (CSP, anti-clickjacking m.m.).
- Innlogging med scrypt-hashede passord, httpOnly-sesjonscookie, **ingen standardpassord**.
- **Kontosperre** etter gjentatte feilforsøk (brute-force-vern).
- AI-endepunktet krever innlogging + har **daglig kvote** og opprinnelsessjekk (mot misbruk/kostnad).
- PDF-er lagres i databasen (maks 4 MB), ingen offentlig fil-URL.

> Anbefalt neste nivå: **tofaktor (2FA)**. Kan legges til uten å rive om.

---

## FØR du legger inn EKTE kundedata (GDPR)
Ekte kundenavn/-adresser/-e-poster er personopplysninger. Da må følgende på plass:
1. **Oppgrader til Vercel Pro** (kommersiell bruk er ikke tillatt på gratisplanen).
2. Bekreft **EU-region** på databasen, og godkjenn **databehandleravtale (DPA)** hos
   Vercel og Neon.
3. Ha et **lovlig grunnlag** + en kort **personvernerklæring** til kundene.
4. Verifiser med **Datatilsynet/fagperson**. *Dette er ikke juridisk rådgivning.*

### Bytte fra test- til ekte data
- Slett testdataene i databasen (eller opprett en fersk database) og legg inn ekte
  kunder via appen. Behold de sterke eier-passordene.

---

## Lokal utvikling etter overgang til Postgres
Appen bruker nå Postgres (ikke lenger lokal SQLite-fil). For å kjøre lokalt:
lim Neon-URL-en inn i `.env.local` (`DATABASE_URL=…`), så `npm run dev`.
