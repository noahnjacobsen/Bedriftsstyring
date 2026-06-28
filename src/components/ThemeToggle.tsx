"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function effectiveTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Read the theme the inline script already applied.
  useEffect(() => {
    setTheme(effectiveTheme());
    setMounted(true);

    // Follow OS changes when the user hasn't made an explicit choice.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!localStorage.getItem("theme")) {
        const next = mq.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        setTheme(next);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  // Avoid a hydration mismatch flash: render a stable placeholder until mounted.
  const label = theme === "dark" ? "Bytt til lyst tema" : "Bytt til mørkt tema";
  const icon = theme === "dark" ? "☀️" : "🌙";

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn secondary small"
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      {mounted ? icon : "🌙"}
    </button>
  );
}
