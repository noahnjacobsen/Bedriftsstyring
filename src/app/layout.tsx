import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bedriftsstyring",
  description: "Samlet bedriftsapp: kontrakter, kunder, sikkerhet og AI-risikovurdering",
  applicationName: "Bedriftsstyring",
  // Makes "Legg til på Hjem-skjerm" på iPhone åpne appen i fullskjerm.
  appleWebApp: {
    capable: true,
    title: "Bedriftsstyring",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f6feb",
};

// Runs before paint: applies the saved theme, or the system preference if none
// is saved. Always sets data-theme so the CSS needs only one dark block.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
