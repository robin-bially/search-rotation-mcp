import { test } from "node:test";
import assert from "node:assert/strict";
import { YOU } from "../src/engines/you.js";

const MCP_URL = "https://api.you.com/mcp?profile=free";

function mockMcp(t: any, onCall: (args: any) => any): void {
  t.mock.method(globalThis, "fetch", async (url: any, init: any) => {
    assert.equal(String(url), MCP_URL);
    assert.equal(new Headers(init.headers).get("authorization"), null);
    if (init.method === "GET") return new Response(null, { status: 405 });
    const body = JSON.parse(init.body);
    if (body.method === "initialize") {
      return Response.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "fixture", version: "1" },
        },
      });
    }
    if (body.method === "tools/call") {
      assert.equal(body.params.name, "you-search");
      return Response.json({ jsonrpc: "2.0", id: body.id, result: onCall(body.params.arguments) });
    }
    return new Response(null, { status: 202 });
  });
}

function webAndNews(): any {
  return {
    results: {
      web: [
        { url: "https://a.example", title: "A", description: "  A   snippet ", page_age: "2026-08-02" },
        { url: "https://b.example", title: "", snippets: ["fallback snippet"] },
      ],
      news: [
        { url: "https://a.example", title: "duplicate" },
        { url: "https://c.example", title: "C", contents: { highlights: ["highlight text"] } },
      ],
    },
  };
}

test("You.com keyless MCP sends count and date range, maps and de-duplicates web/news", async t => {
  mockMcp(t, args => {
    assert.deepEqual(args, {
      query: "q",
      count: 3,
      freshness: "2026-08-01to2026-08-31",
      extraction: "none",
    });
    return { content: [], structuredContent: webAndNews() };
  });
  const r = await YOU.search!(
    { query: "q", numResults: 3, startDate: "2026-08-01", endDate: "2026-08-31" },
    {},
  );
  assert.deepEqual(r.items.map(i => i.url), ["https://a.example", "https://b.example", "https://c.example"]);
  assert.equal(r.items[0].snippet, "A snippet");
  assert.equal(r.items[0].published, "2026-08-02");
  assert.equal(r.items[1].title, "https://b.example");
  assert.equal(r.items[1].snippet, "fallback snippet");
  assert.equal(r.items[2].snippet, "highlight text");
});

test("You.com caps the combined web+news list at numResults", async t => {
  mockMcp(t, args => {
    assert.equal(args.count, 2);
    return { content: [], structuredContent: webAndNews() };
  });
  const r = await YOU.search!({ query: "q", numResults: 2 }, {});
  assert.deepEqual(r.items.map(i => i.url), ["https://a.example", "https://b.example"]);
});

test("You.com keyless MCP omits count for provider default and keeps all returned results", async t => {
  mockMcp(t, args => {
    assert.deepEqual(args, { query: "q", extraction: "none" });
    return {
      content: [],
      structuredContent: {
        results: { web: Array.from({ length: 12 }, (_, i) => ({ url: `https://example.com/${i}`, title: `T${i}` })) },
      },
    };
  });
  const r = await YOU.search!({ query: "q" }, {});
  assert.equal(r.items.length, 12);
});

test("You.com clamps explicit counts to the adapter range", async t => {
  const seen: number[] = [];
  mockMcp(t, args => {
    seen.push(args.count);
    return { content: [], structuredContent: { results: { web: [] } } };
  });
  await YOU.search!({ query: "q", numResults: 0 }, {});
  await YOU.search!({ query: "q", numResults: 25 }, {});
  assert.deepEqual(seen, [1, 20]);
});

test("You.com accepts a valid empty answer as zero results", async t => {
  mockMcp(t, () => ({ content: [], structuredContent: { results: {} } }));
  const r = await YOU.search!({ query: "q", numResults: 2 }, {});
  assert.deepEqual(r.items, []);
});

test("You.com rejects a malformed non-array section", async t => {
  mockMcp(t, () => ({ content: [], structuredContent: { results: { web: "none" } } }));
  await assert.rejects(YOU.search!({ query: "q" }, {}), /ungültige Antwort/);
});

test("You.com keyless MCP propagates truncated tool errors", async t => {
  mockMcp(t, () => ({
    isError: true,
    content: [{ type: "text", text: "free profile limit reached: " + "x".repeat(400) }],
  }));
  await assert.rejects(YOU.search!({ query: "q" }, {}), (err: any) => {
    assert.match(err.message, /free profile limit reached/);
    assert.ok(err.message.length <= 320, `error length ${err.message.length}`);
    return true;
  });
});

test("You.com parses a text-only MCP answer as JSON", async t => {
  mockMcp(t, () => ({
    content: [{ type: "text", text: JSON.stringify({ results: { web: [{ url: "https://text.example", title: "Text" }] } }) }],
  }));
  const r = await YOU.search!({ query: "q", numResults: 1 }, {});
  assert.equal(r.items[0].url, "https://text.example");
});

test("You.com keeps the provider text when a text-only answer is not JSON", async t => {
  mockMcp(t, () => ({ content: [{ type: "text", text: "No results found for this query" }] }));
  await assert.rejects(YOU.search!({ query: "q" }, {}), /No results found for this query/);
});

test("You.com direct API uses X-API-Key, count and a date range", async t => {
  t.mock.method(globalThis, "fetch", async (url: any, init: any) => {
    assert.equal(String(url), "https://ydc-index.io/v1/search");
    const headers = new Headers(init.headers);
    assert.equal(headers.get("x-api-key"), "fixture-key");
    assert.equal(headers.get("authorization"), null);
    assert.deepEqual(JSON.parse(init.body), {
      query: "q",
      count: 3,
      freshness: "2026-08-01to2026-08-31",
    });
    return Response.json({
      results: {
        web: [{ url: "https://d.example", title: "D", description: "desc", page_age: "2026-11-01" }],
      },
    });
  });
  const r = await YOU.search!(
    { query: "q", numResults: 3, startDate: "2026-08-01", endDate: "2026-08-31" },
    { apiKey: "fixture-key" },
  );
  assert.deepEqual(r.items, [
    { title: "D", url: "https://d.example", snippet: "desc", published: "2026-11-01" },
  ]);
});

test("You.com direct API propagates HTTP failures", async t => {
  t.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ error: "rate limited" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "30" },
    }),
  );
  await assert.rejects(
    YOU.search!({ query: "q", numResults: 2 }, { apiKey: "fixture-key" }),
    /HTTP 429.*rate limited/,
  );
});

test("You.com supports two date bounds and relative windows, but skips one-sided bounds", () => {
  assert.equal(Boolean(YOU.supportsSearchTime!({ query: "q", startDate: "2026-08-01", endDate: "2026-08-31" }, {})), true);
  assert.equal(Boolean(YOU.supportsSearchTime!({ query: "q", timeRange: "week" }, {})), true);
  assert.equal(Boolean(YOU.supportsSearchTime!({ query: "q", startDate: "2026-08-01" }, {})), false);
});
