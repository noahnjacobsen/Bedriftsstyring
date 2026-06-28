import { Nav } from "@/components/Nav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";

// Every page in this group requires a logged-in user.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/">
            📄 Bedriftsstyring
          </a>
          <Nav />
          <div className="user-area">
            <ThemeToggle />
            <span className="muted small">{user.name}</span>
            <form action={logout}>
              <button type="submit" className="btn secondary small">
                Logg ut
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
