import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";

// A seesaw on a lawn. The plank turns about an axle along y; +x is the little
// friend's end. Positions are counted in steps of 20 from the middle.
export const M = {
  WIDTH: 600,
  HEIGHT: 400,
  PLATE: { x: -112, y: -62, w: 224, d: 124, r: 10 },
  PLATE_H: 8,
  WEDGE: [[-18, 0], [18, 0], [3, 27.5], [-3, 27.5]], // (x, z) section of the pivot block
  WEDGE_D: 9, // half its depth along y
  AXLE_Z: 30,
  AXLE_R: 2.5,
  AXLE_HALF: 13,
  PLANK: { half: 90, w: 8, z0: 2.5, z1: 6.5 }, // (x', z') in the axle's frame; it rests on the axle
  STEP: 20,
  STEPS: 4,
  TILT_MAX: 14, // degrees before an end would reach the lawn
  TILT_PER: 0.35, // degrees per unit of net turning push
  BIG: { weight: 2, r: 7, h: 16, head: 6 },
  LITTLE: { weight: 1, r: 5, h: 11, head: 4.5 },
};

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const Fy = (o) => G.frameOf(o, [0, 1, 0], [1, 0, 0], [0, 0, 1]); // along y: (x, z) in the frame plane
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const item = (name, svg, shapes) => ({ name, svg, shapes: shapes ?? [] });
const when = (A, make) => (A ? make() : []);
const turn = (deg) => {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return ([x, z]) => [x * c - z * s, x * s + z * c];
};
const rect = (x0, x1, z0, z1) => [
  [x0, z0],
  [x1, z0],
  [x1, z1],
  [x0, z1],
];

export function fit(M) {
  const reach = M.PLANK.half + 6;
  const high = M.AXLE_Z + M.PLANK.z1 + M.BIG.h + M.BIG.head * 2 + reach * Math.sin(M.TILT_MAX * RAD);
  return k.fitProjection([...k.boxCorners(M.PLATE, -M.PLATE_H, 0), [-reach, -9, high], [reach, 9, high]], M.WIDTH, M.HEIGHT, { pad: 20, azimuth: 55, elevation: 30 });
}

// The plank's tilt for two friends at these steps: heavier and further out both push harder.
export function tiltOf(M, big, little) {
  const push = M.LITTLE.weight * little * M.STEP - M.BIG.weight * big * M.STEP; // positive tips the little end down
  return Math.max(-M.TILT_MAX, Math.min(M.TILT_MAX, -push * M.TILT_PER));
}

export function lawnItems(P, M, A) {
  const z0 = -M.PLATE_H;
  const svg = [
    `<path class="iso-halo" d="${k.haloOf(M.PLATE, z0, M.PLATE_H, P)}"/>`,
    S(k.slabOf(M.PLATE, z0, M.PLATE_H, P, 10, 1.2), { className: "jk-grass" }),
    L(k.planOutline(k.insetPlan(M.PLATE, 7), 0, P, 10), { tone: "faint", className: "ss-grass-line" }),
  ];
  // a few tufts: short closed loops on the lawn, so no line stops in the open
  for (const [x, y] of [[-88, -40], [70, 36], [-60, 44], [92, -30], [20, -48]]) svg.push(L(k.ring(x, y, 2.2, 0, P, 10), { tone: "faint", className: "ss-grass-line" }));
  return [item("stand.lawn", svg.join(""), when(A, () => [A.slab(M.PLATE, z0, M.PLATE_H, { name: "stand.lawn", ground: true }, 10)]))];
}

