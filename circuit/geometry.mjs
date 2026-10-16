import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../kit/tube.mjs";

// A battery, a knife switch and a lamp on a wooden board, joined by three wires.
// The switch blade turns about an axis along y at the top of its hinge post.
export const M = {
  WIDTH: 600,
  HEIGHT: 420,
  PLATE: { x: -100, y: -70, w: 200, d: 140, r: 8 },
  PLATE_H: 8,
  FOOT_H: 4,
  HOLDER: { x: -72, y: -42, w: 44, d: 24, r: 2 },
  BATTERY: { o: [-70, -30, 12], len: 40, r: 9 }, // along +x, resting on the holder
  SWITCH: { base: { x: -66, y: 22, w: 34, d: 14, r: 1.5 }, post: [-58, 29], postR: 3, postTop: 11, clip: { x: -43, y: 26, w: 5, d: 6, r: 0.8 }, blade: 20, bladeT: 1.5, bladeW: 3, open: 40 },
  LAMP: { at: [40, 0], baseR: 8, baseH: 10, collarR: 5.5, collarH: 6, neckR: 3, neckH: 4, bulbR: 9 },
  WIRE_R: 0.8,
};

const RAD = Math.PI / 180;
const Fx = (o) => G.frameOf(o, [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const Fy = (o) => G.frameOf(o, [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const item = (name, svg, shapes) => ({ name, svg, shapes: shapes ?? [] });
const when = (A, make) => (A ? make() : []);

export function fit(M) {
  const top = M.LAMP.baseH + M.LAMP.collarH + M.LAMP.neckH + M.LAMP.bulbR * 2 + 4;
  return k.fitProjection([...k.boxCorners(M.PLATE, -M.PLATE_H - M.FOOT_H, 0), [M.LAMP.at[0], M.LAMP.at[1], top]], M.WIDTH, M.HEIGHT, { pad: 22, azimuth: 42, elevation: 32 });
}

export function boardItems(P, M, A) {
  const z0 = -M.PLATE_H - M.FOOT_H;
  const out = [];
  const feet = [...k.corners(M.PLATE, 16)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) out.push(item("stand.foot", S(k.cylinder(x, y, 6, z0, M.FOOT_H, P, 24), { className: "jk-rubber", crease: "none" }), when(A, () => [A.cylinder(x, y, 6, z0, M.FOOT_H, { name: "stand.foot" })])));
  const svg = [`<path class="iso-halo" d="${k.haloOf(M.PLATE, z0, M.PLATE_H, P)}"/>`, S(k.slabOf(M.PLATE, -M.PLATE_H, M.PLATE_H, P, 8, 1.2), { className: "jk-wood" })];
  for (const y of [-58, -8, 52]) svg.push(L(k.lineOnTop([M.PLATE.x, y], [M.PLATE.x + M.PLATE.w, y], 0, P), { tone: "faint", className: "jk-wood-line" }));
  const screws = k.corners(M.PLATE, 8);
  svg.push(L(screws.map(([x, y]) => k.ring(x, y, 1.8, 0, P, 16)).join(""), { tone: "lo", className: "jk-wood-line" }));
  svg.push(k.dotsSvg(screws.map(([x, y]) => k.iso([x, y, 0], P)), { size: 0.5 }));
  out.push(item("stand.board", svg.join(""), when(A, () => [A.slab(M.PLATE, -M.PLATE_H, M.PLATE_H, { name: "stand.board", ground: true })])));
  return out;
}

export function batteryItems(P, M, A) {
  const B = M.BATTERY;
  const F = Fx(B.o);
  const H = M.HOLDER;
  return [
    item("battery.holder", S(k.slabOf(H, 0, 3, P, 3, 0.4), { className: "jk-rubber" }), when(A, () => [A.slab(H, 0, 3, { name: "battery.holder" }, 3)])),
    item("battery.minus", S(G.disc(-2, 0, 4, F, P), { className: "jk-brass" }), when(A, () => [A.disc(F, -2, 0, 4, { name: "battery.minus", owner: "battery" })])),
    item("battery.body", S(G.disc(0, B.len, B.r, F, P), { className: "jk-blue", inner: L(G.arcOf(F, 30, B.r, P), { tone: "faint" }) + L(G.arcOf(F, 34, B.r, P), { tone: "faint" }) }), when(A, () => [A.disc(F, 0, B.len, B.r, { name: "battery.body", owner: "battery" })])),
    item("battery.band", S(G.disc(30, 34, B.r + 0.05, F, P), { className: "jk-white" }), when(A, () => [A.disc(F, 30, 34, B.r + 0.05, { name: "battery.band", owner: "battery" })])),
    item("battery.plus", S(G.disc(B.len, B.len + 3, 3, F, P), { className: "jk-brass" }), when(A, () => [A.disc(F, B.len, B.len + 3, 3, { name: "battery.plus", owner: "battery" })])),
  ];
}

export function switchBaseItems(P, M, A) {
  const W = M.SWITCH;
  const [px, py] = W.post;
  return [
    item("switch.base", S(k.slabOf(W.base, 0, 3, P, 3, 0.4), { className: "jk-rubber" }), when(A, () => [A.slab(W.base, 0, 3, { name: "switch.base" }, 3)])),
    item("switch.post", S(k.cylinder(px, py, W.postR, 3, W.postTop - 3, P, 24), { className: "jk-brass" }), when(A, () => [A.cylinder(px, py, W.postR, 3, W.postTop - 3, { name: "switch.post" })])),
    item("switch.clip", S(k.slabOf(W.clip, 3, W.postTop - 3, P, 2, 0.4), { className: "jk-brass" }), when(A, () => [A.slab(W.clip, 3, W.postTop - 3, { name: "switch.clip" }, 2)])),
  ];
}

// The blade and its knob, turned `deg` up from the clip about the post's top.
export function bladeItems(P, M, deg, A) {
  const W = M.SWITCH;
  const [px, py] = W.post;
  const F = Fy([px, py, W.postTop]);
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  const R = ([x, z]) => [x * c - z * s, x * s + z * c];
  const poly = [[0, 0], [W.blade, 0], [W.blade, W.bladeT], [0, W.bladeT]].map(R);
  const knobAt = R([W.blade - 2.5, W.bladeT + 2.2]);
  const knob = [px + knobAt[0], py, W.postTop + knobAt[1]];
  const blade = S(G.prismOf(F, poly, -W.bladeW, W.bladeW, P), { className: "jk-brass" }) + S(G.sphereOf(knob, 2.2, P), { className: "jk-red" });
  return [item("switch.blade", blade, when(A, () => [A.prism(F, poly, -W.bladeW, W.bladeW, { name: "switch.blade", owner: "blade" }), A.ball(knob, 2.2, { name: "switch.knob", owner: "blade" })]))];
}

export function lampItems(P, M, A) {
  const Lp = M.LAMP;
  const [x, y] = Lp.at;
  const z1 = Lp.baseH;
  const z2 = z1 + Lp.collarH;
  const z3 = z2 + Lp.neckH;
  const bulb = [x, y, z3 + Lp.bulbR];
  const [gx, gy] = k.iso(bulb, P);
  return [
    item("lamp.base", S(k.cylinder(x, y, Lp.baseR, 0, Lp.baseH, P, 32, 0.4), { className: "jk-rubber" }), when(A, () => [A.cylinder(x, y, Lp.baseR, 0, Lp.baseH, { name: "lamp.base" })])),
    item("lamp.collar", S(k.cylinder(x, y, Lp.collarR, z1, Lp.collarH, P, 28), { className: "jk-brass", inner: L(k.sideArc(x, y, Lp.collarR, z1 + 2, P, 16) + k.sideArc(x, y, Lp.collarR, z1 + 4, P, 16), { tone: "faint" }) }), when(A, () => [A.cylinder(x, y, Lp.collarR, z1, Lp.collarH, { name: "lamp.collar" })])),
    item("lamp.neck", S(k.cylinder(x, y, Lp.neckR, z2, Lp.neckH, P, 20), { className: "jk-steel", crease: "none" }), when(A, () => [A.cylinder(x, y, Lp.neckR, z2, Lp.neckH, { name: "lamp.neck" })])),
    item("lamp.glow", `<circle class="cx-glow" cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="${(Lp.bulbR * 1.9 * P.scale).toFixed(1)}"/>`),
    item("lamp.bulb", `<g class="cx-bulb">${S(G.sphereOf(bulb, Lp.bulbR, P), { className: "jk-white" })}</g>`, when(A, () => [A.ball(bulb, Lp.bulbR, { name: "lamp.bulb" })])),
  ];
}

// The three wires as straight legs between real terminals, rounded at the corners.
export function wireRoutes(M, P) {
  const B = M.BATTERY;
  const W = M.SWITCH;
  const Lp = M.LAMP;
  const plus = [B.o[0] + B.len + 3, B.o[1], B.o[2]];
  const minus = [B.o[0] - 2, B.o[1], B.o[2]];
  const post = [W.post[0], W.post[1] - W.postR, 6];
  const clip = [W.clip.x + W.clip.w, W.clip.y + W.clip.d / 2, 7];
  const lampIn = [Lp.at[0] - Lp.baseR, Lp.at[1], 5];
  const lampOut = [Lp.at[0], Lp.at[1] - Lp.baseR, 5];
  return [
    { name: "wire.plus", legs: [plus, [-18, B.o[1], 12], [-18, 14, 6], [W.post[0], 14, 6], post] },
    { name: "wire.lamp", legs: [clip, [-10, clip[1], 7], [-10, 0, 5], lampIn] },
    { name: "wire.back", legs: [lampOut, [Lp.at[0], -52, 5], [-92, -52, 5], [-92, B.o[1], 12], minus] },
    // bends grow to face the camera, so a wire never pinches to a V on screen
  ].map((route) => ({ ...route, points: G.fillet(route.legs, 3, 7, { P, tube: M.WIRE_R, margin: 2 }) }));
}

export function wireItems(P, M, A) {
  const out = [];
  for (const route of wireRoutes(M, P)) {
    const pieces = tubePieces(route.points, M.WIRE_R, P, { maxLength: 14 });
    pieces.forEach((piece, index) => {
      out.push({
        ...item(`${route.name}#${index}`, `<g class="cx-wire">${tubeSvg(piece, { tone: "lo" })}</g>`),
        route: A ? { name: route.name, points: route.points, r: M.WIRE_R, limp: true, touch: ["stand.board"] } : undefined,
        at: piece.mid,
      });
    });
  }
  return out;
}

// Dashed lines that run along each wire while the current flows, each ending
// in a dot where it enters a terminal.
export function flowSvg(P, M) {
  return wireRoutes(M, P)
    .map((route) => {
      const flat = route.points.map((p) => k.iso(p, P));
      return `<g class="cx-flow">${k.wireSvg(flat[0], flat[flat.length - 1], { via: flat.slice(1, -1), tone: "blue", flow: true, size: 1.1 })}</g>`;
    })
    .join("");
}

export const svgOf = (items) => items.map((it) => it.svg).join("");

export function figureItems(P, M, deg, A) {
  return [...boardItems(P, M, A), ...batteryItems(P, M, A), ...switchBaseItems(P, M, A), ...bladeItems(P, M, deg, A), ...lampItems(P, M, A), ...wireItems(P, M, A)];
}
