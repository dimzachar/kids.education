# kids.education

Small interactive explainers that show kids how everyday mechanisms work, with a "for grown-ups" section that adds the real physics.

The figures are built with the drawing kit from [Anatomy](https://github.com/wheresryan22/anatomy) (MIT), a Claude skill that explains an idea by drawing it as a real, working object: solid isometric parts with four-tone shading, a framed card with a live readout, and calm, time-based motion. The kit lives in `kit/` (`iso-kit.mjs`, `lathe.mjs`, `iso.css`) with its licence beside it. We add pastel colour token sets per part on top of the kit's own shading.

## Prototypes

| Prototype | What it teaches | Open |
| --- | --- | --- |
| Jack-in-the-box | Stored spring energy, a latch that holds it, and a crank with a peg that releases it | `jack-in-the-box/index.html` |

Each prototype ships as a single built HTML page. Open it in a browser, or serve the repo with any static server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/jack-in-the-box/
```

## Building

The pages are generated. Node 20.10+ is the only requirement; there is nothing to install.

```sh
node jack-in-the-box/build.mjs
```

- `jack-in-the-box/geometry.mjs` holds the toy's dimensions and every part. The static art (base, box, Jack) is built once; the moving parts (spring, lid with its catch pin, wheel spokes and peg, latch, crank) are functions of the model's state and are rebuilt each frame in the page from the same code.
- `jack-in-the-box/build.mjs` frames the figure in a card, adds the kid controls and the physics notes, and inlines the kit plus the live script into `index.html`.

## Jack-in-the-box

1. **Push Jack in.** The spring squashes, the lid closes and the latch hooks over a pin on the lid.
2. **Turn the handle** three times. The wheel inside turns with it and the peg creeps round toward the latch. The readout counts the turns.
3. **POP!** The peg lifts the latch, the lid flies open and the spring flings Jack up. The wheel coasts on so the latch springs back, ready for the next go.

Tap the toy, use the buttons, or press Space / Enter for the next step (`P` pushes, `T` turns). Left alone, the figure plays the whole sequence by itself. Motion respects `prefers-reduced-motion`.