export function pivotItems(P, M, A) {
  const F = Fy([0, 0, 0]);
  const Fa = Fy([0, 0, M.AXLE_Z]);
  const { AXLE_R: r, AXLE_HALF: h } = M;
  const w = M.PLANK.w;
  const wedge = S(G.prismOf(F, M.WEDGE, -M.WEDGE_D, M.WEDGE_D, P), { className: "jk-wood" }) + k.dotsSvg([k.iso([-9, M.WEDGE_D, 8], P), k.iso([9, M.WEDGE_D, 8], P), k.iso([-4, M.WEDGE_D, 20], P), k.iso([4, M.WEDGE_D, 20], P)], { size: 0.55 });
  return {
    far: [
      item("pivot.block", wedge, when(A, () => [A.prism(F, M.WEDGE, -M.WEDGE_D, M.WEDGE_D, { name: "pivot.block" })])),
      item("axle.cap.far", S(G.disc(-h - 2, -h, 4, Fa, P), { className: "jk-steel" }), when(A, () => [A.disc(Fa, -h - 2, -h, 4, { name: "axle.cap.far", owner: "axle" })])),
      // the axle: its far end shows, its middle hides under the plank, its near end is drawn after the plank
      item("axle.far", S(G.disc(-h, -w, r, Fa, P), { className: "jk-steel", crease: "none" }), when(A, () => [A.disc(Fa, -h, w, r, { name: "axle", owner: "axle" })])),
    ],
    near: [
      item("axle.near", S(G.disc(w, h, r, Fa, P), { className: "jk-steel", crease: "none" }), when(A, () => [A.disc(Fa, w, h, r, { name: "axle.near", owner: "axle" })])),
      item("axle.cap.near", S(G.disc(h, h + 2, 4, Fa, P), { className: "jk-steel" }), when(A, () => [A.disc(Fa, h, h + 2, 4, { name: "axle.cap.near", owner: "axle" })])),
    ],
  };
}

function rider(P, M, A, name, who, cls, pos, theta) {
  const c = Math.cos(theta * RAD);
  const s = Math.sin(theta * RAD);
  const top = M.PLANK.z1;
  const base = [pos * c - top * s, 0, M.AXLE_Z + pos * s + top * c];
  const n = [-s, 0, c];
  const F = G.frameOf(base, n, [c, 0, s], [0, 1, 0]);
  const V = G.viewOf(P);
  const head = G.add3(base, G.mul3(n, who.h + who.head));
  const Fh = G.frameAlong(head, V);
  const on = (lat, angle) => k.iso(G.pointOf(Fh, who.head * Math.cos(lat * RAD), who.head * Math.sin(lat * RAD), angle * RAD), P);
  const face = [
    `<g class="jk-cheek">${k.dotsSvg([on(42, 200), on(42, 340)], { size: who.head * 0.22 })}</g>`,
    `<g class="jk-eye">${k.dotsSvg([on(30, 145), on(30, 35)], { size: who.head * 0.13 })}</g>`,
    L(k.pathOf(Array.from({ length: 9 }, (_, i) => on(46, 230 + (i / 8) * 80))), { className: "jk-smile", free: true }),
  ].join("");
  const headShape = A ? A.ball(head, who.head, { name: `${name}.head`, owner: name }) : null;
  return [
    item(`${name}.body`, S(G.disc(0, who.h, who.r, F, P), { className: cls }), when(A, () => [A.disc(F, 0, who.h, who.r, { name: `${name}.body`, owner: name })])),
    item(`${name}.head`, S(G.sphereOf(head, who.head, P), { className: "jk-skin" }) + face, headShape ? [headShape] : []),
  ];
}

// Everything that turns with the plank: the plank, its seat marks and both friends.
export function seesawItems(P, M, big, little, theta, A) {
  const Fa = Fy([0, 0, M.AXLE_Z]);
  const R = turn(theta);
  const { half, w, z0, z1 } = M.PLANK;
  const poly = rect(-half, half, z0, z1).map(R);
  const marks = [];
  for (let step = -M.STEPS; step <= M.STEPS; step++) {
    if (!step) continue;
    const [x, z] = R([step * M.STEP, z1]);
    marks.push(k.pathOf([k.iso([x, -w, M.AXLE_Z + z], P), k.iso([x, w, M.AXLE_Z + z], P)]));
  }
  const plank = item("plank", S(G.prismOf(Fa, poly, -w, w, P), { className: "jk-yellow", inner: L(marks.join(""), { tone: "faint" }) }), when(A, () => [A.prism(Fa, poly, -w, w, { name: "plank" })]));
  const bigPos = -big * M.STEP;
  const littlePos = little * M.STEP;
  // the far friend first: with the viewer at +x +y, that is whoever sits at the -x end
  return [plank, ...rider(P, M, A, "big", M.BIG, "jk-red", bigPos, theta), ...rider(P, M, A, "little", M.LITTLE, "jk-blue", littlePos, theta)];
}

export const svgOf = (items) => items.map((it) => it.svg).join("");

export function figureItems(P, M, big, little, A) {
  const theta = tiltOf(M, big, little);
  const pivot = pivotItems(P, M, A);
  return [...lawnItems(P, M, A), ...pivot.far, ...seesawItems(P, M, big, little, theta, A), ...pivot.near];
}
