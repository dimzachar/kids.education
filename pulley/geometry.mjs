import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../kit/tube.mjs";

// A stone well with a wooden frame over it. The pulley is a grooved wheel on an
// axle along x under the crossbar; the rope lies in the groove, runs down the
// -y side to the bucket in the well and down the +y side to a grip outside it.
export const M = {
  WIDTH: 600,
  HEIGHT: 470,
  PLATE: { x: -90, y: -70, w: 180, d: 140, r: 10 },
  PLATE_H: 8,
  WELL: { at: [0, -4], rIn: 11, rOut: 15, h: 22 },
  WATER_Z: 1.5,
  POST: { w: 6, h: 84, x: 34 }, // posts at ±x, square section, the bar rests on their tops
  BAR: { z: 84, h: 6 },
  BRACKET: { x: 3.8, w: 2, z0: 66, d: 3 }, // two plates hanging under the bar at ±x; their inner faces touch the flanges
  WHEEL: { hub: 10, flange: 12, hubW: 2.6, flangeW: 1.5, z: 70 }, // centre at (0, well y + hub + rope, z)
  AXLE_R: 1.5,
  ROPE_R: 0.9,
  BUCKET: { r0: 6, r1: 8, h: 13 },
  KNOT_R: 3,
  GRIP: { r: 2.4, h: 8 },
  PULL_MAX: 24,
  PULL_STEP: 6,
};

