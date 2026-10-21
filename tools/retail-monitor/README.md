# Retail monitor — verified price snapshots

The **MacBook Pro - Avito + Pages** workflow in `main` has an additional independent `retail` job. Unlike chat-only web searches, GitHub Actions executes plain HTTP requests to **exact product pages**, verifies the H1 is MacBook Pro M5 Pro 24 GB / 1 TB, extracts the displayed selling price (not the crossed-out old price), and appends an actual observation to `gh-pages/data.json` on each attempt.

## Starter products
- `S005`: Hi Store 14″ M5 Pro / 24 GB / 1 TB, Silver (MGDN4), Samara product page
- `S008`: Hi Store 14″ M5 Pro / 24 GB / 1 TB, Space Black (MGDR4), Samara product page
- `S006`: ре:зон 14″ M5 Pro / 24 GB / 1 TB, Silver, Samara

Use only **verified product pages**, not catalog/search pages mixing unrelated prices. We can add other models/store parsers after confirming selectors using actual HTML.

## Core safeguards
- If a shop returns HTTP 403, captcha, wrong SKU, missing product title or ambiguous price, no price is verified and that source is marked `limited`. **Never convert old preliminary prices into fabricated fresh price points**.
- On success, update just this `retail` listing with `verifiedAt` and current price; keep Avito listings and `avitoChecks` untouched.
- Every run appends a `checks` record, including failed attempts. `minProM5Pro` is only from successfully verified live HTML in that run, or `null` if none. `lastSuccessAt` updates only when ≥1 actual confirmation succeeded.
- At least two **distinct real observation timestamps** are needed for a historical line; until then, the website shows an explicit **cross-store current-price comparison**, with preliminary vs. verified badges.
- GitHub Contents API reads the **latest** `gh-pages/data.json`, writes with current SHA, retries GitHub write conflicts so Avito / chat updates don't silently overwrite one another.
- The `retail` job runs without Apify, so no external account is required for shop tracking. `deploy` waits for collectors, but publishes even if they fail.
- GitHub scheduled Actions can be delayed or skipped; see `retailAutomated.lastAttemptAt`, `checks`, and Actions history. Scheduled until November 1; no external API spending after this period.

## Local tests
```sh
node --test tools/retail-monitor/lib.test.mjs
```

Monitor logs: https://github.com/Web-Usov/dashboard/actions/workflows/avito-monitor.yml

Live JSON: https://github.com/Web-Usov/dashboard/blob/gh-pages/data.json

## Scheduling: ChatGPT owns the hourly trigger (from 21 October 2026)

The primary trigger is an existing **ChatGPT scheduled automation**, not GitHub cron. Once an hour it reads the latest `gh-pages/data.json` and, if the monitoring period is active, updates the small `tools/retail-monitor/heartbeat.json` file in `main` via the **GitHub connector**, preserving the file's current blob SHA. The resulting GitHub `push` event triggers `.github/workflows/avito-monitor.yml`:

1. `gate` reads the last store observation. GitHub `push` from ChatGPT initiates an actual collection within the monitoring window; `workflow_dispatch` is retained for manual/test use.
2. `retail` fetches exact shop pages, appends a timestamped verified `checks` observation, and atomically updates `gh-pages/data.json`.
3. `collect` optionally reads Avito through Apify when the `APIFY_TOKEN` GitHub Secret exists. Missing token does not block retail.
4. `deploy` publishes the latest `gh-pages` version via GitHub Pages using `actions/deploy-pages`, even if the optional Avito collector fails.

**Native GitHub `on.schedule` is disabled.** The old cron diagnostic workflow is now manual-only. GitHub Actions is used only as the job runner and Pages deployer, not as the scheduler. The scheduled ChatGPT task requires authorized GitHub access; if the connector stops working, `lastCheckAt` and the UI freshness warning will reveal missing observations. GitHub Actions `event=push` after a ChatGPT heartbeat is the expected evidence. This avoids depending on GitHub cron, which did not produce events during initial diagnostics.

**No other service / credentials are required** for the ChatGPT trigger beyond the existing GitHub connection. The backup VPS dispatcher remains optional and uninstalled. The scheduled task expires after 1 November 2026; the collection script separately enforces the monitoring date range.

Run history: https://github.com/Web-Usov/dashboard/actions/workflows/avito-monitor.yml
