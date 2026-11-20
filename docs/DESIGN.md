# Design

## Core loop

Mawline is an original maze-chase game. The player is always in motion and can turn only
at legal intersections. A dot adds one pixel of stored trail. A spectre adds ten pixels,
and a fruit adds twenty. The visible body follows the exact movement trail, so growth is
fine-grained rather than one tile at a time.

A spark begins an eight-second power state. It lets the player eat spectres and also cut
through the older part of its own tail. A tail cut trades length for a small score award and
immediate routing space. It is a deliberate escape valve, not a collision failure.

Score comes from items plus a small length-scaled survival award every frame. That makes
long routes valuable but raises the cost of carrying a tail through tight intersections.

## Original-expression guardrails

Do not use Pac-Man, its ghost names, its exact characters, boards, sound effects, or
promotional language. New boards and characters should remain original. The player is a
small geometric maw; enemies are spectres; sparks are original power items.

## Music

The game ships one public-domain tracker module, documented in `music/manifest.json`.
The browser uses libopenmpt WebAssembly to play the XM directly rather than converting it
to a stream. New songs must be tracker files with a recorded source URL, license URL,
SHA-256, and duration.
