import * as A from "../kit/audit.mjs";

// The explode springs every toy uses: the audit replays exactly these, so what it
// proves is what the page shows.
export const SPRING = { stagger: 0.06, stiffness: 64, damping: 14.2, substeps: 4 };

// Records a figure's items into an audit recorder, in the order given, so the
// painter's order being checked is the order the page draws. Keys are spaced
// so that no explode lift can reorder two items: the page never re-sorts.
export function record(P, items, { order = [], moves = {} } = {}) {
  const R = A.recorder(P, { order, spring: SPRING });
  const routes = new Map(); // a wire drawn in pieces is recorded once, as one route
  items.forEach((it, index) => {
    if (!it.shapes.length && !it.route) return; // halos, marks and glows draw no body of their own
    const piece = it.piece ?? "";
    const move = moves[piece] ?? [0, 0, 0];
    let shapes = it.shapes.flatMap((shape) => (shape.kind === "tube" ? R.route(shape.name, shape.points, shape.radii[0], { owner: shape.owner, ends: shape.ends, touch: shape.touch, limp: shape.limp, piece, move }) : [R.solid(shape)]));
    if (it.route) {
      const { name, points, r, ...meta } = it.route;
      if (!routes.has(name)) routes.set(name, R.route(name, points, r, { ...meta, piece, move }));
      // a piece of a route rasters its own chunk, so pieces can sort around what the route wraps
      const own = it.chunk ? [A.tube(it.chunk, r, { name: it.name, owner: meta.owner, move, piece })] : routes.get(name);
      shapes = [...shapes, ...own];
    }
    R.put({ name: it.name, key: index * 1000, shapes, svg: it.svg, piece, move });
  });
  return R;
}

// Sorts items by measured depth: the kit ray-casts every overlapping pair, at
// rest and, given an explode, apart and in every replayed frame between. These
// pages keep one painter's order, so every pair's "nearer last" is taken as a
// rule in all states at once and the items are ordered to satisfy them all,
// ties broken by the kit's settled keys. A pair that needs both orders (one
// part passing another as it moves) is reported: it needs a cut or a new vector.
export function settled(P, items, { order = [], moves = {} } = {}) {
  const R = record(P, items, { order, moves });
  A.settle(R, P);
  const { pairs, least } = R.settled.overlaps;
  const n = R.items.length;
  const after = Array.from({ length: n }, () => new Set()); // after[a] = items that must be drawn after a
  const before = new Int32Array(n);
  const conflicts = [];
  for (const pair of pairs) {
    const aFront = pair.front[0].area >= least;
    const bFront = pair.front[1].area >= least;
    if (aFront && bFront) { conflicts.push(`${R.items[pair.a].name} × ${R.items[pair.b].name}`); continue; } // interlocked in this state
    const [first, last] = aFront ? [pair.b, pair.a] : bFront ? [pair.a, pair.b] : [null, null];
    if (first === null) continue;
    if (after[last].has(first)) { conflicts.push(`${R.items[first].name} × ${R.items[last].name}`); continue; }
    if (!after[first].has(last)) { after[first].add(last); before[last]++; }
  }
  if (conflicts.length) console.warn(`settled: ${conflicts.length} pair(s) need both orders as they move: ${[...new Set(conflicts)].slice(0, 6).join(", ")}`);
  const ready = R.items.map((it, i) => i).filter((i) => !before[i]);
  const byKey = (x, y) => R.items[x].key - R.items[y].key;
  const sorted = [];
  while (ready.length) {
    ready.sort(byKey);
    const i = ready.shift();
    sorted.push(i);
    for (const j of after[i]) if (--before[j] === 0) ready.push(j);
  }
  const rank = new Map(sorted.map((i, at) => [R.items[i].name, at]));
  return [...items].sort((a, b) => (rank.get(a.name) ?? -1) - (rank.get(b.name) ?? -1));
}

// `node build.mjs --audit` runs every check on each pose and exits non-zero on a
// problem. A pose given as { items, order, moves } is also taken apart: clearance
// and depth are then proved assembled, apart and in every replayed frame between.
export function auditPoses(P, poses, { allow = [], crowd = [] } = {}) {
  if (!process.argv.includes("--audit")) return;
  let failed = 0;
  for (const [pose, given] of Object.entries(poses)) {
    const started = Date.now();
    const { items, order = [], moves = {} } = Array.isArray(given) ? { items: given } : given;
    const R = record(P, items, { order, moves });
    const states = A.explodeStates(order, SPRING);
    const overlaps = A.overlapsOf(R.items, P, { states: states.depth });
    R.settled = { items: R.items, overlaps, solved: { rules: 0, dropped: [] }, states: states.depth };
    const result = A.audit(R, P, { frames: states.frames, apart: order.length > 0, allow, crowd });
    console.log(`--- pose: ${pose}${order.length ? " (and apart)" : ""}`);
    console.log(A.report(result));
    console.log(`audit · ${R.tubes.length} tubes · ${R.solids.length} solids · ${R.items.length} items · ${states.depth.length} depth states · ${overlaps.pairs.length} overlaps · ${((Date.now() - started) / 1000).toFixed(1)} s`);
    failed += A.failures(result);
  }
  console.log(failed ? `audit failed: ${failed} problem${failed === 1 ? "" : "s"}` : "audit passed");
  process.exitCode = failed ? 1 : 0;
}

export { A };
