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
  BOX_H: 94,
  HINGE: [-50, -48, 97], // the lid turns about this x-axis; the knuckles sit on the back wall
  LID_OPEN: 105, // degrees
  SPRING_R: 13,
  SPRING_Z: 5, // top of the spring's base plate
  SPRING_WIRE: 0.9, // radius of the wire
  SPRING_TURNS: 6.5,
  H_OUT: 95, // spring height, stretched
  H_IN: 18, // spring height, squashed: the coils nearly touch
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
// An item is what the page draws and what the audit checks. `shapes` is only
// built when an audit module `A` is passed (never in the page).
const item = (name, svg, shapes) => ({ name, svg, shapes: shapes ?? [] });
const when = (A, make) => (A ? make() : []);

export function fit(M) {
  const open = turn(M.LID_OPEN)([98, 2]);
  const top = M.SPRING_Z + M.H_OUT * 1.12 + M.JACK_Z + 66;
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

export function baseItems(P, M, A) {
  const z0 = -M.PLATE_H - M.FOOT_H;
  const out = [item("halo", `<path class="iso-halo" d="${k.haloOf(M.PLATE, z0, M.PLATE_H, P)}"/>`)];
  for (const [x, y] of byDepth(k.corners(M.PLATE, 18), P)) {
    out.push(item("stand.foot", S(k.cylinder(x, y, 6.5, z0, M.FOOT_H, P, 24), { className: "jk-rubber", crease: "none" }), when(A, () => [A.cylinder(x, y, 6.5, z0, M.FOOT_H, { name: "stand.foot" })])));
  }
  const plate = [S(k.slabOf(M.PLATE, -M.PLATE_H, M.PLATE_H, P, 8, 1.4), { className: "jk-wood" })];
  // wood grain: lines that run edge to edge across the top
  for (const y of [-62, -30, 16, 44, 66]) plate.push(L(k.lineOnTop([M.PLATE.x, y], [M.PLATE.x + M.PLATE.w, y], 0, P), { tone: "faint", className: "jk-wood-line" }));
  plate.push(L(k.planOutline(k.insetPlan(M.PLATE, 6), 0, P), { tone: "faint", className: "jk-wood-line" }));
  const screws = k.corners(M.PLATE, 10);
  plate.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo", className: "jk-wood-line" }));
  plate.push(k.dotsSvg(screws.map(([x, y]) => k.iso([x, y, 0], P)), { size: 0.55 }));
  out.push(item("stand.plate", plate.join(""), when(A, () => [A.slab(M.PLATE, -M.PLATE_H, M.PLATE_H, { name: "stand.plate", ground: true })])));
  return out;
}

export function boxBackItems(P, M, A) {
  const { BOX, WALL, BOX_H } = M;
  const out = [];
  const back = { x: BOX.x, y: BOX.y, w: BOX.w, d: WALL, r: 1 };
  const left = { x: BOX.x, y: BOX.y + WALL, w: WALL, d: BOX.d - WALL, r: 1 };
  for (const [name, plan] of [["box.back", back], ["box.left", left]]) {
    out.push(item(name, S(k.slabOf(plan, 0, BOX_H, P, 2, 0.5), { className: "jk-mint", inner: L(k.sideSeam(plan, BOX_H - 6, P, 2), { tone: "faint" }) }), when(A, () => [A.slab(plan, 0, BOX_H, { name }, 2)])));
  }
  const floor = { x: BOX.x + WALL, y: BOX.y + WALL, w: BOX.w - WALL * 2, d: BOX.d - WALL * 2, r: 1 };
  out.push(item("box.floor", S(k.slabOf(floor, 0, 3, P, 2), { className: "jk-mint-dark" }), when(A, () => [A.slab(floor, 0, 3, { name: "box.floor" }, 2)])));
  // hinge knuckles standing on the back wall's top edge: the lid turns on these
  const [, hy, hz] = M.HINGE;
  for (const [name, x0, len, cls] of [["hinge.left", -44, 14, "jk-steel"], ["hinge.middle", -11, 22, "jk-mint"], ["hinge.right", 30, 14, "jk-steel"]]) {
    const F = Fx([x0, hy, hz]);
    out.push(item(name, S(G.disc(0, len, 3, F, P), { className: cls }), when(A, () => [A.disc(F, 0, len, 3, { name })])));
  }
  return out;
}

export function springBaseItems(P, M, A) {
  return [item("spring.base", S(k.cylinder(0, 0, 16, 3, M.SPRING_Z - 3, P, 40), { className: "jk-steel" }), when(A, () => [A.cylinder(0, 0, 16, 3, M.SPRING_Z - 3, { name: "spring.base" })]))];
}

export function wheelStaticItems(P, M, A) {
  const W = M.WHEEL;
  const F = Fx([W.x, W.y, W.z]);
  const wallIn = M.BOX.x + M.BOX.w - M.WALL - W.x; // s of the right wall's inner face
  return [
    item("wheel", S(G.disc(0, W.w, W.r, F, P), { className: "jk-yellow", inner: L(G.arcOf(F, W.w * 0.5, W.r, P), { tone: "faint" }) }), when(A, () => [A.disc(F, 0, W.w, W.r, { name: "wheel", owner: "wheel" })])),
    item("wheel.hub", S(G.disc(W.w, W.w + 1.5, 3.5, F, P), { className: "jk-steel" }), when(A, () => [A.disc(F, W.w, W.w + 1.5, 3.5, { name: "wheel.hub", owner: "wheel" })])),
    // the axle runs from the hub to the wall; it continues outside as part of the crank
    item("wheel.axle", S(G.disc(W.w + 1.5, wallIn, 2.2, F, P), { className: "jk-steel", crease: "none" }), when(A, () => [A.disc(F, W.w + 1.5, wallIn, 2.2, { name: "wheel.axle", owner: "wheel" })])),
  ];
}

export function latchMountItems(P, M, A) {
  const Lt = M.LATCH;
  const plan = { x: 42, y: Lt.y - 3, w: 4, d: 6, r: 0.6 };
  return [item("latch.block", S(k.slabOf(plan, Lt.z - 4, 8, P, 2), { className: "jk-mint-dark" }), when(A, () => [A.slab(plan, Lt.z - 4, 8, { name: "latch.block" }, 2)]))];
}

export function glassItems(P, M, A) {
  const { BOX, WALL, BOX_H } = M;
  const right = { x: BOX.x + BOX.w - WALL, y: BOX.y + WALL, w: WALL, d: BOX.d - WALL, r: 1 };
  const front = { x: BOX.x + WALL, y: BOX.y + BOX.d - WALL, w: BOX.w - WALL * 2, d: WALL, r: 1 };
  return [["box.front", front], ["box.right", right]].map(([name, plan]) =>
    item(name, S(k.slabOf(plan, 0, BOX_H, P, 2, 0.5), { className: "jk-glass", inner: L(k.sideSeam(plan, BOX_H - 6, P, 2), { tone: "faint" }) }), when(A, () => [A.slab(plan, 0, BOX_H, { name }, 2)])),
  );
}

// Jack, built once standing on his plate at z = z0 (0 in the page, where the spring
// moves him; the top of the spring for the audit, so his shapes are where he is drawn).
export function jackItems(P, M, A, z0 = 0) {
  const Z = M.JACK_Z + z0;
  const F = Fz([0, 0, 0]);
  const V = G.viewOf(P);
  const out = [];
  out.push(item("jack.plate", S(k.cylinder(0, 0, 13, z0, M.JACK_Z, P, 40), { className: "jk-steel" }), when(A, () => [A.cylinder(0, 0, 13, z0, M.JACK_Z, { name: "jack.plate", owner: "jack" })])));
  const body = [[Z, 11], [Z + 6, 12.5, 1], [Z + 15, 10.5, 1], [Z + 20, 7]];
  const facing = G.angleToward(F, V);
  out.push(item("jack.body", S(G.solidOf(body, F, P), { className: "jk-red" }) + `<g class="jk-eye">${k.dotsSvg([k.iso(G.pointOf(F, Z + 8, 12.1, facing), P), k.iso(G.pointOf(F, Z + 13, 11.2, facing), P)], { size: 1 })}</g>`, when(A, () => [A.solid(F, body, { name: "jack.body", owner: "jack" })])));
  out.push(item("jack.ruffle", S(G.disc(Z + 20, Z + 23, 14.5, F, P), { className: "jk-white" }), when(A, () => [A.disc(F, Z + 20, Z + 23, 14.5, { name: "jack.ruffle", owner: "jack" })])));
  out.push(item("jack.neck", S(G.disc(Z + 23, Z + 25, 4, F, P), { className: "jk-skin" }), when(A, () => [A.disc(F, Z + 23, Z + 25, 4, { name: "jack.neck", owner: "jack" })])));
  const head = [0, 0, Z + 35];
  const headShape = A ? A.ball(head, 10, { name: "jack.head", owner: "jack" }) : null;
  const Fh = G.frameAlong(head, V); // angle 0 is screen right, 90° is up
  const on = (lat, angle) => k.iso(G.pointOf(Fh, 10 * Math.cos(lat * RAD), 10 * Math.sin(lat * RAD), angle * RAD), P);
  const face = [
    `<g class="jk-cheek">${k.dotsSvg([on(40, 200), on(40, 340)], { size: 2 })}</g>`,
    `<g class="jk-eye">${k.dotsSvg([on(28, 145), on(28, 35)], { size: 1.2 })}</g>`,
    L(k.pathOf(Array.from({ length: 9 }, (_, i) => on(44, 230 + (i / 8) * 80))), { className: "jk-smile", free: true }),
  ].join("");
  out.push(item("jack.head", S(G.sphereOf(head, 10, P), { className: "jk-skin" }) + face, headShape ? [headShape] : []));
  const nose = G.add3(head, G.mul3(V, 10 + 1.9 - 0.4));
  out.push(item("jack.nose", S(G.sphereOf(nose, 1.9, P), { className: "jk-red" }), when(A, () => [A.ball(nose, 1.9, { name: "jack.nose", owner: "jack" })])));
  // the hat brim is a disc cut by the head it sits on
  out.push(item("jack.brim", S(G.disc(Z + 43, Z + 45, 10, F, P), { className: "jk-white" }), when(A, () => [A.disc(F, Z + 43, Z + 45, 10, { name: "jack.brim", owner: "jack", seated: true, cut: [headShape] })])));
  const cone = [[Z + 45, 8.5], [Z + 60, 0.4]];
  out.push(item("jack.hat", S(G.solidOf(cone, F, P), { className: "jk-red" }), when(A, () => [A.solid(F, cone, { name: "jack.hat", owner: "jack" })])));
  const pom = [0, 0, Z + 62.5];
  out.push(item("jack.pompom", S(G.sphereOf(pom, 2.8, P), { className: "jk-white" }), when(A, () => [A.ball(pom, 2.8, { name: "jack.pompom", owner: "jack" })])));
  return out;
}
export const JACK_TOP = (M) => M.JACK_Z + 65.3;

// --- parts rebuilt per frame ---

export function springPoints(M, h) {
  // the wire's centreline: it starts and ends one wire radius off the plates, so it rests on them
  const n = Math.round(M.SPRING_TURNS * 28);
  const z0 = M.SPRING_Z + M.SPRING_WIRE;
  const z1 = M.SPRING_Z + h - M.SPRING_WIRE;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = t * M.SPRING_TURNS * TAU;
    return [M.SPRING_R * Math.cos(a), M.SPRING_R * Math.sin(a), z0 + (z1 - z0) * t];
  });
}
export function springItems(P, M, h, A) {
  const points = springPoints(M, h);
  const d = k.pathOf(points.map((p) => k.iso(p, P)));
  return [item("spring", L(d, { className: "jk-spring-under" }) + L(d, { className: "jk-spring" }), when(A, () => [A.tube(points, M.SPRING_WIRE, { name: "spring", owner: "spring", ends: [false, false], touch: ["spring.base", "jack.plate"] })]))];
}

