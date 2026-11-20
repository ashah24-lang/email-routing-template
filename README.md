# CREW Email Trigger Pilot

This repository deploys the existing Cloudflare Worker `email-routing-template`
as a **test-only**, inbound Email Routing handler for `alerts@crew-ops.dev`.

## Safety boundary

- No forwarding, auto-replies, external API calls, webhook dispatch, or downstream triggers.
- No message body or full sender address is logged or persisted.
- Only subjects beginning with `CREW-TEST` are logged; all other email is discarded.
- Logs contain the recipient, sender domain, Message-ID and raw message size.
- The HTTP `/health` endpoint gives test-only status; all other paths return 404.
- Cloudflare Email Routing catch-all must stay set to **Drop**.
- Email sender addresses are not proof of authentication. Do not connect operational
  alert sources to this pilot until sender validation, deduplication, monitoring
  and retention are reviewed.
- The routing rule for `alerts@crew-ops.dev` is created manually in Cloudflare's
  Email Routing UI. No Wrangler `addresses` entry is defined.

## Verification

Run `npm ci`, `npm test`, and `npm run check`.

## Deployment

This repo was connected to Cloudflare automatic deployments before this change.
Changes should be reviewed on a branch and merged only after checks pass.
The Wrangler Worker name intentionally remains `email-routing-template`
to update the existing Worker rather than create another one.

After deployment, create the Cloudflare Email Routing rule:
`alerts@crew-ops.dev` → **Send to a Worker** → `email-routing-template`.

Send an innocuous email with subject `CREW-TEST: first delivery` to that
address and check Worker Observability logs for `crew-email-test-received`.
Do not enable live alert sources yet.
