# myRustDeck

Browser client for a self-hosted RustDesk server (`hbbs`/`hbbr`). It is the RustDesk 1.3.0
`flutter/web/v1` web client (AGPL-3.0, from https://github.com/rustdesk/rustdesk), modified to:

- use `wss://<host>/ws/id` and `wss://<host>/ws/relay` when served over HTTPS
- take a default server and key at build time (`VITE_RD_HOST`, `VITE_RD_KEY`)

`js/src/gen_js_from_hbb.ts` is pre-generated (English strings, key map, retry rules) from the 1.3.0
sources; `protos/` is vendored from `libs/hbb_common/protos`.

## Build

Needs Node 18+ and `protoc` on PATH (or `PROTOC=<path>`; use the official release, not `grpc-tools`).

```powershell
$env:VITE_RD_HOST = "rdws.alex-dyakin.com"
$env:VITE_RD_KEY  = (Get-Content C:\RustDeskServer\data\id_ed25519.pub).Trim()
node scripts/build.js        # output: dist/
node scripts/serve.js 3002   # static server on 127.0.0.1:3002
```

## Hosting (Cloudflare Tunnel, no open ports)

Ingress rules in `~/.cloudflared/config.yml` (DNS CNAMEs created with `cloudflared tunnel route dns`):

```yaml
- hostname: web.alex-dyakin.com        # static client
  service: http://127.0.0.1:3002
- hostname: rdws.alex-dyakin.com       # hbbs websocket (TLS terminated by Cloudflare)
  path: ^/ws/id$
  service: http://127.0.0.1:4668
- hostname: rdws.alex-dyakin.com       # hbbr websocket
  path: ^/ws/relay$
  service: http://127.0.0.1:4669
```

`rd.alex-dyakin.com` stays a DNS-only A record for native RustDesk clients (4665-4669);
the web client uses `rdws.alex-dyakin.com`. `restart-all.ps1` starts the static server and syncs
the tunnel config. Open https://web.alex-dyakin.com, enter the remote ID and password.

Limits of v1: no file transfer/clipboard, VP9 decode in the browser, and the peer must allow relay
connections (hbbs `-r` is set, so relay is used).

