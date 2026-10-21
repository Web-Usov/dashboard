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
