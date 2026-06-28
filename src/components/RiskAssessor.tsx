"use client";

import { useRef, useState } from "react";
import { ASSESSMENT_DOMAINS } from "@/lib/security";
import { saveAssessment } from "@/lib/security-actions";
import { Markdown } from "@/components/Markdown";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

export function RiskAssessor({
  initialTitle = "",
  initialDomain = "begge",
}: {
  initialTitle?: string;
  initialDomain?: string;
}) {
  const [domain, setDomain] = useState(initialDomain);
  const [webSearch, setWebSearch] = useState(true);
  const [input, setInput] = useState(
    initialTitle ? `Vurder dette: ${initialTitle}\n\n` : "",
  );
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [live, setLive] = useState(""); // current assistant text being streamed
  const [status, setStatus] = useState("");
  const [searches, setSearches] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [model, setModel] = useState("claude-opus-4-8");
  const [savedId, setSavedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const liveRef = useRef("");

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);
    setLive("");
    liveRef.current = "";
    setStatus("Sender …");
    setSearches([]);
    setNotice("");
    setError("");
    setSavedId(null);

    try {
      const res = await fetch("/api/vurder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, domain, webSearch }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Noe gikk galt med forespørselen.");
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }
          switch (ev.type) {
            case "model":
              setModel(String(ev.model));
              break;
            case "status":
              setStatus(String(ev.text));
              break;
            case "search":
              setSearches((s) => [...s, String(ev.query)]);
              break;
            case "text":
              liveRef.current += String(ev.text);
              setLive(liveRef.current);
              setStatus("");
              break;
            case "notice":
              setNotice(String(ev.text));
              break;
            case "error":
              setError(String(ev.text));
              break;
            case "done":
              break;
          }
        }
      }

      const finalText = liveRef.current;
      if (finalText.trim()) {
        setMessages((m) => [...m, { role: "assistant", content: finalText }]);
      }
    } catch {
      setError("Mistet forbindelsen til serveren.");
    } finally {
      setStreaming(false);
      setStatus("");
      setLive("");
    }
  }

  async function save() {
    const firstUser = messages.find((m) => m.role === "user");
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!firstUser || !lastAssistant) return;
    setSaving(true);
    try {
      const id = await saveAssessment({
        title: (initialTitle || firstUser.content.split("\n")[0]).slice(0, 120),
        domain,
        situation: firstUser.content,
        result: lastAssistant.content,
        model,
      });
      setSavedId(id);
    } finally {
      setSaving(false);
    }
  }

  const hasAssistant = messages.some((m) => m.role === "assistant");

  return (
    <div className="card">
      {/* Controls */}
      <div className="filters" style={{ marginBottom: "0.75rem" }}>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="domain">Fokusområde</label>
          <select
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={streaming}
          >
            {ASSESSMENT_DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.icon} {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field checkbox" style={{ margin: 0, alignSelf: "end" }}>
          <input
            id="webSearch"
            type="checkbox"
            checked={webSearch}
            onChange={(e) => setWebSearch(e.target.checked)}
            disabled={streaming}
          />
          <label htmlFor="webSearch">Tillat websøk for ferske kilder</label>
        </div>
      </div>

      {/* Conversation */}
      {messages.map((m, i) =>
        m.role === "user" ? (
          <div key={i} className="ai-user">
            {m.content}
          </div>
        ) : (
          <Markdown key={i} text={m.content} />
        ),
      )}

      {/* Live stream */}
      {streaming && (
        <div>
          {status && <div className="ai-status">{status}</div>}
          {searches.length > 0 && (
            <div>
              {searches.map((q, i) => (
                <span key={i} className="ai-search">
                  🔎 {q}
                </span>
              ))}
            </div>
          )}
          {live && <Markdown text={live} />}
        </div>
      )}

      {notice && <div className="ai-notice">{notice}</div>}
      {error && <div className="login-error">{error}</div>}

      {/* Input */}
      <div className="field full" style={{ marginTop: "0.75rem" }}>
        <label htmlFor="input">
          {messages.length === 0
            ? "Beskriv situasjonen, beslutningen eller tiltaket"
            : "Oppfølgingsspørsmål eller mer info"}
        </label>
        <textarea
          id="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="F.eks. Vi vil begynne å lagre kundebilder i en delt mappe i nettskyen for å dokumentere arbeid …"
          style={{ minHeight: "110px" }}
          disabled={streaming}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={send} disabled={streaming || !input.trim()}>
          {streaming ? "Vurderer …" : messages.length === 0 ? "Vurder" : "Send"}
        </button>
        {hasAssistant && !streaming && (
          savedId ? (
            <a href={`/risikovurdering/${savedId}`} className="btn secondary">
              ✓ Lagret – åpne
            </a>
          ) : (
            <button type="button" className="btn secondary" onClick={save} disabled={saving}>
              {saving ? "Lagrer …" : "💾 Lagre vurdering"}
            </button>
          )
        )}
      </div>

      <div className="ai-disclaimer">
        Dette er beslutningsstøtte, ikke juridisk, økonomisk eller forsikringsmessig
        rådgivning. Ved viktige eller usikre forhold: verifiser med advokat,
        regnskapsfører, forsikringsselskap eller rett myndighet.
      </div>
    </div>
  );
}
