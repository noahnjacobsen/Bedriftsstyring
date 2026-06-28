"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn" onClick={() => window.print()}>
      🖨️ Skriv ut / lagre som PDF
    </button>
  );
}
