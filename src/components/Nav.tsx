"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashbord" },
  { href: "/kontrakter", label: "Kontrakter" },
  { href: "/kunder", label: "Kunder" },
  { href: "/maler", label: "Maler" },
  { href: "/sikkerhet", label: "Sikkerhet" },
  { href: "/risikovurdering", label: "AI-vurdering" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {links.map((l) => {
        const active =
          l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <a key={l.href} href={l.href} className={active ? "active" : ""}>
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}
