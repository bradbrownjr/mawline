# Self-hosting

Mawline is a static web game served by `ghcr.io/bradbrownjr/mawline:edge`.
The image is built for `linux/amd64`, contains no state, and listens on port 80.

## Docker

```sh
docker run --detach --name mawline --restart unless-stopped -p 8420:80 ghcr.io/bradbrownjr/mawline:edge
```

Open `http://HOST:8420`. Put the container behind HTTPS for the preferred AudioWorklet
tracker player. The game has an HTTP-compatible fallback for LAN testing.

## Unraid

Import `deploy/unraid/mawline.xml` using Unraid's Docker template UI. It creates a bridge
container with host port 8420 and a WebUI link. No appdata path or environment variables are
needed. In Caddy, reverse proxy the desired hostname to `http://10.6.26.2:8420`.
