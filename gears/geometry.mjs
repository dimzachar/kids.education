import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";

// Two gears on posts on a wooden board. The big one has 24 teeth, the little one
// 12, so one turn of the big gear is two turns of the little one, the other way.
export const M = {
  WIDTH: 600,
  HEIGHT: 420,
  PLATE: { x: -104, y: -70, w: 208, d: 140, r: 8 },
  PLATE_H: 8,
  FOOT_H: 4,
  MODULE: 3, // tooth size: pitch diameter / teeth
  BIG: { at: [-26, 0], teeth: 24, cls: "jk-brass", pointer: "jk-red", mark: "red" },
  LITTLE: { at: [28, 0], teeth: 12, cls: "jk-mint-dark", pointer: "jk-blue", mark: "blue" },
  GEAR_Z: 10,
  GEAR_H: 6,
  POST_R: 4,
  CAP_R: 5.5,
  CAP_H: 2,
  BAR_H: 1.5,
  KNOB: { r: 3, h: 10, at: 28 },
  QUARTER: 90,
};

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const Fz = (o) => G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const item = (name, svg, shapes) => ({ name, svg, shapes: shapes ?? [] });
const when = (A, make) => (A ? make() : []);

export const pitchRadius = (M, gear) => (M.MODULE * gear.teeth) / 2;

export function fit(M) {
  const top = M.GEAR_Z + M.GEAR_H + M.CAP_H + M.KNOB.h + 4;
  return k.fitProjection([...k.boxCorners(M.PLATE, -M.PLATE_H - M.FOOT_H, 0), [M.BIG.at[0], M.BIG.at[1], top]], M.WIDTH, M.HEIGHT, { pad: 22, azimuth: 45, elevation: 34 });
}

// A gear is a round body plus one trapezoid tooth per pitch. Tips are narrower
// than roots and gaps wider than teeth by a hair, so two gears mesh with a little
// clearance. Each tooth is its own solid, so where the teeth of two gears
// interleave on screen every tooth can be painted at its own depth.
export const rootRadius = (M, gear) => pitchRadius(M, gear) - 1.25 * M.MODULE;
export const tipRadius = (M, gear) => pitchRadius(M, gear) + M.MODULE;
export function toothQuad(M, gear, index, deg) {
  const root = rootRadius(M, gear); // the root sits on the body's rim
  const tip = tipRadius(M, gear);
  const p = TAU / gear.teeth;
  const a = index * p + deg * RAD;
  return [[-0.3 * p, root], [-0.14 * p, tip], [0.14 * p, tip], [0.3 * p, root]].map(([da, r]) => [gear.at[0] + r * Math.cos(a + da), gear.at[1] + r * Math.sin(a + da)]);
}

// The little gear's angle for a big gear angle: it turns the other way, teeth times faster,
// and starts half a tooth round so a gap faces the big gear's first tooth.
export const littleAngle = (M, big) => -big * (M.BIG.teeth / M.LITTLE.teeth) + 180 / M.LITTLE.teeth;

export function boardItems(P, M, A) {
  const z0 = -M.PLATE_H - M.FOOT_H;
  const out = [];
  const feet = [...k.corners(M.PLATE, 16)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) out.push(item("stand.foot", S(k.cylinder(x, y, 6, z0, M.FOOT_H, P, 24), { className: "jk-rubber", crease: "none" }), when(A, () => [A.cylinder(x, y, 6, z0, M.FOOT_H, { name: "stand.foot" })])));
  const svg = [`<path class="iso-halo" d="${k.haloOf(M.PLATE, z0, M.PLATE_H, P)}"/>`, S(k.slabOf(M.PLATE, -M.PLATE_H, M.PLATE_H, P, 8, 1.2), { className: "jk-wood" })];
  for (const y of [-54, -22, 14, 48]) svg.push(L(k.lineOnTop([M.PLATE.x, y], [M.PLATE.x + M.PLATE.w, y], 0, P), { tone: "faint", className: "jk-wood-line" }));
  const screws = k.corners(M.PLATE, 8);
  svg.push(L(screws.map(([x, y]) => k.ring(x, y, 1.8, 0, P, 16)).join(""), { tone: "lo", className: "jk-wood-line" }));
  svg.push(k.dotsSvg(screws.map(([x, y]) => k.iso([x, y, 0], P)), { size: 0.5 }));
  out.push(item("stand.board", svg.join(""), when(A, () => [A.slab(M.PLATE, -M.PLATE_H, M.PLATE_H, { name: "stand.board", ground: true })])));
  return out;
}

export function postItems(P, M, gear, name, A) {
  const [x, y] = gear.at;
  return [item(`${name}.post`, S(k.cylinder(x, y, M.POST_R, 0, M.GEAR_Z, P, 28), { className: "jk-steel", crease: "none" }), when(A, () => [A.cylinder(x, y, M.POST_R, 0, M.GEAR_Z, { name: `${name}.post` })]))];
}

