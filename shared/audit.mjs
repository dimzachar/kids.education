import * as A from "../kit/audit.mjs";

// Records a figure's items into an audit recorder, in the order given, so the
// painter's order being checked is the order the page draws.
export function record(P, items) {
  const R = A.recorder(P);
  const routes = new Map(); // a wire drawn in pieces is recorded once, as one route
  items.forEach((it, index) => {
    if (!it.shapes.length && !it.route) return; // halos, marks and glows draw no body of their own
    let shapes = it.shapes.flatMap((shape) => (shape.kind === "tube" ? R.route(shape.name, shape.points, shape.radii[0], { owner: shape.owner, ends: shape.ends, touch: shape.touch, limp: shape.limp }) : [R.solid(shape)]));
    if (it.route) {
      const { name, points, r, ...meta } = it.route;
      if (!routes.has(name)) routes.set(name, R.route(name, points, r, meta));
      shapes = [...shapes, ...routes.get(name)];
    }
    R.put({ name: it.name, key: index, shapes, svg: it.svg });
  });
  return R;
}

// Sorts items by measured depth: the kit ray-casts every overlapping pair and
// raises keys until every pair is painted nearer-last. Returns the items in
// that order, so a build can draw what the audit proves.
export function settled(P, items) {
  const R = record(P, items);
  A.settle(R, P);
  const byName = new Map(R.items.map((it) => [it.name, it.key]));
  return [...items].sort((a, b) => (byName.get(a.name) ?? -1) - (byName.get(b.name) ?? -1));
}

// `node build.mjs --audit` runs every check on each pose and exits non-zero on a problem.
export function auditPoses(P, poses, { allow = [], crowd = [] } = {}) {
  if (!process.argv.includes("--audit")) return;
  let failed = 0;
  for (const [pose, items] of Object.entries(poses)) {
    const started = Date.now();
    const R = record(P, items);
    const overlaps = A.overlapsOf(R.items, P, { states: [0] });
    R.settled = { items: R.items, overlaps, solved: { rules: 0, dropped: [] }, states: [0] };
    const result = A.audit(R, P, { frames: [], apart: false, allow, crowd });
    console.log(`--- pose: ${pose}`);
    console.log(A.report(result));
    console.log(`audit · ${R.tubes.length} tubes · ${R.solids.length} solids · ${R.items.length} items · ${overlaps.pairs.length} overlaps · ${((Date.now() - started) / 1000).toFixed(1)} s`);
    failed += A.failures(result);
  }
  console.log(failed ? `audit failed: ${failed} problem${failed === 1 ? "" : "s"}` : "audit passed");
  process.exitCode = failed ? 1 : 0;
}

export { A };
