# Mawline

An original 8-bit maze-chase game where a tiny hungry creature leaves a tail behind it.
It is inspired by the maze-chase and growing-tail genres, but uses original art, names,
maze geometry, rules, and code.

## Play

Serve this directory from a local web server, then open it in a modern desktop browser.
For example: `python3 -m http.server 8080` and visit `http://localhost:8080`.

- Arrow keys or WASD steer at intersections.
- Space starts and pauses.
- M mutes or unmutes the song.
- Dots grow the tail by one pixel. Spectres grow it by ten; fruit grows it by twenty.
- A spark puts the maze into a power state. During that time, eat spectres or deliberately
  cut through your own tail to turn dangerous length into points and room to manoeuvre.
- Outside the power state, touching the older part of the tail costs a core.
- Open side tunnels wrap from one edge of the maze to the other.
- Score gains a small length-scaled survival bonus, so a long clean run compounds value.

## Music and third-party code

`music/peachy_chip.xm` is **Peachy Chip** by Drozerix, a public-domain tracker module,
with source, license, SHA-256, and duration recorded in `music/manifest.json`.
The browser player uses libopenmpt; its license is at `vendor/libopenmpt/LICENSE`.
Arcade effects are generated in the browser with Web Audio rather than sampled from another game.
The low-latency player is used over HTTPS; a browser-compatible fallback lets the song play
when testing from an HTTP LAN address.

## Deployment

The public Docker image is `ghcr.io/bradbrownjr/mawline:edge`. See
[self-hosting](docs/SELF-HOSTING.md) for Docker, Unraid, and reverse-proxy setup.

## Prior art and design position

The basic premise is not new. Existing examples include [Pac-Snake](https://kuroo-kyo.itch.io/pac-snake),
[SNEKMAN](https://funkypotato.com/snekman/), and [Pac-Snec](https://store.steampowered.com/app/4048060).
Mawline's design focus is the tail as an edible resource: fine-grained growth, power-state
tail pruning, and length-time scoring in an original hand-authored maze.
