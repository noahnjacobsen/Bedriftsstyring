import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

// Same scheme as src/lib/auth.ts ("salt:hash"). Inlined so the seed script
// has no dependency on Next-only modules.
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

// The two owners. Change these (and run `npm run setup`) for real use.
const users = [
  { username: "eier1", name: "Eier 1", password: "kontrakt123" },
  { username: "eier2", name: "Eier 2", password: "kontrakt123" },
];

async function seedUsers() {
  // SECURITY: never seed default-password users into a hosted database.
  // Only local SQLite (DATABASE_URL = "file:…") gets the convenience accounts;
  // on a cloud DB, create owners with strong passwords via `npm run db:owner`.
  const isLocalSqlite = (process.env.DATABASE_URL ?? "").startsWith("file:");
  if (!isLocalSqlite || process.env.NODE_ENV === "production") {
    console.log(
      "Hopper over standard-brukere (sky-/produksjonsdatabase). Bruk `npm run db:owner`.",
    );
    return;
  }
  if ((await prisma.user.count()) > 0) {
    console.log("Brukere finnes allerede – hopper over.");
    return;
  }
  for (const u of users) {
    await prisma.user.create({
      data: {
        username: u.username,
        name: u.name,
        passwordHash: await hashPassword(u.password),
      },
    });
  }
  console.log(`La inn ${users.length} brukere (passord: «kontrakt123»).`);
}

// Body for the seeded "Fast avtale – plenklipping" template.
// {{...}} placeholders are filled in when generating a contract.
const lawnTemplateBody = `AVTALE OM PLENKLIPPING

Mellom Hjem & Hage Tjenester AS (heretter «Leverandør») og {{kundenavn}}
(heretter «Kunde»), {{adresse}}.

1. OMFANG
Leverandør skal utføre plenklipping og enkel kantklipping på Kundens eiendom
i avtaleperioden. Klipping skjer {{frekvens}} gjennom sesongen
(normalt april–oktober), værforbehold tatt.

2. PRIS
Pris er kr {{pris}} per oppdrag. Beløpet faktureres månedlig etterskuddsvis.
Eventuell bortkjøring av avfall avtales særskilt.

3. PERIODE
Avtalen gjelder fra {{oppstart}} og løper for sesongen {{periode}}.
Avtalen fornyes automatisk for ny sesong med mindre den sies opp skriftlig
senest 30 dager før sesongstart.

4. KONTAKT
Kunde: {{telefon}} / {{epost}}

5. SIGNATUR
Sted/dato: ______________________

____________________________        ____________________________
Leverandør                          Kunde ({{kundenavn}})`;

const lawnTemplateFields = JSON.stringify([
  { key: "kundenavn", label: "Kundenavn", type: "text", placeholder: "Ola Nordmann" },
  { key: "adresse", label: "Adresse", type: "text", placeholder: "Gateveien 1, 0000 Sted" },
  { key: "telefon", label: "Telefon", type: "text", placeholder: "400 00 000" },
  { key: "epost", label: "E-post", type: "text", placeholder: "navn@example.no" },
  { key: "pris", label: "Pris per oppdrag (kr)", type: "text", placeholder: "650" },
  { key: "frekvens", label: "Frekvens", type: "text", placeholder: "annenhver uke" },
  { key: "oppstart", label: "Oppstartsdato", type: "date", placeholder: "" },
  { key: "periode", label: "Sesong/periode", type: "text", placeholder: "2026" },
]);

