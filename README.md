# kids.education

Small interactive explainers that show kids how everyday mechanisms work, each with a "for grown-ups" section that adds the real physics. Open `index.html` for the gallery.

The figures are built with the drawing kit from [Anatomy](https://github.com/wheresryan22/anatomy) (MIT), a Claude skill that explains an idea by drawing it as a real, working object: solid isometric parts with four-tone shading, a framed card with a live readout, and calm, time-based motion. The kit lives in `kit/` (`iso-kit.mjs`, `lathe.mjs`, `tube.mjs`, `audit.mjs`, `iso.css`) with its licence beside it. We add pastel colour token sets per part on top of the kit's own shading, and the kid chrome around the card.

## The toys

| Figure | What it teaches | Page |
| --- | --- | --- |
| 1 · Jack-in-the-box | Stored spring energy, a latch that holds it, and a crank with a peg that releases it | `jack-in-the-box/` |
| 2 · Seesaw | Levers: weight × distance, and balancing a heavy friend with a light one further out | `seesaw/` |
| 3 · Two gears | Gear ratio: 24 teeth drive 12, so the little gear turns twice as fast the other way | `gears/` |
| 4 · Switch and lamp | A circuit is a loop: a switch opens a gap or bridges it, and the lamp only lights when the loop is complete | `circuit/` |

Each page is a single built HTML file. Open it in a browser, or serve the repo with any static server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/
```

Every toy plays by itself when left alone, and responds to taps, buttons and the keyboard. Motion respects `prefers-reduced-motion`.

## Building

The pages are generated. Node 20.10+ is the only requirement; there is nothing to install.

```sh
node jack-in-the-box/build.mjs
node seesaw/build.mjs
node gears/build.mjs
node circuit/build.mjs
```

Each toy has two files:

- `geometry.mjs` holds the dimensions and every part as an *item*: what the page draws and, when the audit module is passed in, the shape it records. Static art is built once; the moving parts (a lid, a plank, a tooth, a switch blade) are functions of the model's state and are rebuilt each frame in the page from the same code.
- `build.mjs` frames the figure in a card, adds the kid controls and the physics notes, and inlines the kit plus the live script into `index.html`.

`shared/page.mjs` is the common page chrome and colour tokens; `shared/audit.mjs` wires the kit's audit to the item lists.

## Checking a figure

Two of Anatomy's checks run on every toy:

```sh
node <toy>/build.mjs --audit     # the geometry audit, in each rest pose
```

The audit ray-casts every overlapping pair of parts and proves that every overlap is painted in true depth order, that nothing is sunk into anything, that every part is held by another part down to the base, and that every wire rests on its terminals with no pinched bends. It ends `audit passed`, or lists each problem.

The line-end check runs the built page in headless Chrome with Anatomy's `scripts/lines.mjs` (from the upstream repo) and fails any texture line that stops in mid-air. All four pages read `line ends: 0` in every pose.
