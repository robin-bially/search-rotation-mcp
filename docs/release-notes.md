## v0.5.3 — Dependency refresh

Maintenance release with no change to tools, arguments or configuration. The lockfile
moves `hono` to 4.13.14 and `@types/node` to 26.6.6, together with a few patch
updates of transitive packages. `npm audit` reports no vulnerabilities.

```sh
brew update && brew upgrade robin-bially/tap/search-rotation
```

Or run the pinned GitHub version:

```sh
npx -y --allow-git=all github:robin-bially/search-rotation-mcp#v0.5.3
```


## v0.5.2 — Dependency update for four advisories

Maintenance release with no change to tools, arguments or configuration. The lockfile
moves `zod` to 4.6.7 (memory exhaustion on oversized constrained collections),
`@modelcontextprotocol/sdk` to 1.32.2 and `@hono/node-server` to 2.1.5, and pulls in
fixed versions of the transitive packages `body-parser`, `fast-uri` and
`ip-address`. `npm audit` reports no vulnerabilities.

```sh
brew update && brew upgrade robin-bially/tap/search-rotation
```

Or run the pinned GitHub version:

```sh
npx -y --allow-git=all github:robin-bially/search-rotation-mcp#v0.5.2
```


## v0.5.1 — Dependency update for the MCP SDK advisory

Maintenance release. `@modelcontextprotocol/sdk` moves from 1.30.1 to 1.32.1, which
fixes an advisory in the SDK's OAuth client: it could send credentials to an
authorization server chosen by the MCP server. Hono 4.13.13 and @hono/node-server
2.1.4 come along as patch updates. Tools, arguments and configuration are unchanged.

```sh
brew update && brew upgrade robin-bially/tap/search-rotation
```

Or run the pinned GitHub version:

```sh
npx -y --allow-git=all github:robin-bially/search-rotation-mcp#v0.5.1
```


## v0.5.0 — Consistent tool names and programmable engine configuration

The tool definitions were rewritten against the TDQS rubric, and two tools changed
name: `web_search` is now `search_web`, `engine_status` is now `get_engine_status`.
All five tools follow the same verb_noun pattern. Arguments, results and error texts
are unchanged, so only clients that keep an allowlist of tool names need an edit.

`update_engine_config` is new: it enables or disables engines, sets the search and
fetch rotation order, and sets monthly or daily limits per engine. It writes the same
local configuration file as the dashboard and applies to later searches without a
restart; API keys stay in the dashboard.

Every description now states when to use the tool and how failures surface, and all
five tools carry MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`,
`openWorldHint`).

```sh
brew update && brew upgrade robin-bially/tap/search-rotation
```

Or run the pinned GitHub version:

```sh
npx -y --allow-git=all github:robin-bially/search-rotation-mcp#v0.5.0
```


## v0.4.11 — Distribution under the robin-bially account

The GitHub account moved from `localfoundry` to `robin-bially`, so every distribution
path follows: the Homebrew tap is `robin-bially/tap`, the official MCP Registry
namespace becomes `io.github.robin-bially/search-rotation`, and the npm metadata now
points at the renamed repository. The package itself is unchanged, so there is no
behaviour change and no configuration migration.

```sh
brew update && brew upgrade robin-bially/tap/search-rotation
```

Or run the pinned GitHub version:

```sh
npx -y --allow-git=all github:robin-bially/search-rotation-mcp#v0.4.11
```


## v0.4.10 — npm distribution and MCP Registry metadata

The package now ships through npm as well, so `npx -y search-rotation` installs the
latest release without Git. Publishing runs in the release workflow through npm
trusted publishing, and `mcpName` plus `server.json` carry the metadata for the
official MCP Registry.

```sh
brew update && brew upgrade robin-bially/tap/search-rotation
```

Or run the pinned GitHub version:

```sh
npx -y --allow-git=all github:robin-bially/search-rotation-mcp#v0.4.10
```


## v0.4.9 — Updated Node type definitions

Routine maintenance release: the Node type definitions move to 26.6.3. No behaviour change and no configuration migration. The GitHub release page now shows only the notes for the current version instead of the whole changelog.

```sh
brew update && brew upgrade robin-bially/tap/search-rotation
```

Or run the pinned GitHub version:

```sh
npx -y --allow-git=all github:robin-bially/search-rotation-mcp#v0.4.9
```


## v0.4.8 — Updated dependencies

Routine maintenance release: the MCP SDK moves to 1.30.1, Hono to 4.13.9, Zod to 4.6.5, tsx to 4.23.15 and the Node type definitions to 26.6.2, together with the matching transitive updates (jose, proxy-addr, ip-address, fast-uri, undici-types). No behaviour change and no configuration migration.

```sh
brew update && brew upgrade robin-bially/tap/search-rotation
```

Or run the pinned GitHub version:

```sh
npx -y --allow-git=all github:robin-bially/search-rotation-mcp#v0.4.8
```


## v0.4.7 — Clearer dashboard usage, budgets, and activity

Engine call counts are now visible with or without an API key. Search, fetch, and error counts are displayed separately from provider credits, so services such as Firecrawl remain easy to inspect even when a quota API is available.

- Show monthly local engine attempts and their search/fetch/error breakdown consistently across the overview and engine cards.
- Rename Engine Health to Engine Usage & Budget, with explicit remaining percentages, budget units, and quota-source explanations.
- Add accessible activity-bar details for each two-hour window, including tool calls and per-engine attempts with fallbacks. Correct the 48-hour boundary and disclose the retained-history limit.
- Include failed fallback attempts in engine history filters; distinguish empty history from filter misses and add full timestamps to history tooltips.
- Refresh local call counts even when the quota percentage does not change. Empty history no longer implies a 0% error rate, and exhausted budgets have truly empty bars.
- Expand MCP setup by default, improve tablet/mobile navigation, and refresh the English light/dark README screenshots using demo data.

No configuration migration is required. Reconnect MCP clients after updating.

```sh
brew update && brew upgrade robin-bially/tap/search-rotation
```

Or run the pinned GitHub version:

```sh
npx -y --allow-git=all github:robin-bially/search-rotation-mcp#v0.4.7
```
