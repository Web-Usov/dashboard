# Apify → Avito → MacBook Pro Watch

**Scope:** only used **MacBook Pro M5 or M5 Pro**, RAM ≥ 24 GB, internal SSD ≥ 1 TB, pickup in Samara (not Air or M5 Max). Source is [dami_studio/avito-listings-scraper](https://apify.com/dami_studio/avito-listings-scraper), a third-party scraper — **not the official Avito API**.

## Setup (one time, never send token in chat)

1. [Register for Apify Free](https://console.apify.com/).
2. Open [Settings → API & Integrations](https://console.apify.com/account#/integrations). Create a dedicated API token with the minimum permitted scope that allows Actor runs, dataset reads **and the read-only account limits endpoint** (`GET /v2/users/me/limits`). Do not put the token in a URL, source file or browser JavaScript.
3. Open [repository Actions Secrets](https://github.com/Web-Usov/dashboard/settings/secrets/actions), create **New repository secret** named exactly **`APIFY_TOKEN`**, paste token as the value.
4. Open [Settings → Pages](https://github.com/Web-Usov/dashboard/settings/pages) and change **Build and deployment → Source** from **Deploy from a branch** to **GitHub Actions**. This is required: a commit made by a GitHub Actions `GITHUB_TOKEN` does *not* start a traditional branch-based Pages build.
5. On [Actions](https://github.com/Web-Usov/dashboard/actions/workflows/avito-monitor.yml), choose **MacBook Pro - Avito + Pages → Run workflow** (branch `main`) to test. The workflow tests parsing, makes two capped Apify calls, merges new Avito listings into `gh-pages/data.json` with SHA conflict retries, then publishes the **full** `gh-pages` website using `actions/deploy-pages`.
6. Verify the **Pages deployment** is green, check [site](https://web-usov.github.io/dashboard/) → **Б/у · Avito**, and look at `sources.Avito` in [JSON](https://github.com/Web-Usov/dashboard/blob/gh-pages/data.json). Zero matching ads is acceptable if filters are strict, but an empty/error API result is not proof no ads exist.

## Schedule, costs, protections

- Workflow on default branch `main`, scheduled at minute **:20** every hour (UTC and Samara have the same minute). Manual `workflow_dispatch` available. Starts doing Apify work only inside **2026-10-21 through 2026-11-01 23:59 Samara**. Outside the period, the collector skips paid API calls. Cron should be disabled manually after the experiment to stop unnecessary workflow runs.
- Two different searches: `MacBook Pro M5`, `MacBook Pro M5 Pro`. Each is capped at **12 returned ads**, max **24 billed results/hour**, by both app code and Actor input. `APIFY_MAX_ITEMS` cannot exceed 12.
- Actor published pricing: approximately $0.30 per 1,000 results **plus $0.0025 per Actor start** (2 starts/hour); Apify Free includes $5 monthly credits. ~270 hourly runs would cost at most about **$3.30 for these two types of event** assuming no extras. **Before each paid run, the script checks `/v2/users/me/limits`; at monthly usage ≥ $4.00 it skips the Actor**, leaving a safety margin. If it cannot read usage, it fails closed and does not start the Actor. Check your actual [Apify usage](https://console.apify.com/billing) because pricing can change; the code does not enforce a hard dollar cap at Apify account level.
- GITHUB_TOKEN is generated for GitHub Actions with workflow-level `contents: write`, `pages: write`, `id-token: write` permissions. No extra GitHub PAT is needed. **No APIFY_TOKEN**: scraper step skips; published site retains existing data, no charge.
- GitHub scheduled tasks can be delayed or skipped at busy times. For precise scheduling, use a trusted external cron.

## JSON data ownership / conflict safety

- ChatGPT hourly monitor manages local shop listings and the `checks` array. Apify workflow only updates Avito (`type: used`), `avitoChecks`, `sources.Avito`, `avitoLastCheckAt`, `avitoCheckCount`, `events`. This prevents mixing different collection mechanisms in the same chart.
- GitHub REST Contents API read + update with **SHA compare-and-swap**, retrying on conflict while merging against the latest JSON. Multiple collectors must still honor this convention; manual history rewrites may cause data loss.
- Listing ID stable (`A<Avito-id>`); repeated prices aren't duplicated as price-change events. Disappearance from the top 12 results does not mean a sale; after 48h without observation, listing is `stale`, not `gone`.
- If the Actor only returns title/preview without 24 GB RAM or 1 TB SSD, the record is **discarded**, not guessed. Additional detail extraction may require a different Actor or paid run and should be validated in a pilot.
- All page content including seller names is public. Don't store contact details, private chat messages or the API token in the JSON.

## Local unit tests

```sh
node --test tools/avito-monitor/*.test.mjs
```

No npm packages needed. The application integration uses built-in Node.js `fetch`, `Buffer` and native test runner.

## Useful docs

- [Actor inputs (OpenAPI)](https://apify.com/dami_studio/avito-listings-scraper/api/openapi)
- [Apify REST](https://docs.apify.com/api/v2)
- [GitHub Pages custom publishing workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Actions secret management](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
