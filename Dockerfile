# Static Mawline web server. The container holds no player state and needs no volume.
FROM nginx:1.29-alpine

LABEL org.opencontainers.image.title="Mawline" \
      org.opencontainers.image.description="An original 8-bit maze-chase game." \
      org.opencontainers.image.source="https://github.com/bradbrownjr/mawline" \
      org.opencontainers.image.licenses="MIT"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html game.js sfx.js style.css tracker.js tracker-worklet.js /usr/share/nginx/html/
COPY music /usr/share/nginx/html/music
COPY vendor /usr/share/nginx/html/vendor

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
