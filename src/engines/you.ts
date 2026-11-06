import type { EngineAdapter, EngineContext, SearchInput, SearchItem, SearchOutcome } from "../types.js";
import { httpJson, optionalCap as cap } from "./base.js";
import { withHostedMcp } from "./hosted-mcp.js";

const SIGNUP = "https://you.com/platform";
const MCP_URL = "https://api.you.com/mcp?profile=free";
const DIRECT_URL = "https://ydc-index.io/v1/search";

function mcpText(result: any): string {
  return (result?.content ?? [])
    .filter((c: any) => c?.type === "text" && typeof c.text === "string")
    .map((c: any) => c.text)
    .join("\n")
    .trim();
}

/** You.com uses one freshness value for relative windows and date ranges. */
function freshness(input: SearchInput): string | undefined {
  if (input.startDate && input.endDate) return `${input.startDate}to${input.endDate}`;
  return input.timeRange;
}

function snippetOf(r: any): string | undefined {
  const candidates = [
    typeof r?.description === "string" ? r.description : undefined,
    Array.isArray(r?.contents?.highlights)
      ? r.contents.highlights.find((v: unknown) => typeof v === "string")
      : undefined,
    Array.isArray(r?.snippets) ? r.snippets.find((v: unknown) => typeof v === "string") : undefined,
  ];
  const raw = candidates.find((v): v is string => typeof v === "string" && v.trim().length > 0);
  return raw ? raw.replace(/\s+/g, " ").trim().slice(0, 500) : undefined;
}

function mapPayload(payload: any, limit?: number): SearchOutcome {
  const results = payload?.results;
  if (!results || typeof results !== "object" || Array.isArray(results)) {
    throw new Error("you: ungültige Antwort");
  }
  // A valid empty answer is {results:{}}; a present but non-array field is a
  // format change and should fail loudly instead of silently dropping results.
  const malformed = (value: unknown): boolean => value !== undefined && value !== null && !Array.isArray(value);
  if (malformed(results.web) || malformed(results.news)) {
    throw new Error("you: ungültige Antwort");
  }
  const web = Array.isArray(results.web) ? results.web : [];
  const news = Array.isArray(results.news) ? results.news : [];
  const seen = new Set<string>();
  const items: SearchItem[] = [];
  // Web results first; a news item that duplicates a web URL adds no value.
  for (const raw of [...web, ...news]) {
    const url = typeof raw?.url === "string" ? raw.url.trim() : "";
    if (!url || seen.has(url)) continue;
    seen.add(url);
    items.push({
      title: typeof raw?.title === "string" && raw.title.trim() ? raw.title.trim() : url,
      url,
      snippet: snippetOf(raw),
      published: typeof raw?.page_age === "string" && raw.page_age.trim() ? raw.page_age : undefined,
    });
  }
  // you-search applies count per section; web and news may therefore return up
  // to twice the requested number. Trim the combined list when a count is set.
  return { items: limit === undefined ? items : items.slice(0, limit) };
}

async function search(input: SearchInput, ctx: EngineContext): Promise<SearchOutcome> {
  const count = cap(input.numResults);
  const range = freshness(input);
  if (!ctx.apiKey) {
    // Keyless profile: no account and no Authorization header. Extraction stays
    // off so the free call returns snippets instead of paid page content.
    const payload = await withHostedMcp(MCP_URL, ctx, 30_000, async (client, signal) => {
      const args: Record<string, unknown> = { query: input.query, extraction: "none" };
      if (count !== undefined) args.count = count;
      if (range) args.freshness = range;
      const res: any = await client.callTool(
        { name: "you-search", arguments: args },
        undefined,
        { timeout: 30_000, signal },
      );
      if (res?.isError) throw new Error(`you-mcp: ${mcpText(res).slice(0, 300) || "Tool-Fehler"}`);
      if (res?.structuredContent) return res.structuredContent;
      const text = mcpText(res);
      try {
        return JSON.parse(text);
      } catch (err) {
        const detail = [err instanceof Error ? err.message : undefined, text.slice(0, 200)].filter(Boolean).join(": ");
        throw new Error(`you-mcp: ungültige Antwort${detail ? ` (${detail})` : ""}`);
      }
    });
    return mapPayload(payload, count);
  }
  const body: Record<string, unknown> = { query: input.query };
  if (count !== undefined) body.count = count;
  if (range) body.freshness = range;
  const j = await httpJson<any>(
    DIRECT_URL,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": ctx.apiKey },
      body: JSON.stringify(body),
    },
    { signal: ctx.signal },
  );
  return mapPayload(j, count);
}

export const YOU: EngineAdapter = {
  meta: {
    id: "you",
    label: "You.com",
    homepage: "https://you.com",
    signupUrl: SIGNUP,
    keyless: "ip",
    keylessCapabilities: ["search"],
    capabilities: ["search"],
    monthlyFree: 0,
    quota: { period: "month", unit: "requests", estimated: true },
    quotaEndpoint: false,
    notes:
      "Ohne Key: gehosteter You.com-MCP (profile=free), 100 Suchen/Tag, nur Suche. Mit Key: direkte Search-API. Kein Fetch.",
  },
  supportsSearchTime: input => Boolean((input.startDate && input.endDate) || input.timeRange),
  search,
};
