import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as A from "../kit/audit.mjs";
import { kidsPage } from "../shared/page.mjs";
import { auditPoses } from "../shared/audit.mjs";
import spec from "./spec.mjs";
import * as J from "./geometry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const M = J.M;
const P = J.fit(M);
const draw = (items) => J.svgOf(items);

// Taking it apart: both gears lift off their posts together, teeth still meshed.
const EXPLODE = { order: ["gears"], moves: { gears: [0, 0, 26] } };

const svg = k.figureSvg({
  width: M.WIDTH,
  height: M.HEIGHT,
  label: "Two gears on posts on a wooden board: a big brass gear with 24 teeth and a red pointer and crank knob, meshing with a little green gear with 12 teeth and a blue pointer. Turning the big gear turns the little one twice as fast the other way.",
  body: [
    draw(J.boardItems(P, M)),
    draw(J.postItems(P, M, M.BIG, "big")),
    draw(J.postItems(P, M, M.LITTLE, "little")),
    `<g data-piece="gears"><g data-part="gears">${draw(J.gearsItems(P, M, 0))}</g></g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const stage = document.querySelector(".iso-stage");
const gearsEl = stage.querySelector('[data-part="gears"]');
const s = { big: 0, target: 0, clock: 0 };
let frame = 0, lastNow = 0, visible = false, touring = !still.matches, tourAt = 1.8, quietUntil = 0, lastDrawn = null;
const apart = explodeOf(stage, P, run);
const turns = (deg) => (deg / 360).toFixed(2);
function say() {
  const b = s.big, l = -b * (M.BIG.teeth / M.LITTLE.teeth);
  const moving = s.big !== s.target;
  chrome({
    read: "big gear " + turns(b) + " turns · little gear " + turns(Math.abs(l)) + " turns" + (l < 0 ? " the other way" : ""),
    sub: moving ? "Watch the pointers: which one goes round faster?" : Math.abs(b) >= 360 ? "One whole turn of the big gear is two turns of the little one." : "Turn the big gear and watch the little one.",
    status: moving ? "Turning…" : "Little gear: 2× as fast, the other way",
    dots: moving ? ["red", "blue", ""] : ["red", "blue", "yellow"],
    step: moving ? 0 : Math.abs(b) >= 360 ? 1 : 2,
  });
}
function turn(by) { s.target += by; say(); run(); }
function reset() { s.target = 0; say(); run(); }
function draw() {
  if (lastDrawn === s.big) return;
  gearsEl.innerHTML = svgOf(gearsItems(P, M, s.big));
  lastDrawn = s.big;
}
function tick(now) {
  const dt = lastNow ? Math.min((now - lastNow) / 1000, 1 / 30) : 1 / 60;
  lastNow = now;
  s.clock += dt;
  if (touring && predicted && s.clock >= quietUntil && s.clock >= tourAt) { turn(M.QUARTER); tourAt = s.clock + 2.2; }
  const before = s.big;
  s.big = follow(s.big, s.target, dt, 0.45, still.matches);
  if (before !== s.big) say();
  const moving = apart.tick(dt, still.matches);
  draw();
  frame = visible && !(s.big === s.target && !moving && !touring) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { lastNow = 0; frame = requestAnimationFrame(tick); } }
function takeOver() { touring = false; quietUntil = s.clock + 8; clearTimeout(takeOver.timer); takeOver.timer = setTimeout(() => { if (!still.matches) { touring = true; tourAt = s.clock; run(); } }, 8200); }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
document.getElementById("quarter").addEventListener("click", () => { takeOver(); turn(M.QUARTER); });
document.getElementById("whole").addEventListener("click", () => { takeOver(); turn(360); });
document.getElementById("reset").addEventListener("click", () => { takeOver(); reset(); });
stage.addEventListener("pointerdown", (event) => { if (event.button === 0) { takeOver(); turn(M.QUARTER); } });
stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); takeOver(); turn(M.QUARTER); }
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); takeOver(); turn(-M.QUARTER); }
  if (event.key === "Home") { event.preventDefault(); takeOver(); reset(); }
});
armPredict(() => { takeOver(); turn(M.QUARTER); });
say();
draw();
`;

auditPoses(P, { rest: { items: J.figureItems(P, M, 0, A), ...EXPLODE }, quarter: J.figureItems(P, M, 90, A) });

const html = kidsPage({
  spec,
  svg,
  controls: `
  <button class="jk-btn jk-btn-red" id="quarter" type="button">Turn a quarter</button>
  <button class="jk-btn jk-btn-yellow" id="whole" type="button">Turn a whole turn</button>
  <button class="jk-btn jk-btn-beige" id="reset" type="button">Reset</button>`,
  live,
  geometry: "gears/geometry.mjs",
  explode: EXPLODE,
});
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote gears/index.html", (html.length / 1024).toFixed(0) + " KB");