// A gear with its teeth, pointer bar and cap, at this angle, each item carrying
// its centre `at` so the two gears' parts can be sorted by depth together.
// The big gear also carries the crank knob.
export function gearItems(P, M, gear, name, deg, A) {
  const [x, y] = gear.at;
  const z1 = M.GEAR_Z + M.GEAR_H;
  const zm = M.GEAR_Z + M.GEAR_H / 2;
  const R = pitchRadius(M, gear);
  const root = rootRadius(M, gear);
  const a = deg * RAD;
  const dir = [Math.cos(a), Math.sin(a)];
  const side = [-Math.sin(a) * 1.6, Math.cos(a) * 1.6];
  const from = M.CAP_R - 0.5;
  const to = root - (gear === M.BIG ? 1.5 : 0.4) * M.MODULE;
  const bar = [
    [x + dir[0] * from + side[0], y + dir[1] * from + side[1]],
    [x + dir[0] * to + side[0], y + dir[1] * to + side[1]],
    [x + dir[0] * to - side[0], y + dir[1] * to - side[1]],
    [x + dir[0] * from - side[0], y + dir[1] * from - side[1]],
  ];
  // the body sorts by its far rim: every tooth beside or before it is then painted over its edge
  const az = (P.azimuth ?? 45) * RAD;
  const out = [
    { ...item(`${name}.body`, S(k.cylinder(x, y, root, M.GEAR_Z, M.GEAR_H, P, gear.teeth * 3), { className: gear.cls }), when(A, () => [A.cylinder(x, y, root, M.GEAR_Z, M.GEAR_H, { name: `${name}.body`, owner: name })])), at: [x, y, zm] },
  ];
  for (let i = 0; i < gear.teeth; i++) {
    const quad = toothQuad(M, gear, i, deg);
    const t = i * (TAU / gear.teeth) + a;
    out.push({ ...item(`${name}.tooth`, S(k.extrude(quad, M.GEAR_Z, M.GEAR_H, P, { convex: true }), { className: gear.cls, crease: "none" }), when(A, () => [A.extruded(quad, M.GEAR_Z, M.GEAR_H, { name: `${name}.tooth${i}`, owner: name })])), at: [x + R * Math.cos(t), y + R * Math.sin(t), zm] });
  }
  // the bar, cap and knob ride on the body, so they sort just after it; the bar
  // paints over the cap when it points at the viewer and under it when it points away
  const facing = dir[0] * Math.cos(az) + dir[1] * Math.sin(az) > 0;
  const barItem = { ...item(`${name}.bar`, S(k.extrude(bar, z1, M.BAR_H, P, { convex: true }), { className: gear.pointer, crease: "none" }), when(A, () => [A.extruded(bar, z1, M.BAR_H, { name: `${name}.bar`, owner: name })])), at: [x, y, zm + (facing ? 0.02 : 0.01)] };
  const capItem = { ...item(`${name}.cap`, S(k.cylinder(x, y, M.CAP_R, z1, M.CAP_H, P, 32, 0.4), { className: "jk-steel" }), when(A, () => [A.cylinder(x, y, M.CAP_R, z1, M.CAP_H, { name: `${name}.cap`, owner: name })])), at: [x, y, zm + (facing ? 0.01 : 0.02)] };
  out.push(barItem, capItem);
  if (gear === M.BIG) {
    const kx = x + dir[0] * M.KNOB.at;
    const ky = y + dir[1] * M.KNOB.at;
    const kz = z1 + M.BAR_H;
    out.push({ ...item(`${name}.knob`, S(k.cylinder(kx, ky, M.KNOB.r, kz, M.KNOB.h, P, 24, 0.5), { className: gear.pointer, inner: L(k.knurl(kx, ky, M.KNOB.r, kz, kz + M.KNOB.h, 14, P), { tone: "faint" }) }), when(A, () => [A.cylinder(kx, ky, M.KNOB.r, kz, M.KNOB.h, { name: `${name}.knob`, owner: name })])), at: [x, y, zm + 0.03] });
  }
  return out;
}

// Both gears' parts, painted back to front by the depth of each part's centre.
export function gearsItems(P, M, big, A) {
  const all = [...gearItems(P, M, M.BIG, "big", big, A), ...gearItems(P, M, M.LITTLE, "little", littleAngle(M, big), A)];
  return all.sort((p, q) => k.depthOf(p.at, P) - k.depthOf(q.at, P));
}

export const svgOf = (items) => items.map((it) => it.svg).join("");

export function figureItems(P, M, big, A) {
  return [...boardItems(P, M, A), ...postItems(P, M, M.BIG, "big", A), ...postItems(P, M, M.LITTLE, "little", A), ...gearsItems(P, M, big, A)];
}
