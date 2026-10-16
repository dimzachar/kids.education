# kids.education

Small interactive explainers that show kids how everyday mechanisms work, with a "for grown-ups" section that adds the real physics.

## Prototypes

| Prototype | What it teaches | Open |
| --- | --- | --- |
| Jack-in-the-box | Stored spring energy, a latch that holds it, and a crank with a peg that releases it | `jack-in-the-box/index.html` |

Each prototype is a single self-contained HTML file with no build step. Open it in a browser, or serve the folder with any static server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/jack-in-the-box/
```

## Jack-in-the-box

1. **Push Jack in.** The spring squashes, the lid closes and the latch catches it.
2. **Turn the handle** three times. The wheel spins and the peg creeps round toward the latch. The status pill counts the turns.
3. **POP!** The peg lifts the latch, the spring stretches out and Jack jumps up.

Keyboard: `P` pushes Jack in, `T` turns the handle. Animations respect `prefers-reduced-motion`.
