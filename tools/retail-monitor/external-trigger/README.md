# Optional free VPS fallback if GitHub schedule events never arrive

The independent `Cron Probe (5m)` checks whether GitHub actually emits `schedule` runs; successful `push` / `workflow_dispatch` runs do not prove it. GitHub documents that scheduled runs can be delayed or dropped. This fallback sends an explicit `workflow_dispatch` from **your already-paid VPS**, without any additional service fee.

The collection workflow's `tools/retail-monitor/gate.mjs` treats both `schedule` and `workflow_dispatch` as **the same hourly check**: it only starts the collector if the last attempt was at least 50 minutes ago. This is essential to avoid spending Apify's free API credits every 5 minutes.

## Prerequisites

- Debian/Ubuntu VPS with systemd and curl, egress HTTPS to github.com.
- A fine-grained GitHub PAT created at https://github.com/settings/personal-access-tokens/new. Repository access: **Only `Web-Usov/dashboard`**; repository permission **Actions: Read and write** (metadata read auto). The PAT is for dispatching the workflow, **NOT** the Apify token. Give it a short expiration date after 1 November. Never put it in Git or ChatGPT.
- The workflow must be enabled; it has `workflow_dispatch` on branch `main`.

## Install (on the VPS)

Download the three files from `tools/retail-monitor/external-trigger/` on GitHub (using `curl` or a checkout of this public repository), then:

```bash
sudo install -d -m 700 /etc/macbook-watch
sudo install -d -m 755 /usr/local/libexec
sudo install -m 700 dispatch.sh /usr/local/libexec/macbook-watch-dispatch
sudo install -m 644 macbook-watch-dispatch.service /etc/systemd/system/
sudo install -m 644 macbook-watch-dispatch.timer /etc/systemd/system/
read -rs -p 'GitHub fine-grained PAT: ' GH_PAT; echo
printf 'GITHUB_DISPATCH_TOKEN=%s\n' "$GH_PAT" | sudo tee /etc/macbook-watch/dispatch.env >/dev/null
unset GH_PAT
sudo chmod 600 /etc/macbook-watch/dispatch.env
sudo systemctl daemon-reload
sudo systemctl enable --now macbook-watch-dispatch.timer
sudo systemctl start macbook-watch-dispatch.service
sudo systemctl list-timers macbook-watch-dispatch.timer
sudo journalctl -u macbook-watch-dispatch.service -n 25 --no-pager
```

A successful systemd service prints `workflow_dispatch accepted (HTTP 204)`. Then open GitHub Actions and confirm an **event `workflow_dispatch`** run. If the age gate says SKIP because last check was under 50 minutes ago, that is expected. After 50+ minutes the collector and Pages deployment should execute.

## Stop

```bash
sudo systemctl disable --now macbook-watch-dispatch.timer
sudo rm -f /etc/macbook-watch/dispatch.env
```

After the monitoring period the script exits without dispatching further runs, even if timer is still active. Revoke the PAT when done.

## Safety

This script never contains real tokens. `dispatch.env` should be mode 600 owned by root; access to this VPS equals access to triggering your GitHub workflow. It cannot change repository code without additional PAT permissions. GitHub Actions collects data with its own short-lived built-in GITHUB_TOKEN. Use one VPS timer, not a timer on every server.