const contracts = [
  {
    title: "Fast avtale – plenklipping",
    type: "kundeavtale",
    status: "aktiv",
    counterpartyName: "Kari Nordmann",
    counterpartyPhone: "412 34 567",
    counterpartyEmail: "kari.nordmann@example.no",
    counterpartyAddress: "Slependveien 12, 1341 Slependen",
    startDate: new Date("2026-05-01"),
    endDate: new Date("2027-04-15"),
    amount: 650,
    amountUnit: "per oppdrag",
    autoRenew: true,
    notes: "Annenhver uke i sesong.",
  },
  {
    title: "Fast avtale – snømåking",
    type: "kundeavtale",
    status: "aktiv",
    counterpartyName: "Ola Hansen",
    counterpartyPhone: "905 11 223",
    counterpartyEmail: "ola.hansen@example.no",
    counterpartyAddress: "Holmenkollveien 88, 0376 Oslo",
    startDate: new Date("2025-11-01"),
    endDate: new Date("2026-08-15"),
    amount: 1200,
    amountUnit: "per måned",
    autoRenew: true,
    notes: "Snømåking ved behov gjennom vintersesongen.",
  },
  {
    title: "Bilvask – engangsoppdrag",
    type: "kundeavtale",
    status: "signert",
    counterpartyName: "Per Olsen",
    counterpartyPhone: "468 90 112",
    counterpartyEmail: "per.olsen@example.no",
    counterpartyAddress: "Trondheimsveien 45, 0560 Oslo",
    startDate: new Date("2026-06-20"),
    signedDate: new Date("2026-06-20"),
    amount: 900,
    amountUnit: "engang",
    autoRenew: false,
    notes: "Utført engangsoppdrag.",
  },
  {
    title: "Vedlikehold – montering og maling",
    type: "kundeavtale",
    status: "utkast",
    counterpartyName: "Ingrid Berg",
    counterpartyPhone: "934 55 678",
    counterpartyEmail: "ingrid.berg@example.no",
    counterpartyAddress: "Kirkeveien 30, 0364 Oslo",
    amount: 3500,
    amountUnit: "fastpris",
    autoRenew: false,
    notes: "Fastpris-estimat. Ikke sendt ennå.",
  },
  {
    title: "Fast avtale – hagestell (sesong)",
    type: "kundeavtale",
    status: "sendt",
    counterpartyName: "Sameiet Lindebakken v/ styreleder",
    counterpartyPhone: "917 22 334",
    counterpartyEmail: "styret@lindebakken-sameie.example.no",
    counterpartyAddress: "Lindeveien 5, 0584 Oslo",
    startDate: new Date("2026-07-01"),
    amount: 4500,
    amountUnit: "per måned",
    autoRenew: true,
    notes: "Sendt – venter på signatur.",
  },
  {
    title: "Fast avtale – plenklipping",
    type: "kundeavtale",
    status: "utlopt",
    counterpartyName: "Lars Johansen",
    counterpartyPhone: "458 77 901",
    counterpartyEmail: "lars.johansen@example.no",
    counterpartyAddress: "Ekebergveien 120, 1182 Oslo",
    endDate: new Date("2025-09-30"),
    amount: 600,
    amountUnit: "per oppdrag",
    autoRenew: false,
    notes: "Utløpt – kandidat for fornyelse.",
  },
  {
    title: "Snømåking og strøing (borettslag)",
    type: "kundeavtale",
    status: "aktiv",
    counterpartyName: "Borettslaget Solsiden",
    counterpartyPhone: "488 33 220",
    counterpartyEmail: "post@solsiden-borettslag.example.no",
    counterpartyAddress: "Sognsveien 210, 0863 Oslo",
    startDate: new Date("2025-10-01"),
    endDate: new Date("2026-09-01"),
    amount: 2800,
    amountUnit: "per måned",
    autoRenew: true,
    notes: "Snømåking og strøing for borettslaget.",
  },
];

function daysFromToday(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

function guessCustomerType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("borettslag")) return "borettslag";
  if (n.includes("sameie")) return "sameie";
  if (/\bas\b|bedrift|firma/.test(n)) return "bedrift";
  return "privat";
}

// Derive a CRM status from the customer's contracts.
function deriveCustomerStatus(statuses: string[]): string {
  if (statuses.some((s) => s === "aktiv" || s === "signert")) return "aktiv";
  if (statuses.some((s) => s === "sendt" || s === "utkast")) return "prospekt";
  return "inaktiv";
}

// Build CRM customers from existing contracts, link them, and add some follow-ups.
async function seedCustomers() {
  if ((await prisma.customer.count()) > 0) {
    console.log("Kunder finnes allerede – hopper over.");
    return;
  }

  const allContracts = await prisma.contract.findMany();
  const byName = new Map<string, typeof allContracts>();
  for (const c of allContracts) {
    if (!byName.has(c.counterpartyName)) byName.set(c.counterpartyName, []);
    byName.get(c.counterpartyName)!.push(c);
  }

  const idByName: Record<string, number> = {};
  for (const [name, cs] of byName) {
    const primary = cs.find((c) => c.status === "aktiv") ?? cs[0];
    const customer = await prisma.customer.create({
      data: {
        name,
        type: guessCustomerType(name),
        status: deriveCustomerStatus(cs.map((c) => c.status)),
        phone: primary.counterpartyPhone,
        email: primary.counterpartyEmail,
        address: primary.counterpartyAddress,
      },
    });
    idByName[name] = customer.id;
    await prisma.contract.updateMany({
      where: { counterpartyName: name },
      data: { customerId: customer.id },
    });
  }

  const activities = [
    {
      name: "Lars Johansen",
      type: "samtale",
      summary: "Avtale utløpt – ring og tilby ny sesong med plenklipping.",
      followUpAt: daysFromToday(3),
    },
    {
      name: "Sameiet Lindebakken v/ styreleder",
      type: "oppgave",
      summary: "Følg opp tilbud – venter fortsatt på signatur.",
      followUpAt: daysFromToday(7),
    },
    {
      name: "Ola Hansen",
      type: "oppgave",
      summary: "Bekreft snømåking før vintersesongen.",
      followUpAt: daysFromToday(20),
    },
    {
      name: "Kari Nordmann",
      type: "samtale",
      summary: "Kunde fornøyd med sesongoppstart. Ingen oppfølging nødvendig.",
      followUpAt: null as Date | null,
    },
  ];

  let activityCount = 0;
  for (const a of activities) {
    const cid = idByName[a.name];
    if (!cid) continue;
    await prisma.activity.create({
      data: {
        customerId: cid,
        type: a.type,
        summary: a.summary,
        followUpAt: a.followUpAt,
        date: new Date(),
      },
    });
    activityCount++;
  }

  console.log(`La inn ${byName.size} kunder og ${activityCount} aktiviteter.`);
}

