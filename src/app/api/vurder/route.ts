import Anthropic from "@anthropic-ai/sdk";
import { SECURITY_SYSTEM_PROMPT } from "@/lib/security-system-prompt";
import { domainLabel } from "@/lib/security";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// The Anthropic SDK needs the Node runtime. Never run this on the edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Hobby caps serverless functions at 60s; Pro allows up to 300s.
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";
// On the hosted (Vercel) app: limit cost/abuse and keep within the 60s timeout.
const ON_VERCEL = Boolean(process.env.VERCEL);
const DAILY_CAP = 50; // AI assessments per user per day

type ChatMessage = { role: "user" | "assistant"; content: string };

interface RequestBody {
  messages: ChatMessage[];
  domain: string;
  webSearch?: boolean;
}

type StreamEvent =
  | { type: "model"; model: string }
  | { type: "status"; text: string }
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "search"; query: string }
  | { type: "notice"; text: string }
  | { type: "error"; text: string }
  | { type: "done" };

function sse(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

function friendlyError(err: unknown): string {
  const status = (err as { status?: number })?.status;
  if (status === 401)
    return "API-nøkkelen ble avvist. Sjekk ANTHROPIC_API_KEY i .env.local.";
  if (status === 429)
    return "Anthropic-kontoen er over rategrensen akkurat nå. Vent litt og prøv igjen.";
  if (status === 400)
    return "Forespørselen ble avvist av API-et. Prøv en kortere melding.";
  if (status && status >= 500)
    return "Anthropic er midlertidig overbelastet. Prøv igjen om et lite øyeblikk.";
  const msg = (err as Error)?.message;
  return msg ? `Noe gikk galt: ${msg}` : "Noe uventet gikk galt under kallet.";
}

export async function POST(req: Request) {
  // CSRF defense in depth: reject cross-site POSTs (sameSite cookie also helps).
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== host) {
        return new Response(JSON.stringify({ error: "Ugyldig opprinnelse." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Ugyldig opprinnelse." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Require a logged-in user (defense in depth alongside middleware).
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return new Response(JSON.stringify({ error: "Ikke innlogget." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Ingen API-nøkkel funnet. Opprett .env.local med ANTHROPIC_API_KEY=… og start serveren på nytt.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Ugyldig forespørsel." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Daily per-user cap to protect against API-cost abuse.
  const day = new Date().toISOString().slice(0, 10);
  const usage = await prisma.aiUsage.upsert({
    where: { actor_day: { actor: user.username, day } },
    create: { actor: user.username, day, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (usage.count > DAILY_CAP) {
    return new Response(
      JSON.stringify({
        error: `Daglig grense for AI-vurderinger nådd (${DAILY_CAP}). Prøv igjen i morgen.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  // Hosted (Vercel): default web search off + medium effort to stay within the
  // 60s function limit. Locally: full effort + search on unless turned off.
  const wantSearch = ON_VERCEL ? body.webSearch === true : body.webSearch !== false;
  const effort = ON_VERCEL ? "medium" : "high";
  const focus =
    body.domain === "begge" || !body.domain
      ? "Vurder begge områder: IT-sikkerhet/personvern OG drift/HMS/juss."
      : `Brukeren ønsker hovedfokus på: ${domainLabel(body.domain)}. Vekt dette området, men nevn kort om du ser noe alvorlig i det andre.`;

  const system: {
    type: "text";
    text: string;
    cache_control?: { type: "ephemeral" };
  }[] = [
    { type: "text", text: SECURITY_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    { type: "text", text: "FOKUS FOR DENNE VURDERINGEN:\n" + focus },
  ];

  const messages = (body.messages ?? [])
    .filter((m) => m && m.content && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "Ingen beskrivelse oppgitt." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let producedText = false;
      const send = (e: StreamEvent) => controller.enqueue(sse(e));
      send({ type: "model", model: MODEL });

      const run = async (withTools: boolean) => {
        const convo = messages.map((m) => ({ ...m }));
        const MAX_CONTINUATIONS = 4;

        for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
          const params = {
            model: MODEL,
            max_tokens: 16000,
            system,
            messages: convo,
            thinking: { type: "adaptive", display: "summarized" },
            output_config: { effort },
            ...(withTools
              ? {
                  tools: [
                    { type: "web_search_20260209", name: "web_search", max_uses: 5 },
                  ],
                }
              : {}),
          };

          const s = client.messages.stream(
            params as Parameters<typeof client.messages.stream>[0],
          );

          const toolBlocks = new Map<number, { name: string; json: string }>();
          let sentThinking = false;

          for await (const event of s as AsyncIterable<Record<string, any>>) {
            switch (event.type) {
              case "content_block_start": {
                const block = event.content_block;
                if (block?.type === "server_tool_use") {
                  toolBlocks.set(event.index, { name: block.name, json: "" });
                  if (block.name === "web_search")
                    send({ type: "status", text: "Søker på nettet …" });
                } else if (block?.type === "web_search_tool_result") {
                  send({ type: "status", text: "Leser kilder …" });
                } else if (block?.type === "thinking" && !sentThinking) {
                  sentThinking = true;
                  send({ type: "status", text: "Vurderer risiko …" });
                }
                break;
              }
              case "content_block_delta": {
                const d = event.delta;
                if (d?.type === "text_delta" && d.text) {
                  producedText = true;
                  send({ type: "text", text: d.text });
                } else if (d?.type === "thinking_delta" && d.thinking) {
                  send({ type: "thinking", text: d.thinking });
                } else if (d?.type === "input_json_delta") {
                  const tb = toolBlocks.get(event.index);
                  if (tb) tb.json += d.partial_json ?? "";
                }
                break;
              }
              case "content_block_stop": {
                const tb = toolBlocks.get(event.index);
                if (tb?.name === "web_search") {
                  try {
                    const q = JSON.parse(tb.json || "{}")?.query;
                    if (q) send({ type: "search", query: String(q) });
                  } catch {
                    /* query not parseable */
                  }
                  toolBlocks.delete(event.index);
                }
                break;
              }
            }
          }

          const final = await s.finalMessage();
          if (final.stop_reason === "pause_turn" && turn < MAX_CONTINUATIONS) {
            convo.push({
              role: "assistant",
              content: final.content as unknown as string,
            });
            continue;
          }
          return;
        }
      };

      try {
        await run(wantSearch);
      } catch (err) {
        if (wantSearch && !producedText) {
          send({
            type: "notice",
            text: "Websøk var utilgjengelig akkurat nå. Svarer uten ferske nettkilder.",
          });
          try {
            await run(false);
          } catch (err2) {
            send({ type: "error", text: friendlyError(err2) });
          }
        } else {
          send({ type: "error", text: friendlyError(err) });
        }
      }

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