// The lid in two groups: the slab with its handle, and the catch pin with its
// bracket under it. Closed, the pin and bracket hang inside the box (behind the
// latch and the glass) while the slab sits on top of everything; open, the whole
// lid stands behind the figure with its underside toward the viewer.
export function lidTopItems(P, M, theta, A) {
  const F = Fx(M.HINGE);
  const R = turn(theta);
  // an inset groove on the top face, drawn only while that face points at the viewer
  const V = G.viewOf(P);
  const topFaces = -Math.sin(theta * RAD) * V[1] + Math.cos(theta * RAD) * V[2] > 0.05;
  const [a, b] = [R([7, 1]), R([92, 1])];
  const corner = (s, [y, z]) => k.iso([M.HINGE[0] + s, M.HINGE[1] + y, M.HINGE[2] + z], P);
  const groove = topFaces ? L(k.pathOf([corner(6, a), corner(94, a), corner(94, b), corner(6, b)], true), { tone: "faint" }) : "";
  // the lid rests on the walls (z' -3) and its back edge touches the knuckles (y' 3)
  const slabPoly = rect(3, 98, -3, 1).map(R);
  const handlePoly = rect(90, 98, 1, 4).map(R);
  const slab = item("lid", S(G.prismOf(F, slabPoly, 0, 100, P), { className: "jk-mint-lid", inner: groove }), when(A, () => [A.prism(F, slabPoly, 0, 100, { name: "lid", owner: "lid" })]));
  const handle = item("lid.handle", S(G.prismOf(F, handlePoly, 38, 62, P), { className: "jk-wood" }), when(A, () => [A.prism(F, handlePoly, 38, 62, { name: "lid.handle", owner: "lid" })]));
  return topFaces ? [slab, handle] : [handle, slab];
}
export function lidUnderItems(P, M, theta, A) {
  const F = Fx(M.HINGE);
  const R = turn(theta);
  // the bracket hangs behind the latch (x 30..33) and its pin reaches under the latch's lip
  const bracketPoly = rect(62.75, 65.75, -15, -3).map(R);
  const pinPoly = polyAt(10, 1.6, 64.25, -15).map(R);
  return [
    item("lid.bracket", S(G.prismOf(F, bracketPoly, 80, 83, P), { className: "jk-steel" }), when(A, () => [A.prism(F, bracketPoly, 80, 83, { name: "lid.bracket", owner: "lid" })])),
    item("lid.pin", S(G.prismOf(F, pinPoly, 83, 86.5, P), { className: "jk-steel", crease: "none" }), when(A, () => [A.prism(F, pinPoly, 83, 86.5, { name: "lid.pin", owner: "lid" })])),
  ];
}

