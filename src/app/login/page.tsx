import { redirect } from "next/navigation";
import { login } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already logged in → go to the dashboard.
  if (await getCurrentUser()) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="login-wrap">
      <div className="login-toggle">
        <ThemeToggle />
      </div>
      <form action={login} className="card login-card">
        <h1 style={{ textAlign: "center" }}>📄 Bedriftsstyring</h1>
        <p className="muted small" style={{ textAlign: "center", marginTop: 0 }}>
          Logg inn for å fortsette
        </p>

        {error === "locked" ? (
          <div className="login-error">
            For mange feilforsøk. Kontoen er midlertidig låst – prøv igjen om noen
            minutter.
          </div>
        ) : error ? (
          <div className="login-error">Feil brukernavn eller passord.</div>
        ) : null}

        <div className="field">
          <label htmlFor="username">Brukernavn</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoFocus
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Passord</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn" style={{ width: "100%", justifyContent: "center" }}>
          Logg inn
        </button>
      </form>
    </div>
  );
}
