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
| 5 · Well and pulley | A fixed pulley turns a pull around: the bucket rises as far as the rope is pulled down | `pulley/` |

Each page is a single built HTML file. Open it in a browser, or serve the repo with any static server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/
```

Every toy asks the kid to guess first, then plays by itself when left alone, and responds to taps, buttons and the keyboard. A "Take it apart" button lifts the assemblies apart on staggered springs. Motion respects `prefers-reduced-motion`.

## Building

The pages are generated. Node 20.10+ is the only requirement; there is nothing to install.

```sh
for toy in jack-in-the-box seesaw gears circuit pulley; do node $toy/build.mjs; done
node build-site.mjs   # the gallery, from every toy's spec
```

Each toy has three files:

- `spec.mjs` is the words: the question, the object and the concept it embodies, the guess-first card, the three kid steps, the build-it-at-home line and the grown-ups notes. The gallery is generated from these.
- `geometry.mjs` holds the dimensions and every part as an *item*: what the page draws, the assembly it leaves with when taken apart, and, when the audit module is passed in, the shape it records. Static art is built once; the moving parts (a lid, a plank, a tooth, a switch blade, a rope) are functions of the model's state and are rebuilt each frame in the page from the same code.
- `build.mjs` composes the figure, names the explode vectors, writes the live script, and inlines the kit into `index.html`.

`shared/page.mjs` is the common page chrome, colour tokens, the predict card and the take-it-apart springs; `shared/audit.mjs` records items for the kit's audit, settles a painter's order that holds in every explode frame, and runs the checks.

### Adding a toy

1. Copy `pulley/` and rewrite `spec.mjs`: name the idea, then the object whose working *is* the idea.
2. In `geometry.mjs`, build the parts with the kit (`kit/iso-kit.mjs` for prisms, `kit/lathe.mjs` for turned parts, `kit/tube.mjs` for ropes and wires). Give every item a name, a shape and its assembly.
3. Add the toy's id to `TOYS` in `build-site.mjs` and to the workflow, and run its build with `--audit` until it ends `audit passed`.

## Checking a figure

Two of Anatomy's checks run on every toy:

```sh
node <toy>/build.mjs --audit     # the geometry audit, in each rest pose
```

The audit ray-casts every overlapping pair of parts and proves that every overlap is painted in true depth order, that nothing is sunk into anything, that every part is held by another part down to the base, and that every wire or rope rests on its terminals with no pinched bends. Where a toy comes apart, the same checks run apart and in every replayed frame of the explode springs. It ends `audit passed`, or lists each problem.

The line-end check runs the built page in headless Chrome with Anatomy's `scripts/lines.mjs` (from the upstream repo) and fails any texture line that stops in mid-air. All five pages read `line ends: 0` at rest and taken apart.
