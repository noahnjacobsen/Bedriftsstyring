"use client";

// Minimal, injection-safe markdown → React. Handles ## / ### headings,
// "- " bullet lists, blank-line paragraphs, and **bold** inline.
function renderInline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    const m = p.match(/^\*\*([^*]+)\*\*$/);
    if (m) return <strong key={`${keyBase}-${i}`}>{m[1]}</strong>;
    return <span key={`${keyBase}-${i}`}>{p}</span>;
  });
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let list: string[] = [];
  let k = 0;

  const flushList = () => {
    if (list.length) {
      const items = [...list];
      nodes.push(
        <ul key={`ul-${k++}`}>
          {items.map((it, i) => (
            <li key={i}>{renderInline(it, `li-${k}-${i}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (line.startsWith("## ")) {
      flushList();
      nodes.push(<h2 key={`h-${k++}`}>{renderInline(line.slice(3), `h2-${k}`)}</h2>);
    } else if (line.startsWith("### ")) {
      flushList();
      nodes.push(<h3 key={`h-${k++}`}>{renderInline(line.slice(4), `h3-${k}`)}</h3>);
    } else if (/^[-*]\s+/.test(line)) {
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      nodes.push(<p key={`p-${k++}`}>{renderInline(line, `p-${k}`)}</p>);
    }
  }
  flushList();
  return <div className="md">{nodes}</div>;
}
