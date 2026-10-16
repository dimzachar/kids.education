import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as A from "../kit/audit.mjs";
import { kidsPage, statusHtml } from "../shared/page.mjs";
import { auditPoses } from "../shared/audit.mjs";
import * as J from "./geometry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const M = J.M;
const P = J.fit(M);
const draw = (items) => J.svgOf(items);

const svg = k.figureSvg({
  width: M.WIDTH,
  height: M.HEIGHT,
  label: "Two gears on posts on a wooden board: a big brass gear with 24 teeth and a red pointer and crank knob, meshing with a little green gear with 12 teeth and a blue pointer. Turning the big gear turns the little one twice as fast the other way.",
  body: [
    draw(J.boardItems(P, M)),
    draw(J.postItems(P, M, M.BIG, "big")),
    draw(J.postItems(P, M, M.LITTLE, "little")),
    `<g data-part="gears">${draw(J.gearsItems(P, M, 0))}</g>`,
  ],
});

const plate = k.plateHtml({
  fig: "Fig 3",
  title: "Two gears",
  hint: "Turn the big gear with the buttons",
  readout: "big gear 0.00 turns · little gear 0.00 turns",
  keys: [
    { mark: "red", label: "Big gear, 24 teeth: turn it by the knob" },
    { mark: "blue", label: "Little gear, 12 teeth: it follows, twice as fast, the other way" },
  ],
  caption: "Each tooth of the big gear pushes one tooth of the little gear past. Twenty-four pushes turn a 12-tooth gear round twice.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Two meshing gears. Right arrow turns the big gear a quarter turn, left arrow turns it back.">${svg}</div>`,
});

const live = `
const P = ${JSON.stringify(P)};
const stage = document.querySelector(".iso-stage");
const gearsEl = stage.querySelector('[data-part="gears"]');
const s = { big: 0, target: 0, clock: 0 };
let frame = 0, lastNow = 0, visible = false, touring = !still.matches, tourAt = 1.8, quietUntil = 0, lastDrawn = null;
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
  if (touring && s.clock >= quietUntil && s.clock >= tourAt) { turn(M.QUARTER); tourAt = s.clock + 2.2; }
  const before = s.big;
  s.big = follow(s.big, s.target, dt, 0.45, still.matches);
  if (before !== s.big) say();
  draw();
  frame = visible && !(s.big === s.target && !touring) ? requestAnimationFrame(tick) : 0;
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
say();
draw();
`;

auditPoses(P, { rest: J.figureItems(P, M, 0, A), quarter: J.figureItems(P, M, 90, A) });

const html = kidsPage({
  title: "How do gears turn each other?",
  subtitle: "Turn the big gear and watch the little one.",
  plate,
  controls: `
  <button class="jk-btn jk-btn-red" id="quarter" type="button">Turn a quarter</button>
  <button class="jk-btn jk-btn-yellow" id="whole" type="button">Turn a whole turn</button>
  <button class="jk-btn jk-btn-beige" id="reset" type="button">Reset</button>
  ${statusHtml("Little gear: 2× as fast, the other way")}`,
  steps: [
    { colour: "red", title: "Teeth push teeth", text: "The teeth of one gear fit into the gaps of the other. When one turns, it shoves the next gear round." },
    { colour: "blue", title: "Little gear, twice the turns", text: "24 teeth push 12 teeth past. By the time the big gear has gone round once, the little one has gone round twice." },
    { colour: "yellow", title: "The other way round", text: "Gears that touch always turn opposite ways. Watch the pointers: one goes clockwise, the other anticlockwise." },
  ],
  grown: [
    ["Gear ratio.", "Two meshing gears turn at speeds in the inverse ratio of their tooth counts: 24 : 12 means the little gear spins 2× faster. Its torque is 2× smaller: gears trade speed for force, like levers."],
    ["Why the teeth don't slip.", "Both gears share the same tooth size (the module, 3 units here), so their pitch circles roll on each other without sliding. Real teeth have an involute shape so the push stays smooth through every angle."],
    ["Where you meet them.", "Bicycle sprockets and chains, clock movements, egg beaters, car gearboxes and wind-up toys all use the same idea to speed things up or slow them down."],
  ],
  live,
  geometry: "gears/geometry.mjs",
});
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote gears/index.html", (html.length / 1024).toFixed(0) + " KB");
