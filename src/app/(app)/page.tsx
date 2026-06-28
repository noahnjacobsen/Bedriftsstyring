import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { ReminderPill } from "@/components/ReminderPill";
import { activityTypeIcon } from "@/lib/crm";
import { RiskBadge } from "@/components/SecurityBadges";
import type { Contract } from "@prisma/client";

// Always render with live data (date math + DB counts must never be stale).
export const dynamic = "force-dynamic";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// A compact list of contracts used inside the dashboard sections.
// fileData is globally omitted from Contract queries (see src/lib/db.ts).
function ContractRows({
  items,
  dateField,
}: {
  items: Omit<Contract, "fileData">[];
  dateField?: "endDate";
}) {
  if (items.length === 0) {
    return <p className="muted small" style={{ margin: 0 }}>Ingenting her nå 🎉</p>;
  }
  return (
    <ul className="timeline">
      {items.map((c) => (
        <li key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
          <span>
            <a href={`/kontrakter/${c.id}`}>
              <strong>{c.title}</strong>
            </a>{" "}
            <span className="muted small">· {c.counterpartyName}</span>
          </span>
          <span className="small" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            {dateField === "endDate" && c.endDate ? (
              <ReminderPill date={c.endDate} />
            ) : (
              <StatusBadge status={c.status} />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function DashboardPage() {
  const today = startOfToday();
  const in30 = addDays(today, 30);
  const in60 = addDays(today, 60);

  const [
    renew30,
    renew60,
    overdue,
    drafts,
    awaitingSignature,
    total,
    activeCount,
    followUps,
    customerCount,
    securityAttention,
    openControlsCount,
  ] = await Promise.all([
    // Renews/expires within the next 30 days
    prisma.contract.findMany({
      where: {
        endDate: { gte: today, lte: in30 },
        status: { notIn: ["avsluttet"] },
      },
      orderBy: { endDate: "asc" },
    }),
    // Renews/expires in 31–60 days
    prisma.contract.findMany({
      where: {
        endDate: { gt: in30, lte: in60 },
        status: { notIn: ["avsluttet"] },
      },
      orderBy: { endDate: "asc" },
    }),
    // Past the renewal/expiry date but still treated as live → needs attention
    prisma.contract.findMany({
      where: {
        endDate: { lt: today },
        status: { in: ["aktiv", "sendt", "signert", "utlopt"] },
      },
      orderBy: { endDate: "asc" },
    }),
    prisma.contract.findMany({
      where: { status: "utkast" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.contract.findMany({
      where: { status: "sendt" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.contract.count(),
    prisma.contract.count({ where: { status: "aktiv" } }),
    // Open CRM follow-ups, soonest first
    prisma.activity.findMany({
      where: { followUpAt: { not: null }, done: false },
      orderBy: { followUpAt: "asc" },
      include: { customer: { select: { id: true, name: true } } },
      take: 15,
    }),
    prisma.customer.count(),
    // Security controls needing attention: due within 60 days or high-risk,
    // and not already in place.
    prisma.controlItem.findMany({
      where: {
        status: { not: "paa_plass" },
        OR: [{ reviewDate: { lte: in60 } }, { riskLevel: "hoy" }],
      },
      orderBy: [{ reviewDate: { sort: "asc", nulls: "last" } }],
      take: 15,
    }),
    prisma.controlItem.count({ where: { status: { not: "paa_plass" } } }),
  ]);

  return (
    <>
      <div className="page-head">
        <h1>Dashbord</h1>
        <a href="/kontrakter/ny" className="btn">
          + Ny kontrakt
        </a>
      </div>

      {/* Key numbers */}
      <div className="grid" style={{ marginBottom: "1.25rem" }}>
        <div className="card">
          <div className="label muted small">Kontrakter totalt</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{total}</div>
        </div>
        <div className="card">
          <div className="label muted small">Aktive</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{activeCount}</div>
        </div>
        <div className="card">
          <div className="label muted small">Venter på signatur</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{awaitingSignature.length}</div>
        </div>
        <div className="card">
          <div className="label muted small">Utkast</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{drafts.length}</div>
        </div>
        <div className="card">
          <div className="label muted small">Kunder</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{customerCount}</div>
        </div>
        <div className="card">
          <div className="label muted small">Åpne sikkerhetspunkter</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{openControlsCount}</div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>🔔 Oppfølginger</h2>
          {followUps.length === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>
              Ingen åpne oppfølginger 🎉
            </p>
          ) : (
            <ul className="timeline">
              {followUps.map((a) => (
                <li
                  key={a.id}
                  style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}
                >
                  <span>
                    {activityTypeIcon(a.type)}{" "}
                    <a href={`/kunder/${a.customer.id}`}>
                      <strong>{a.customer.name}</strong>
                    </a>{" "}
                    <span className="muted small">· {a.summary}</span>
                  </span>
                  <span className="small" style={{ whiteSpace: "nowrap" }}>
                    <ReminderPill date={a.followUpAt} showDate={false} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2>🔴 Fornyes/utløper innen 30 dager</h2>
          <ContractRows items={renew30} dateField="endDate" />
        </div>

        <div className="card">
          <h2>🟠 Fornyes/utløper om 31–60 dager</h2>
          <ContractRows items={renew60} dateField="endDate" />
        </div>

        <div className="card">
          <h2>⚠️ Forfalt – trenger oppfølging</h2>
          <ContractRows items={overdue} dateField="endDate" />
        </div>

        <div className="card">
          <h2>✍️ Venter på signatur</h2>
          <ContractRows items={awaitingSignature} />
        </div>

        <div className="card">
          <h2>📝 Utkast – ikke sendt</h2>
          <ContractRows items={drafts} />
        </div>

        <div className="card">
          <div className="section-title" style={{ margin: 0 }}>
            <h2 style={{ margin: 0 }}>🛡️ Sikkerhet – trenger oppfølging</h2>
            <a href="/risikovurdering" className="btn secondary small">
              AI-vurdering
            </a>
          </div>
          {securityAttention.length === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>
              Ingenting krever oppfølging nå 🎉
            </p>
          ) : (
            <ul className="timeline">
              {securityAttention.map((c) => (
                <li
                  key={c.id}
                  style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}
                >
                  <span>
                    <a href={`/sikkerhet/${c.id}`}>
                      <strong>{c.title}</strong>
                    </a>{" "}
                    <RiskBadge level={c.riskLevel} />
                  </span>
                  <span className="small" style={{ whiteSpace: "nowrap" }}>
                    {c.reviewDate ? (
                      <ReminderPill date={c.reviewDate} showDate={false} />
                    ) : (
                      <span className="muted">Ingen frist</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