// The peg stands on the wheel's back face, so it is drawn before the wheel; the
// spokes lie on its front face, so they come after.
export function pegItems(P, M, phi, A) {
  const W = M.WHEEL;
  const Fp = Fx(G.pointOf(Fx([W.x, W.y, W.z]), 0, M.PEG_AT, phi * RAD));
  return [item("wheel.peg", S(G.disc(-4, 0, M.PEG_R, Fp, P), { className: "jk-steel" }), when(A, () => [A.disc(Fp, -4, 0, M.PEG_R, { name: "wheel.peg", owner: "wheel" })]))];
}
export function spokesItems(P, M, phi) {
  const W = M.WHEEL;
  const F = Fx([W.x, W.y, W.z]);
  // spokes run from the hub's outline to the rim's
  return [item("wheel.spokes", `<g class="jk-yellow">${L(G.spokesOf(F, W.w + 0.05, 3.4, W.r, 3, P, { phase: phi * RAD }), { tone: "mid" })}</g>`)];
}

export function crankItems(P, M, phi, A) {
  const W = M.WHEEL;
  const C = M.CRANK;
  const wallOut = M.BOX.x + M.BOX.w;
  const Fa = Fx([wallOut, W.y, W.z]);
  const F = Fx([C.x, W.y, W.z]);
  const a = phi * RAD;
  const arm = G.hullOf([...polyAt(16, 3.2), ...polyAt(16, 3.2, C.arm * Math.cos(a), C.arm * Math.sin(a))]);
  const Fg = Fx(G.pointOf(F, 3, C.arm, a));
  return [
    item("crank.washer", S(G.disc(0, 1.5, 5, Fa, P), { className: "jk-steel" }), when(A, () => [A.disc(Fa, 0, 1.5, 5, { name: "crank.washer", owner: "crank" })])),
    item("crank.axle", S(G.disc(1.5, C.x - wallOut, 2.2, Fa, P), { className: "jk-steel", crease: "none" }), when(A, () => [A.disc(Fa, 1.5, C.x - wallOut, 2.2, { name: "crank.axle", owner: "crank" })])),
    item("crank.arm", S(G.prismOf(F, arm, 0, 3, P), { className: "jk-yellow" }), when(A, () => [A.prism(F, arm, 0, 3, { name: "crank.arm", owner: "crank" })])),
    item("crank.nut", S(G.disc(3, 5, 3, F, P), { className: "jk-steel" }), when(A, () => [A.disc(F, 3, 5, 3, { name: "crank.nut", owner: "crank" })])),
    // the grip's ribs run from rim to rim, so they end on the grip's own outline
    item("crank.grip", S(G.disc(0, C.grip, 3.2, Fg, P), { className: "jk-yellow", inner: k.fadedSvg(G.ribsOf(Fg, 0, C.grip, 3.2, 12, P, { fade: [0.1, 0.55] }), { tone: "faint" }) }), when(A, () => [A.disc(Fg, 0, C.grip, 3.2, { name: "crank.grip", owner: "crank" })])),
    item("crank.cap", S(G.disc(C.grip, C.grip + 1.2, 2.4, Fg, P), { className: "jk-steel" }), when(A, () => [A.disc(Fg, C.grip, C.grip + 1.2, 2.4, { name: "crank.cap", owner: "crank" })])),
  ];
}

