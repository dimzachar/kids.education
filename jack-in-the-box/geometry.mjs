import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";

// World units are about 1 px of the real toy. x and y lie on the floor, z is up.
// The viewer stands at +x +y (azimuth 40°), so the +x and +y walls are the near, see-through ones.
export const M = {
  WIDTH: 600,
  HEIGHT: 500,
  PLATE: { x: -80, y: -80, w: 160, d: 160, r: 8 },
  PLATE_H: 10,
  FOOT_H: 4,
  BOX: { x: -50, y: -50, w: 100, d: 100, r: 3 },
  WALL: 4,
  BOX_H: 90,
  HINGE: [-50, -48, 92], // the lid turns about this x-axis
  LID_OPEN: 105, // degrees
  LID_MAX: 126, // the furthest the lid spring overshoots
  SPRING_R: 13,
  SPRING_Z: 5, // top of the spring's base plate
  SPRING_TURNS: 6.5,
  H_OUT: 95, // spring height, stretched
  H_IN: 10, // spring height, squashed
  JACK_Z: 2, // Jack stands on a 2-thick plate riding the spring
  WHEEL: { x: 38, y: 22, z: 42, r: 17, w: 6 },
  PEG_AT: 13, // peg radius from the wheel centre
  PEG_R: 2,
  CRANK: { x: 62, arm: 16, grip: 11 },
  LATCH: { x: 33, y: 20, z: 74, w: 3, down: 17, up: 13 },
  LATCH_OPEN: -30, // degrees the peg pushes the latch through
  TURN: 110, // degrees of crank per turn of the handle
  PEG_START: 120, // the peg rests just past the latch (90° is the latch)
  TURNS: 3,
};

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const Fx = (o) => G.frameOf(o, [1, 0, 0], [0, 1, 0], [0, 0, 1]); // along x: (y, z) in the frame plane
const Fz = (o) => G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]); // along z
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const turn = (deg) => {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return ([y, z]) => [y * c - z * s, y * s + z * c];
};
const rect = (y0, y1, z0, z1) => [
  [y0, z0],
  [y1, z0],
  [y1, z1],
  [y0, z1],
];
const polyAt = (n, r, cy = 0, cz = 0) => Array.from({ length: n }, (_, i) => [cy + r * Math.cos((i / n) * TAU), cz + r * Math.sin((i / n) * TAU)]);
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function fit(M) {
  const open = turn(M.LID_OPEN)([98, 2]);
  const top = M.SPRING_Z + M.H_OUT * 1.12 + M.JACK_Z + 72;
  const points = [
    ...k.boxCorners(M.PLATE, -M.PLATE_H - M.FOOT_H, 0),
    [0, 0, top],
    [M.CRANK.x + 16, M.WHEEL.y + M.CRANK.arm + 4, M.WHEEL.z + M.CRANK.arm + 4],
    [50, M.HINGE[1] + open[0], M.HINGE[2] + open[1]],
    [-50, M.HINGE[1] + open[0], M.HINGE[2] + open[1]],
  ];
  return k.fitProjection(points, M.WIDTH, M.HEIGHT, { pad: 18, azimuth: 40, elevation: 30 });
}

const byDepth = (points, P) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// --- static art ---