async function main() {
  await seedUsers();

  const existing = await prisma.contract.count();
  if (existing === 0) {
    for (const c of contracts) {
      await prisma.contract.create({ data: c });
    }

  await prisma.template.create({
    data: {
      name: "Fast avtale – plenklipping",
      type: "kundeavtale",
      amountUnit: "per oppdrag",
      defaultAmount: 650,
      autoRenew: true,
      fields: lawnTemplateFields,
      body: lawnTemplateBody,
    },
  });

  await prisma.changeLog.create({
    data: { action: "seed", summary: "La inn eksempeldata (7 kontrakter + 1 mal)." },
  });

    console.log(`Seed fullført: ${contracts.length} kontrakter og 1 mal lagt inn.`);
  } else {
    console.log(`Kontrakt-seed hoppet over: databasen har allerede ${existing} kontrakt(er).`);
  }

  await seedCustomers();
  await seedControls();
}

// Sikkerhet & etterlevelse: example controls across both domains.
const controls = [
  { title: "To-faktor (2FA) på e-post og regnskapssystem", domain: "it_sikkerhet", category: "tilgangsstyring", status: "paagaar", riskLevel: "hoy", owner: "Eier 1", reviewDate: new Date("2026-07-15"), description: "Skru på tofaktorautentisering på alle felleskontoer.", notes: "E-post er gjort. Regnskapssystem gjenstår." },
  { title: "Personvernerklæring for kundedata", domain: "it_sikkerhet", category: "personvern", status: "trenger_oppfolging", riskLevel: "middels", owner: "Eier 2", reviewDate: new Date("2026-07-05"), description: "Kort erklæring om hvilke kundedata vi lagrer og hvorfor." },
  { title: "Databehandleravtale med regnskapsfører", domain: "it_sikkerhet", category: "databehandling", status: "paa_plass", riskLevel: "lav", owner: "Eier 1", reviewDate: new Date("2027-01-10"), description: "Signert avtale ligger i perm. Gjennomgås årlig." },
  { title: "Sikkerhetskopi av kundedatabasen", domain: "it_sikkerhet", category: "sikkerhetskopi", status: "ikke_startet", riskLevel: "hoy", owner: "Eier 1", reviewDate: new Date("2026-07-01"), description: "Automatisk, kryptert backup utenfor maskinen. Test gjenoppretting." },
  { title: "HMS-rutine for arbeid i høyden og med maskiner", domain: "drift_hms", category: "hms", status: "trenger_oppfolging", riskLevel: "hoy", owner: "Eier 2", reviewDate: new Date("2026-06-20"), description: "Sjekkliste for stige, kantklipper, snøfreser og verneutstyr.", notes: "Forfalt – må oppdateres før sommersesongen." },
  { title: "Ansvarsforsikring for utført arbeid", domain: "drift_hms", category: "forsikring", status: "paa_plass", riskLevel: "middels", owner: "Eier 1", reviewDate: new Date("2026-09-30"), description: "Dekker skade på kundens eiendom under oppdrag." },
  { title: "Skriftlige arbeidsavtaler for sesongansatte", domain: "drift_hms", category: "ansettelse", status: "paagaar", riskLevel: "middels", owner: "Eier 2", reviewDate: new Date("2026-07-10"), description: "Alle som jobber for oss skal ha skriftlig avtale før oppstart." },
  { title: "Ansvarsfraskrivelse og vilkår i kundeavtaler", domain: "drift_hms", category: "kundekontrakt", status: "ikke_startet", riskLevel: "middels", owner: "Eier 1", description: "Tydelige vilkår om ansvar, avbestilling og værforbehold." },
  { title: "Service og kontroll av henger og kjøretøy", domain: "drift_hms", category: "utstyr", status: "paa_plass", riskLevel: "lav", owner: "Eier 2", reviewDate: new Date("2026-08-15"), description: "Årlig kontroll av henger, lys og sikring av last." },
];

async function seedControls() {
  if ((await prisma.controlItem.count()) > 0) {
    console.log("Kontrollpunkter finnes allerede – hopper over.");
    return;
  }
  for (const c of controls) {
    await prisma.controlItem.create({ data: c });
  }
  console.log(`La inn ${controls.length} sikkerhets-kontrollpunkter.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
