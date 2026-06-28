export default function NotFound() {
  return (
    <div className="card empty">
      <h2>Fant ikke siden</h2>
      <p className="muted">Innholdet du lette etter finnes ikke.</p>
      <a href="/" className="btn secondary">
        Til dashbordet
      </a>
    </div>
  );
}