export function latchItems(P, M, psi, A) {
  const Lt = M.LATCH;
  const F = Fx([Lt.x, Lt.y, Lt.z]);
  const R = turn(psi);
  const barPoly = rect(-Lt.w / 2, Lt.w / 2, -Lt.down, Lt.up).map(R);
  const lipPoly = rect(-6, -Lt.w / 2, Lt.up - 3, Lt.up).map(R); // hooks over the lid's pin, behind the bar
  return [
    item("latch.pin.back", S(G.disc(-3, 0, 1.6, F, P), { className: "jk-steel", crease: "none" }), when(A, () => [A.disc(F, -3, 0, 1.6, { name: "latch.pin.back", owner: "latch" })])),
    item("latch.lip", S(G.prismOf(F, lipPoly, 0, 3, P), { className: "jk-steel" }), when(A, () => [A.prism(F, lipPoly, 0, 3, { name: "latch.lip", owner: "latch" })])),
    item("latch.bar", S(G.prismOf(F, barPoly, 0, 3, P), { className: "jk-steel" }), when(A, () => [A.prism(F, barPoly, 0, 3, { name: "latch.bar", owner: "latch" })])),
    item("latch.pin.front", S(G.disc(3, 9, 1.6, F, P), { className: "jk-steel", crease: "none" }), when(A, () => [A.disc(F, 3, 9, 1.6, { name: "latch.pin.front", owner: "latch" })])),
  ];
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

export const svgOf = (items) => items.map((it) => it.svg).join("");

// Which assembly each part leaves with when the toy is taken apart.
export function pieceOf(name) {
  if (name.startsWith("lid")) return "lid";
  if (name.startsWith("jack") || name.startsWith("spring")) return "jack";
  if (name === "box.front" || name === "box.right") return "glass";
  if (name.startsWith("crank")) return "crank";
  return "";
}

// The whole figure in one pose, in painter's order. `pose` is "out" or "in".
export function figureItems(P, M, pose, A) {
  return figureOrder(P, M, pose, A).map((it) => ({ ...it, piece: pieceOf(it.name) }));
}
function figureOrder(P, M, pose, A) {
  const h = pose === "in" ? M.H_IN : M.H_OUT;
  const theta = pose === "in" ? 0 : M.LID_OPEN;
  const open = theta > 60;
  const top = lidTopItems(P, M, theta, A);
  const under = lidUnderItems(P, M, theta, A);
  return [
    ...baseItems(P, M, A),
    ...boxBackItems(P, M, A),
    ...(open ? [...top, ...under] : []), // open, the lid stands behind everything
    ...springBaseItems(P, M, A),
    ...springItems(P, M, h, A),
    ...jackItems(P, M, A, M.SPRING_Z + h),
    ...pegItems(P, M, M.PEG_START, A),
    ...wheelStaticItems(P, M, A),
    ...spokesItems(P, M, M.PEG_START),
    ...(open ? [] : under), // closed, the catch hangs inside, behind the latch
    ...latchItems(P, M, 0, A),
    ...latchMountItems(P, M, A),
    ...glassItems(P, M, A),
    ...(open ? [] : top), // closed, the lid sits on top of the walls, nearer than all of them
    ...crankItems(P, M, M.PEG_START, A),
  ];
}