export function baseSvg(P, M) {
  const z0 = -M.PLATE_H - M.FOOT_H;
  const out = [`<path class="iso-halo" d="${k.haloOf(M.PLATE, z0, M.PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(M.PLATE, 18), P)) {
    out.push(S(k.cylinder(x, y, 6.5, z0, M.FOOT_H, P, 24), { className: "jk-rubber", crease: "none" }));
  }
  out.push(S(k.slabOf(M.PLATE, -M.PLATE_H, M.PLATE_H, P, 8, 1.4), { className: "jk-wood" }));
  // wood grain: lines that run edge to edge across the top
  for (const y of [-62, -30, 16, 44, 66]) {
    out.push(L(k.lineOnTop([M.PLATE.x, y], [M.PLATE.x + M.PLATE.w, y], 0, P), { tone: "faint", className: "jk-wood-line" }));
  }
  out.push(L(k.planOutline(k.insetPlan(M.PLATE, 6), 0, P), { tone: "faint", className: "jk-wood-line" }));
  const screws = k.corners(M.PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo", className: "jk-wood-line" }));
  out.push(k.dotsSvg(screws.map(([x, y]) => k.iso([x, y, 0], P)), { size: 0.55 }));
  return out.join("");
}

export function boxBackSvg(P, M) {
  const { BOX, WALL, BOX_H } = M;
  const out = [];
  const floor = { x: BOX.x + WALL, y: BOX.y + WALL, w: BOX.w - WALL * 2, d: BOX.d - WALL * 2, r: 1 };
  out.push(S(k.slabOf(floor, 0, 3, P, 2), { className: "jk-mint-dark" }));
  const back = { x: BOX.x, y: BOX.y, w: BOX.w, d: WALL, r: 1 };
  const left = { x: BOX.x, y: BOX.y + WALL, w: WALL, d: BOX.d - WALL, r: 1 };
  for (const plan of [back, left]) {
    out.push(S(k.slabOf(plan, 0, BOX_H, P, 2, 0.5), { className: "jk-mint", inner: L(k.sideSeam(plan, BOX_H - 6, P, 2), { tone: "faint" }) }));
  }
  // hinge knuckles along the back top edge: the lid turns on these
  const hinge = M.HINGE;
  out.push(S(G.disc(0, 14, 3, Fx([-44, hinge[1], hinge[2]]), P), { className: "jk-steel" }));
  out.push(S(G.disc(0, 22, 3, Fx([-11, hinge[1], hinge[2]]), P), { className: "jk-mint" }));
  out.push(S(G.disc(0, 14, 3, Fx([30, hinge[1], hinge[2]]), P), { className: "jk-steel" }));
  // the latch's mounting block, on the inside of the right wall
  return out.join("");
}

export function springBaseSvg(P, M) {
  return S(k.cylinder(0, 0, 16, 3, M.SPRING_Z - 3, P, 40), { className: "jk-steel" });
}

export function wheelStaticSvg(P, M) {
  const W = M.WHEEL;
  const F = Fx([W.x, W.y, W.z]);
  const out = [];
  out.push(S(G.disc(0, W.w, W.r, F, P), { className: "jk-yellow", inner: L(G.arcOf(F, W.w * 0.5, W.r, P), { tone: "faint" }) }));
  out.push(S(G.disc(W.w, W.w + 1.5, 3.5, F, P), { className: "jk-steel" }));
  // axle from the hub into the wall; the part outside the box is drawn with the crank
  out.push(S(G.disc(W.w + 1.5, 50 - W.x, 2.2, F, P), { className: "jk-steel", crease: "none" }));
  return out.join("");
}

export function latchMountSvg(P, M) {
  const Lt = M.LATCH;
  return S(k.slabOf({ x: 42, y: Lt.y - 3, w: 4, d: 6, r: 0.6 }, Lt.z - 4, 8, P, 2), { className: "jk-mint-dark" });
}

export function glassSvg(P, M) {
  const { BOX, WALL, BOX_H } = M;
  const right = { x: BOX.x + BOX.w - WALL, y: BOX.y + WALL, w: WALL, d: BOX.d - WALL, r: 1 };
  const front = { x: BOX.x + WALL, y: BOX.y + BOX.d - WALL, w: BOX.w - WALL * 2, d: WALL, r: 1 };
  return [right, front].map((plan) => S(k.slabOf(plan, 0, BOX_H, P, 2, 0.5), { className: "jk-glass", inner: L(k.sideSeam(plan, BOX_H - 6, P, 2), { tone: "faint" }) })).join("");
}

export function jackSvg(P, M) {
  const Z = M.JACK_Z;
  const F = Fz([0, 0, 0]);
  const V = G.viewOf(P);
  const out = [];
  out.push(S(k.cylinder(0, 0, 13, 0, Z, P, 40), { className: "jk-steel" }));
  out.push(S(G.solidOf([[Z, 11], [Z + 6, 12.5, 1], [Z + 16, 11, 1], [Z + 22, 7]], F, P), { className: "jk-red" }));
  const facing = G.angleToward(F, V);
  out.push(`<g class="jk-eye">${k.dotsSvg([k.iso(G.pointOf(F, Z + 8, 12.1, facing), P), k.iso(G.pointOf(F, Z + 14, 11.4, facing), P)], { size: 1 })}</g>`);
  out.push(S(G.disc(Z + 22, Z + 25, 14.5, F, P), { className: "jk-white" }));
  out.push(S(G.disc(Z + 25, Z + 28, 4, F, P), { className: "jk-skin" }));
  const head = [0, 0, Z + 38];
  out.push(S(G.sphereOf(head, 11, P), { className: "jk-skin" }));
  const Fh = G.frameAlong(head, V); // angle 0 is screen right, 90° is up
  const on = (lat, angle) => k.iso(G.pointOf(Fh, 11 * Math.cos(lat * RAD), 11 * Math.sin(lat * RAD), angle * RAD), P);
  out.push(`<g class="jk-cheek">${k.dotsSvg([on(40, 200), on(40, 340)], { size: 2.2 })}</g>`);
  out.push(`<g class="jk-eye">${k.dotsSvg([on(28, 145), on(28, 35)], { size: 1.3 })}</g>`);
  const smile = Array.from({ length: 9 }, (_, i) => on(44, 230 + (i / 8) * 80));
  out.push(L(k.pathOf(smile), { className: "jk-smile", free: true }));
  out.push(S(G.sphereOf(G.add3(head, G.mul3(V, 10.4)), 2.1, P), { className: "jk-red" }));
  out.push(S(G.disc(Z + 47, Z + 49, 11, F, P), { className: "jk-white" }));
  out.push(S(G.solidOf([[Z + 49, 9.5], [Z + 66, 0.4]], F, P), { className: "jk-red" }));
  out.push(S(G.sphereOf([0, 0, Z + 68], 3.2, P), { className: "jk-white" }));
  return out.join("");
}

// --- parts rebuilt per frame ---

export function springSvg(P, M, h) {
  const n = Math.round(M.SPRING_TURNS * 28);
  const points = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * M.SPRING_TURNS * TAU;
    points.push(k.iso([M.SPRING_R * Math.cos(a), M.SPRING_R * Math.sin(a), M.SPRING_Z + h * t], P));
  }
  const d = k.pathOf(points);
  return L(d, { className: "jk-spring-under" }) + L(d, { className: "jk-spring" });
}

export function lidSvg(P, M, theta) {
  const F = Fx(M.HINGE);
  const R = turn(theta);
  // an inset groove on the top face, drawn only while that face points at the viewer
  const V = G.viewOf(P);
  const topFaces = -Math.sin(theta * RAD) * V[1] + Math.cos(theta * RAD) * V[2] > 0.05;
  const [a, b] = [R([4, 2]), R([92, 2])];
  const corner = (s, [y, z]) => k.iso([M.HINGE[0] + s, M.HINGE[1] + y, M.HINGE[2] + z], P);
  const groove = topFaces ? L(k.pathOf([corner(6, a), corner(94, a), corner(94, b), corner(6, b)], true), { tone: "faint" }) : "";
  const slab = S(G.prismOf(F, rect(-2, 98, -2, 2).map(R), 0, 100, P), { className: "jk-mint-lid", inner: groove });
  const handle = S(G.prismOf(F, rect(90, 98, 2, 5).map(R), 38, 62, P), { className: "jk-wood" });
  const pin = S(G.prismOf(F, polyAt(10, 1.6, 71.75, -10).map(R), 81, 90, P), { className: "jk-steel", crease: "none" });
  const bracket = S(G.prismOf(F, rect(70.25, 73.25, -10, -2).map(R), 86.5, 90, P), { className: "jk-steel" });
  return theta > 60 ? slab + handle + pin + bracket : pin + bracket + slab + handle;
}

export function wheelLiveSvg(P, M, phi) {
  const W = M.WHEEL;
  const F = Fx([W.x, W.y, W.z]);
  const out = [];
  out.push(`<g class="jk-yellow">${L(G.spokesOf(F, W.w + 0.05, 4.5, W.r - 2.5, 3, P, { phase: phi * RAD }), { tone: "mid" })}</g>`);
  const Fp = Fx(G.pointOf(F, 0, M.PEG_AT, phi * RAD));
  out.push(S(G.disc(-4, 0, M.PEG_R, Fp, P), { className: "jk-steel" }));
  return out.join("");
}

export function crankSvg(P, M, phi) {
  const W = M.WHEEL;
  const C = M.CRANK;
  const Fa = Fx([50, W.y, W.z]);
  const F = Fx([C.x, W.y, W.z]);
  const out = [];
  out.push(S(G.disc(0, C.x - 50, 2.2, Fa, P), { className: "jk-steel", crease: "none" }));
  out.push(S(G.disc(0, 1.5, 5, Fa, P), { className: "jk-steel" }));
  const a = phi * RAD;
  const arm = G.hullOf([...polyAt(16, 3.2), ...polyAt(16, 3.2, C.arm * Math.cos(a), C.arm * Math.sin(a))]);
  out.push(S(G.prismOf(F, arm, 0, 3, P), { className: "jk-yellow" }));
  out.push(S(G.disc(3, 5, 3, F, P), { className: "jk-steel" }));
  const Fg = Fx(G.pointOf(F, 3, C.arm, a));
  out.push(S(G.disc(0, C.grip, 3.2, Fg, P), { className: "jk-yellow", inner: k.fadedSvg(G.ribsOf(Fg, 1.5, C.grip - 1.5, 3.2, 12, P, { fade: [0.1, 0.55] }), { tone: "faint" }) }));
  out.push(S(G.disc(C.grip, C.grip + 1.2, 2.4, Fg, P), { className: "jk-steel" }));
  return out.join("");
}

export function latchSvg(P, M, psi) {
  const Lt = M.LATCH;
  const F = Fx([Lt.x, Lt.y, Lt.z]);
  const R = turn(psi);
  const out = [];
  out.push(S(G.disc(-3, 0, 1.6, F, P), { className: "jk-steel", crease: "none" }));
  out.push(S(G.prismOf(F, rect(-Lt.w / 2, Lt.w / 2, -Lt.down, Lt.up).map(R), 0, 3, P), { className: "jk-steel" }));
  out.push(S(G.prismOf(F, rect(Lt.w / 2, 6, Lt.up - 3, Lt.up).map(R), 0, 3, P), { className: "jk-steel" }));
  out.push(S(G.disc(3, 9, 1.6, F, P), { className: "jk-steel", crease: "none" }));
  return out.join("");
}

// How far the peg has pushed the latch open at this crank angle: it meets the
// latch's foot just before the top of its circle and slips past just after.
export function latchAngle(M, phi) {
  const a = ((phi % 360) + 360) % 360;
  return M.LATCH_OPEN * smooth(82, 91, a) * (1 - smooth(99, 110, a));
}

export function popSvg(P, M) {
  const at = k.iso([10, 70, 150], P);
  const stars = [
    [-40, 70, 165],
    [40, 110, 140],
    [-70, 20, 150],
    [20, 20, 175],
    [60, 60, 120],
  ].map((p, i) => {
    const [x, y] = k.iso(p, P);
    return `<circle class="jk-star" style="--d:${i * 70}ms" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${3 + (i % 2)}"/>`;
  });
  return `<g class="jk-popfx" data-part="pop">${stars.join("")}<text class="jk-pop" x="${at[0].toFixed(1)}" y="${at[1].toFixed(1)}" text-anchor="middle">POP!</text></g>`;
}