const RAD = Math.PI / 180;
const Fx = (o) => G.frameOf(o, [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const Fz = (o) => G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const item = (name, svg, shapes, piece) => ({ name, svg, shapes: shapes ?? [], piece });
const when = (A, make) => (A ? make() : []);

export const ropeRadius = (M) => M.WHEEL.hub + M.ROPE_R; // the rope's centreline in the groove
export const wheelCentre = (M) => [0, M.WELL.at[1] + ropeRadius(M), M.WHEEL.z];
export const ropeDownY = (M) => M.WELL.at[1]; // the bucket side hangs over the well's centre
export const ropeUpY = (M) => M.WELL.at[1] + 2 * ropeRadius(M); // the grip side, outside the well

export function fit(M) {
  return k.fitProjection([...k.boxCorners(M.PLATE, -M.PLATE_H, 0), [-M.POST.x - 4, 0, M.BAR.z + M.BAR.h + 4], [M.POST.x + 4, 0, M.BAR.z + M.BAR.h + 4]], M.WIDTH, M.HEIGHT, { pad: 20, azimuth: 58, elevation: 30 });
}

export function groundItems(P, M, A) {
  const z0 = -M.PLATE_H;
  const svg = [`<path class="iso-halo" d="${k.haloOf(M.PLATE, z0, M.PLATE_H, P)}"/>`, S(k.slabOf(M.PLATE, z0, M.PLATE_H, P, 10, 1.2), { className: "jk-grass" }), L(k.planOutline(k.insetPlan(M.PLATE, 7), 0, P, 10), { tone: "faint", className: "pw-grass-line" })];
  for (const [x, y] of [[-70, -44], [62, 40], [-52, 48], [74, -36]]) svg.push(L(k.ring(x, y, 2.2, 0, P, 10), { tone: "faint", className: "pw-grass-line" }));
  return [item("stand.lawn", svg.join(""), when(A, () => [A.slab(M.PLATE, z0, M.PLATE_H, { name: "stand.lawn", ground: true }, 10)]), "ground")];
}

// The well wall in two halves, split across the view, so the bucket inside is
// painted between the far half and the near half.
function halfRing(M, from) {
  const [cx, cy] = M.WELL.at;
  const n = 18;
  const angles = Array.from({ length: n + 1 }, (_, i) => from + (i / n) * Math.PI);
  const pts = angles.map((a) => [cx + M.WELL.rOut * Math.cos(a), cy + M.WELL.rOut * Math.sin(a)]);
  for (let i = n; i >= 0; i--) pts.push([cx + M.WELL.rIn * Math.cos(angles[i]), cy + M.WELL.rIn * Math.sin(angles[i])]);
  return pts;
}
export function wellItems(P, M, A) {
  const az = (P.azimuth ?? 45) * RAD;
  const far = halfRing(M, az + Math.PI / 2);
  const near = halfRing(M, az - Math.PI / 2);
  const [cx, cy] = M.WELL.at;
  const courses = [7, 14].map((z) => L(k.sideArc(cx, cy, M.WELL.rOut, z, P, 40), { tone: "faint" })).join("");
  return [
    item("well.far", S(k.extrude(far, 0, M.WELL.h, P, { convex: false }), { className: "jk-stone" }), when(A, () => [A.extruded(far, 0, M.WELL.h, { name: "well.far" })]), "well"),
    item("well.water", S(k.cylinder(cx, cy, M.WELL.rIn - 0.1, 0, M.WATER_Z, P, 36), { className: "jk-water", crease: "none" }), when(A, () => [A.cylinder(cx, cy, M.WELL.rIn - 0.1, 0, M.WATER_Z, { name: "well.water" })]), "well"),
    item("well.near", S(k.extrude(near, 0, M.WELL.h, P, { convex: false }), { className: "jk-stone", inner: courses }), when(A, () => [A.extruded(near, 0, M.WELL.h, { name: "well.near" })]), "well"),
  ];
}

// The frame stands over the wheel, not the well: the bucket's rope hangs beside the bar.
export function frameItems(P, M, A) {
  const { POST, BAR, BRACKET } = M;
  const y = wheelCentre(M)[1];
  const out = [];
  for (const [x, side] of [[-POST.x, "left"], [POST.x, "right"]]) {
    const plan = { x: x - POST.w / 2, y: y - POST.w / 2, w: POST.w, d: POST.w, r: 0.8 };
    out.push(item(`frame.post.${side}`, S(k.slabOf(plan, 0, POST.h, P, 2, 0.5), { className: "jk-wood" }), when(A, () => [A.slab(plan, 0, POST.h, { name: `frame.post.${side}` }, 2)]), "frame"));
  }
  const bar = { x: -POST.x - POST.w / 2, y: y - 3, w: POST.x * 2 + POST.w, d: 6, r: 0.8 };
  out.push(item("frame.bar", S(k.slabOf(bar, BAR.z, BAR.h, P, 2, 0.5), { className: "jk-wood" }), when(A, () => [A.slab(bar, BAR.z, BAR.h, { name: "frame.bar" }, 2)]), "frame"));
  const wy = wheelCentre(M)[1];
  for (const [x, side] of [[-BRACKET.x, "left"], [BRACKET.x, "right"]]) {
    const plan = { x: x - BRACKET.w / 2, y: wy - BRACKET.d / 2, w: BRACKET.w, d: BRACKET.d, r: 0.4 };
    out.push(item(`frame.bracket.${side}`, S(k.slabOf(plan, BRACKET.z0, BAR.z - BRACKET.z0, P, 2), { className: "jk-steel" }), when(A, () => [A.slab(plan, BRACKET.z0, BAR.z - BRACKET.z0, { name: `frame.bracket.${side}` }, 2)]), "frame"));
  }
  return out;
}

// A grooved pulley: two flanges with the hub between them, on an axle between the brackets.
export function wheelItems(P, M, A) {
  const c = wheelCentre(M);
  const W = M.WHEEL;
  const outer = M.BRACKET.x + M.BRACKET.w / 2; // the brackets' outer faces at ±outer, where the axle caps sit
  const half = W.hubW / 2;
  const Ff = Fx([-half - W.flangeW, c[1], c[2]]);
  const Fh = Fx([-half, c[1], c[2]]);
  const Fn = Fx([half, c[1], c[2]]);
  const bolts = k.dotsSvg(G.dotsOf(Fn, W.flangeW + 0.05, 7, 6, P, { all: true }), { size: 0.6, tone: "lo" });
  return [
    item("pulley.cap.far", S(G.disc(-1.4, 0, 2.5, Fx([-outer, c[1], c[2]]), P), { className: "jk-steel" }), when(A, () => [A.disc(Fx([-outer, c[1], c[2]]), -1.4, 0, 2.5, { name: "pulley.cap.far", owner: "pulley" })]), "frame"),
    item("pulley.cap.near", S(G.disc(0, 1.4, 2.5, Fx([outer, c[1], c[2]]), P), { className: "jk-steel" }), when(A, () => [A.disc(Fx([outer, c[1], c[2]]), 0, 1.4, 2.5, { name: "pulley.cap.near", owner: "pulley" })]), "frame"),
    item("pulley.flange.far", S(G.disc(0, W.flangeW, W.flange, Ff, P), { className: "jk-yellow" }), when(A, () => [A.disc(Ff, 0, W.flangeW, W.flange, { name: "pulley.flange.far", owner: "pulley" })]), "frame"),
    item("pulley.hub", S(G.disc(0, W.hubW, W.hub, Fh, P), { className: "jk-brass", crease: "none" }), when(A, () => [A.disc(Fh, 0, W.hubW, W.hub, { name: "pulley.hub", owner: "pulley" })]), "frame"),
    item("pulley.flange.near", S(G.disc(0, W.flangeW, W.flange, Fn, P), { className: "jk-yellow" }) + bolts, when(A, () => [A.disc(Fn, 0, W.flangeW, W.flange, { name: "pulley.flange.near", owner: "pulley" })]), "frame"),
  ];
}

// The bucket with its bail and the knot the rope ties to, lifted by `lift`.
export const bailTop = (M, lift) => M.WATER_Z + lift + M.BUCKET.h + 6;
export const knotCentre = (M, lift) => [0, ropeDownY(M), bailTop(M, lift) + 0.9 + M.KNOT_R];
export function bucketItems(P, M, lift, A) {
  const [bx, by] = [0, ropeDownY(M)];
  const z0 = M.WATER_Z + lift;
  const B = M.BUCKET;
  const F = Fz([bx, by, z0]);
  const body = [[0, B.r0], [B.h, B.r1]];
  const bail = G.fillet([[bx - 6.5, by, z0 + B.h], [bx - 6.5, by, bailTop(M, lift)], [bx + 6.5, by, bailTop(M, lift)], [bx + 6.5, by, z0 + B.h]], 6, 7);
  const knot = knotCentre(M, lift);
  const pieces = tubePieces(bail, 0.9, P, { maxLength: 60 });
  return [
    item("bucket.body", S(G.solidOf(body, F, P), { className: "jk-blue", inner: L(G.arcOf(F, 3, B.r0 + (3 / B.h) * (B.r1 - B.r0), P, { slope: (B.r1 - B.r0) / B.h }), { tone: "faint" }) }), when(A, () => [A.solid(F, body, { name: "bucket.body", owner: "bucket" })]), "bucket"),
    { ...item("bucket.bail", `<g class="jk-steel">${pieces.map((piece) => tubeSvg(piece, { tone: "lo" })).join("")}</g>`, [], "bucket"), route: A ? { name: "bucket.bail", points: bail, r: 0.9, owner: "bail", touch: ["bucket.knot"] } : undefined },
    item("bucket.knot", S(G.sphereOf(knot, M.KNOT_R, P), { className: "jk-rope-knot" }), when(A, () => [A.ball(knot, M.KNOT_R, { name: "bucket.knot", owner: "knot" })]), "bucket"),
  ];
}

export const gripTop = (M, pull) => M.BAR.z - 26 - pull;
export function gripItems(P, M, pull, A) {
  const y = ropeUpY(M);
  const top = gripTop(M, pull);
  return [item("grip", S(k.cylinder(0, y, M.GRIP.r, top - M.GRIP.h, M.GRIP.h, P, 20, 0.4), { className: "jk-red", inner: L(k.knurl(0, y, M.GRIP.r, top - M.GRIP.h, top, 10, P), { tone: "faint" }) }), when(A, () => [A.cylinder(0, y, M.GRIP.r, top - M.GRIP.h, M.GRIP.h, { name: "grip", owner: "grip" })]), "grip")];
}

// The rope in three routes: the run down to the knot, the fixed arc in the groove,
// and the run down to the grip. The runs are one straight piece each, so they
// keep their painter's slot at every pull; the arc never moves.
export function ropeRoutes(M, pull) {
  const c = wheelCentre(M);
  const R = ropeRadius(M);
  const knot = knotCentre(M, pull);
  const arc = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI; // from the -y side over the top to the +y side
    arc.push([0, c[1] + R * Math.cos(a), c[2] + R * Math.sin(a)]);
  }
  return {
    down: [[0, ropeDownY(M), c[2]], [0, ropeDownY(M), knot[2] + M.KNOT_R]],
    arc,
    up: [[0, ropeUpY(M), c[2]], [0, ropeUpY(M), gripTop(M, pull)]],
  };
}
export function ropeItems(P, M, pull, A) {
  const routes = ropeRoutes(M, pull);
  const touch = ["pulley.hub", "pulley.flange.far", "pulley.flange.near", "bucket.knot", "grip"];
  const draw = (pieces) => pieces.map((piece) => tubeSvg(piece, { tone: "lo" })).join("");
  const arcPieces = tubePieces(routes.arc, M.ROPE_R, P, { maxLength: 4, caps: false });
  return [
    { ...item("rope.down", `<g class="jk-rope">${draw(tubePieces(routes.down, M.ROPE_R, P, { maxLength: 80, caps: [false, true] }))}</g>`, [], "rope"), route: A ? { name: "rope.down", points: routes.down, r: M.ROPE_R, owner: "rope", touch, ends: [false, true] } : undefined },
    ...arcPieces.map((piece, i) => ({ ...item(`rope.arc#${i}`, `<g class="jk-rope">${tubeSvg(piece, { tone: "lo" })}</g>`, [], "rope"), route: A ? { name: "rope.arc", points: routes.arc, r: M.ROPE_R, owner: "rope", touch, ends: [false, false] } : undefined, chunk: piece.points })),
    { ...item("rope.up", `<g class="jk-rope">${draw(tubePieces(routes.up, M.ROPE_R, P, { maxLength: 80, caps: [false, true] }))}</g>`, [], "rope"), route: A ? { name: "rope.up", points: routes.up, r: M.ROPE_R, owner: "rope", touch, ends: [false, true] } : undefined },
  ];
}

export const svgOf = (items) => items.map((it) => it.svg).join("");

// The parts that move with the pull, by name, so the page can redraw each in its slot.
export function liveItems(P, M, pull) {
  return [...bucketItems(P, M, pull), ...ropeItems(P, M, pull), ...gripItems(P, M, pull)];
}

export function figureItems(P, M, pull, A) {
  return [...groundItems(P, M, A), ...wellItems(P, M, A), ...frameItems(P, M, A), ...wheelItems(P, M, A), ...bucketItems(P, M, pull, A), ...ropeItems(P, M, pull, A), ...gripItems(P, M, pull, A)];
}
