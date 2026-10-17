import * as k from "../kit/iso-kit.mjs";
import { kitScript, latheScript, tubeScript, geometryScript } from "../scripts/inline-kit.mjs";
import { SPRING } from "./audit.mjs";
import { headExtras, TRACK_JS } from "./site.mjs";

// The kid chrome around a kit figure: warm page, soft card, big pill buttons,
// a predict-first card, numbered step cards and a grown-ups section. Colour
// classes are full token sets, so the kit's own four-tone shading does the
// work on every part.
export const KIDS_CSS = `
.iso[data-theme="light"]{--anatomy-page:#f3ede3;--anatomy-card:#ffffff;--anatomy-mid:#a09a8f;--anatomy-faint:#e9e3d8}
body{font-family:"Nunito","Segoe UI",system-ui,-apple-system,sans-serif}
.iso-page{margin:40px auto 72px}
.jk-nav{display:flex;justify-content:space-between;align-items:center;font-size:.9rem;margin-bottom:10px}
.jk-nav a{color:#6f6c7a;text-decoration:none;font-weight:800}.jk-nav a:hover{color:#2b2a33}
.jk-head{text-align:center;margin-bottom:-18px}
.jk-head h1{margin:0;font-size:clamp(1.5rem,4vw,2.1rem);color:#2b2a33;letter-spacing:-.01em}
.jk-sub{margin:6px 0 0;color:#6f6c7a;font-size:1.05rem;min-height:1.6em;transition:opacity .25s}
.jk-sub.swap{opacity:0}
.iso-plate{border-radius:24px;box-shadow:0 18px 40px rgba(60,40,20,.12),0 2px 6px rgba(60,40,20,.06);padding:44px 20px 40px}
.iso-stage{outline:none;touch-action:pan-y;cursor:pointer}
.iso-stage:focus-visible{outline:3px solid #4f8fe6;outline-offset:6px;border-radius:12px}
.iso-figure{margin:28px 0 20px}
.iso-legend{color:#6f6c7a}
.iso-swatch[data-mark="red"] path{stroke:#e8575f}.iso-swatch[data-mark="blue"] path{stroke:#4f8fe6}.iso-swatch[data-mark="lit"] path{stroke:#d9a520}.iso-swatch[data-mark="green"] path{stroke:#3fae7a}

.jk-wood{--anatomy-paper:#e9cfa6;--anatomy-face:#f0dbb9;--anatomy-top:#f3e2c4;--anatomy-shade-0:#c9a26f;--anatomy-shade-1:#d4ae7e;--anatomy-shade-2:#ddba8e;--anatomy-shade-3:#e6c89c;--anatomy-hi:#8a6236;--anatomy-faint:#cfae84;--anatomy-mid:#a9804f;--anatomy-lo:#b58e5d}
.jk-wood-line{stroke:#c9a26f}
.jk-mint{--anatomy-paper:#cfeee2;--anatomy-face:#dcf3ea;--anatomy-top:#e4f8f0;--anatomy-shade-0:#9bd2bd;--anatomy-shade-1:#abdbc9;--anatomy-shade-2:#bde5d5;--anatomy-shade-3:#cdeee1;--anatomy-hi:#4a9a7f;--anatomy-faint:#a8d9c7;--anatomy-mid:#6fb79d}
.jk-mint-lid{--anatomy-paper:#bfe6d6;--anatomy-face:#d4f0e4;--anatomy-top:#e4f8f0;--anatomy-shade-0:#8fcbb3;--anatomy-shade-1:#9ed3bf;--anatomy-shade-2:#addcca;--anatomy-shade-3:#bfe6d6;--anatomy-hi:#4a9a7f;--anatomy-faint:#9ed3bf;--anatomy-mid:#6fb79d}
.jk-mint-dark{--anatomy-paper:#b4dfce;--anatomy-face:#bfe6d6;--anatomy-top:#c8ead9;--anatomy-shade-0:#86c3ac;--anatomy-shade-1:#93cbb6;--anatomy-shade-2:#a2d4c1;--anatomy-shade-3:#b0dccb;--anatomy-hi:#4a9a7f;--anatomy-faint:#93cbb6;--anatomy-mid:#6fb79d}
.jk-grass{--anatomy-paper:#bfe3a8;--anatomy-face:#cdeab9;--anatomy-top:#d8f0c6;--anatomy-shade-0:#8fc374;--anatomy-shade-1:#9ccb83;--anatomy-shade-2:#aad693;--anatomy-shade-3:#b7dea0;--anatomy-hi:#5c8f3f;--anatomy-faint:#a3cf8b;--anatomy-mid:#7aab5b;--anatomy-lo:#8fbd70}
.jk-stone{--anatomy-paper:#cfc9bf;--anatomy-face:#dbd6cd;--anatomy-top:#e4dfd6;--anatomy-shade-0:#9f988c;--anatomy-shade-1:#aca599;--anatomy-shade-2:#bab3a7;--anatomy-shade-3:#c7c0b5;--anatomy-hi:#6e675c;--anatomy-faint:#aca599;--anatomy-mid:#8a8378}
.jk-red{--anatomy-paper:#e8575f;--anatomy-face:#ef6b72;--anatomy-top:#f58b92;--anatomy-shade-0:#c23b45;--anatomy-shade-1:#d1444e;--anatomy-shade-2:#e04f59;--anatomy-shade-3:#ec6a71;--anatomy-hi:#9e2c35;--anatomy-faint:#c23b45;--anatomy-mid:#b0333c}
.jk-blue{--anatomy-paper:#5a97e8;--anatomy-face:#73a9ee;--anatomy-top:#8fbaf3;--anatomy-shade-0:#3d6fc0;--anatomy-shade-1:#467bcc;--anatomy-shade-2:#4f8ad9;--anatomy-shade-3:#5a97e8;--anatomy-hi:#2c569a;--anatomy-faint:#3d6fc0;--anatomy-mid:#3663ae}
.jk-water{--anatomy-paper:#8fc4f0;--anatomy-face:#a6d1f4;--anatomy-top:#b8dbf7;--anatomy-shade-0:#5f9fd8;--anatomy-shade-1:#6eaae0;--anatomy-shade-2:#7fb6e8;--anatomy-shade-3:#8fc4f0;--anatomy-hi:#3f78b5;--anatomy-faint:#6eaae0;--anatomy-mid:#4f8ac4}
.jk-green{--anatomy-paper:#5fc48f;--anatomy-face:#7ad1a3;--anatomy-top:#92dab4;--anatomy-shade-0:#3d9a69;--anatomy-shade-1:#46a874;--anatomy-shade-2:#51b57f;--anatomy-shade-3:#5fc48f;--anatomy-hi:#2c7a50;--anatomy-faint:#3d9a69;--anatomy-mid:#348a5c}
.jk-white{--anatomy-paper:#f4f4f7;--anatomy-face:#fafafc;--anatomy-top:#ffffff;--anatomy-shade-0:#d7d7de;--anatomy-shade-1:#e2e2e8;--anatomy-shade-2:#ececf1;--anatomy-shade-3:#f4f4f7;--anatomy-hi:#8f8fa0;--anatomy-faint:#d7d7de;--anatomy-mid:#a7a7b5}
.jk-skin{--anatomy-paper:#f7d6ba;--anatomy-face:#fbe0c8;--anatomy-top:#fde8d4;--anatomy-shade-0:#e5b48f;--anatomy-shade-1:#edc1a0;--anatomy-shade-2:#f3cdb0;--anatomy-shade-3:#f8d9c0;--anatomy-hi:#c48a60;--anatomy-faint:#e5b48f;--anatomy-mid:#d09c72}
.jk-yellow{--anatomy-paper:#f2c14e;--anatomy-face:#f6cd67;--anatomy-top:#f8d47a;--anatomy-shade-0:#c79a1f;--anatomy-shade-1:#d8a82b;--anatomy-shade-2:#e6b43a;--anatomy-shade-3:#f0c04c;--anatomy-hi:#8f6a0c;--anatomy-faint:#c79a1f;--anatomy-mid:#a07a12}
.jk-brass{--anatomy-paper:#d9b35a;--anatomy-face:#e5c472;--anatomy-top:#edd08a;--anatomy-shade-0:#a8842e;--anatomy-shade-1:#b9933a;--anatomy-shade-2:#c9a246;--anatomy-shade-3:#d6b054;--anatomy-hi:#7a5c14;--anatomy-faint:#a8842e;--anatomy-mid:#8d6b1c}
.jk-steel{--anatomy-paper:#a9a6b8;--anatomy-face:#bdbac9;--anatomy-top:#cbc8d6;--anatomy-shade-0:#7c7890;--anatomy-shade-1:#8b879e;--anatomy-shade-2:#9b97ac;--anatomy-shade-3:#aba8ba;--anatomy-hi:#4f4b62;--anatomy-faint:#7c7890;--anatomy-mid:#66627a}
.jk-rubber{--anatomy-paper:#5a5866;--anatomy-face:#66646f;--anatomy-top:#6c6a78;--anatomy-shade-0:#45434f;--anatomy-shade-1:#4d4b57;--anatomy-shade-2:#55535f;--anatomy-shade-3:#5f5d69;--anatomy-hi:#2e2c36;--anatomy-faint:#45434f}
.jk-rope{--anatomy-shade-2:#d9b48a;--anatomy-top:#efd6b3;--anatomy-shade-0:#a87f52;--anatomy-lo:#7d5a33}
.jk-eye .iso-dots circle{fill:#2b2a33;opacity:1}
.jk-cheek .iso-dots circle{fill:#ff9aa2;opacity:.75}
.jk-smile{stroke:#9e2c35;stroke-width:1.1px}

.jk-predict{background:#fff;border:2px dashed #e4ddd0;border-radius:18px;padding:12px 16px;margin:0 0 12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;transition:border-color .3s}
.jk-predict.answered{border-style:solid;border-color:#3fae7a}
.jk-predict-q{margin:0;font-weight:800;color:#2b2a33}
.jk-predict-opts{display:flex;gap:8px;flex-wrap:wrap}
.jk-predict-verdict{margin:0;color:#3fae7a;font-weight:800}
.jk-predict-verdict.no{color:#c99a1d}
.jk-predict-explain{margin:0;color:#6f6c7a;font-size:.92rem;width:100%;text-align:center}
.jk-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;margin-top:4px}
.jk-group{display:flex;align-items:center;gap:6px;background:#faf7f2;border-radius:999px;padding:6px 8px 6px 14px;font-weight:800;color:#2b2a33}
.jk-group .jk-btn{padding:10px 16px;font-size:.95rem}
.jk-btn{border:none;border-radius:999px;padding:14px 24px;font:inherit;font-weight:800;font-size:1.05rem;cursor:pointer;transition:transform .12s,box-shadow .12s,opacity .2s;box-shadow:0 4px 0 rgba(0,0,0,.08)}
.jk-btn:active:not(:disabled){transform:translateY(2px);box-shadow:0 2px 0 rgba(0,0,0,.08)}
.jk-btn:disabled{opacity:.45;cursor:not-allowed}
.jk-btn:focus-visible{outline:3px solid #4f8fe6;outline-offset:3px}
.jk-btn-red{background:#e8575f;color:#fff}.jk-btn-red:hover:not(:disabled){background:#c63f47}
.jk-btn-blue{background:#4f8fe6;color:#fff}.jk-btn-blue:hover:not(:disabled){background:#3b78cc}
.jk-btn-yellow{background:#f2c14e;color:#2b2a33}.jk-btn-yellow:hover:not(:disabled){background:#e4b434}
.jk-btn-beige{background:#efe6d8;color:#2b2a33}.jk-btn-beige:hover:not(:disabled){background:#e0d3bf}
.jk-btn-ghost{background:#fff;color:#2b2a33;box-shadow:inset 0 0 0 2px #e4ddd0,0 4px 0 rgba(0,0,0,.04)}.jk-btn-ghost:hover:not(:disabled){background:#faf7f2}
.jk-status{display:flex;align-items:center;gap:8px;font-size:.95rem;color:#6f6c7a;padding:8px 14px;border-radius:999px;background:#faf7f2;margin-left:auto}
.jk-dots{display:flex;gap:4px}.jk-dot{width:9px;height:9px;border-radius:50%;background:#ddd8cf;transition:background .3s;display:inline-block}
.jk-dot.red{background:#e8575f}.jk-dot.yellow{background:#f2c14e}.jk-dot.blue{background:#4f8fe6}.jk-dot.green{background:#3fae7a}
.jk-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}
.jk-step{border-radius:18px;padding:14px 14px 12px;background:#faf7f2;border:2px solid transparent;transition:border-color .3s,background .3s}
.jk-step.active{background:#fff}
.jk-step-red.active{border-color:#e8575f}.jk-step-yellow.active{border-color:#e4b434}.jk-step-blue.active{border-color:#4f8fe6}.jk-step-green.active{border-color:#3fae7a}
.jk-num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;color:#fff;font-weight:900;font-size:.9rem;margin-bottom:8px}
.jk-step-red .jk-num{background:#e8575f}.jk-step-yellow .jk-num{background:#f2c14e}.jk-step-blue .jk-num{background:#4f8fe6}.jk-step-green .jk-num{background:#3fae7a}
.jk-step h3{margin:0 0 4px;font-size:1rem;color:#2b2a33}.jk-step p{margin:0;font-size:.9rem;color:#6f6c7a;line-height:1.4}
.jk-grown{margin-top:20px;border-top:1px dashed #e4ddd0;padding-top:14px;color:#6f6c7a;font-size:.92rem;line-height:1.5}
.jk-grown summary{cursor:pointer;font-weight:800;color:#2b2a33}.jk-grown ul{padding-left:20px;margin:8px 0 0}.jk-grown li{margin-bottom:4px}.jk-grown b{color:#2b2a33}
.jk-home{margin-top:14px;background:#faf7f2;border-radius:18px;padding:12px 16px;color:#6f6c7a;font-size:.92rem;line-height:1.5}
.jk-home b{color:#2b2a33}
@media (max-width:560px){.jk-steps{grid-template-columns:1fr}.jk-status{margin-left:0;width:100%;justify-content:center}.jk-head{margin-bottom:-8px}.iso-plate{padding:40px 6px 56px}}
`;

// Small helpers every live script uses: a sub-stepped spring, exponential
// follow, the chrome writers, the predict card and the take-it-apart springs.
// Inlined inside the page's own closure.
export const LIVE_COMMON = `
const SPRING = ${JSON.stringify(SPRING)};
${TRACK_JS}
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function springStep(v, target, dt, [stiff, drag], calm) {
  if (calm) { v.at = target; v.rate = 0; return true; }
  for (let i = 0; i < 4; i++) { v.rate += ((target - v.at) * stiff - v.rate * drag) * dt / 4; v.at += v.rate * dt / 4; }
  if (Math.abs(target - v.at) < 0.02 && Math.abs(v.rate) < 0.05) { v.at = target; v.rate = 0; return true; }
  return false;
}
const follow = (x, target, dt, tau, calm) => { if (calm) return target; const next = x + (target - x) * (1 - Math.exp(-dt / tau)); return Math.abs(target - next) < 0.03 ? target : next; };
const readout = document.querySelector("[data-readout]");
const subtitle = document.getElementById("subtitle"), statusText = document.getElementById("statusText");
const dots = Array.from(document.querySelectorAll(".jk-dot"));
const steps = Array.from(document.querySelectorAll(".jk-step"));
function chrome({ read, sub, status, dots: colours = [], step = -1 }) {
  if (read !== undefined && readout.textContent !== read) readout.textContent = read;
  if (status !== undefined && statusText.textContent !== status) statusText.textContent = status;
  if (sub !== undefined && subtitle.textContent !== sub) { subtitle.classList.add("swap"); setTimeout(() => { subtitle.textContent = sub; subtitle.classList.remove("swap"); }, 200); }
  dots.forEach((d, i) => { d.className = "jk-dot" + (colours[i] ? " " + colours[i] : ""); });
  steps.forEach((el, i) => el.classList.toggle("active", i === step));
}
// Predict first: the tour waits, and the first action runs when the kid has guessed.
const predictEl = document.getElementById("predict");
let predicted = !predictEl;
function armPredict(onAnswer) {
  if (!predictEl) return;
  const opts = Array.from(predictEl.querySelectorAll(".jk-predict-opt"));
  const verdict = predictEl.querySelector(".jk-predict-verdict");
  const explain = predictEl.querySelector(".jk-predict-explain");
  opts.forEach((b) => b.addEventListener("click", () => {
    const ok = b.dataset.correct === "1";
    opts.forEach((o) => { o.disabled = true; o.hidden = o !== b; });
    verdict.textContent = ok ? "Yes! Watch…" : "Let's see…";
    verdict.classList.toggle("no", !ok);
    verdict.hidden = false;
    predictEl.classList.add("answered");
    predicted = true;
    track("guess", { toy: document.body.dataset.toy, right: ok });
    setTimeout(() => { explain.hidden = false; }, 1800);
    onAnswer(ok);
  }));
}
// Take it apart: one spring per assembly, staggered, the same constants the audit replays.
function explodeOf(stage, P, run) {
  const order = JSON.parse(stage.dataset.order || "[]");
  const moves = JSON.parse(stage.dataset.moves || "{}");
  const springs = Object.fromEntries(order.map((id) => [id, { x: 0, v: 0, target: 0, pending: null }]));
  const nodes = Object.fromEntries(order.map((id) => [id, Array.from(stage.querySelectorAll('[data-piece="' + id + '"]'))]));
  const btn = document.getElementById("apartBtn");
  const self = {
    apart: false, moving: false, clock: 0,
    set(value) {
      if (self.apart === value) return;
      self.apart = value;
      const goal = value ? 1 : 0;
      let index = 0;
      for (const id of value ? order : [...order].reverse()) {
        const s = springs[id];
        if (s.target === goal) s.pending = null; else s.pending = { value: goal, at: self.clock + index++ * SPRING.stagger };
      }
      if (btn) btn.textContent = value ? "Put it together" : "Take it apart";
      if (value) track("apart", { toy: document.body.dataset.toy });
      run();
    },
    toggle() { self.set(!self.apart); },
    tick(dt, calm) {
      self.clock += dt;
      let moving = false;
      for (const id of order) {
        const s = springs[id];
        if (s.pending && self.clock >= s.pending.at) { s.target = s.pending.value; s.pending = null; }
        if (calm) { s.x = s.target; s.v = 0; } else {
          for (let i = 0; i < SPRING.substeps; i++) { const h = dt / SPRING.substeps; s.v += ((s.target - s.x) * SPRING.stiffness - s.v * SPRING.damping) * h; s.x += s.v * h; }
          if (Math.abs(s.target - s.x) < 1e-3 && Math.abs(s.v) < 1e-3) { s.x = s.target; s.v = 0; }
        }
        if (s.pending || s.x !== s.target) moving = true;
        const m = moves[id] || [0, 0, 0];
        const t = s.x ? k.translateAlong(P, [m[0] * s.x, m[1] * s.x, m[2] * s.x]) : "";
        for (const n of nodes[id]) { if (t) n.setAttribute("transform", t); else n.removeAttribute("transform"); }
      }
      self.moving = moving;
      return moving;
    },
  };
  if (btn) btn.addEventListener("click", () => self.toggle());
  return self;
}
`;

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function stepsHtml(steps) {
  return `<section class="jk-steps" aria-label="How it works, step by step">${steps
    .map(({ colour, title, text }, i) => `<div class="jk-step jk-step-${colour}"><span class="jk-num">${i + 1}</span><h3>${title}</h3><p>${text}</p></div>`)
    .join("")}</section>`;
}

export function grownHtml(points) {
  return `<details class="jk-grown"><summary>For grown-ups: what is really happening</summary><ul>${points.map(([b, text]) => `<li><b>${b}</b> ${text}</li>`).join("")}</ul></details>`;
}

export function statusHtml(text, count = 3) {
  return `<div class="jk-status" aria-live="polite"><span class="jk-dots">${"<i class=\"jk-dot\"></i>".repeat(count)}</span><span id="statusText">${text}</span></div>`;
}

export function predictHtml(predict) {
  if (!predict) return "";
  return `<div class="jk-predict" id="predict" role="group" aria-label="Guess first"><p class="jk-predict-q">${esc(predict.question)}</p><div class="jk-predict-opts">${predict.options
    .map((o) => `<button class="jk-btn jk-btn-beige jk-predict-opt" type="button" data-correct="${o.correct ? 1 : 0}">${esc(o.label)}</button>`)
    .join("")}</div><p class="jk-predict-verdict" hidden></p><p class="jk-predict-explain" hidden>${esc(predict.explain)}</p></div>`;
}

// Wraps each item in a group tagged with its assembly, so the page can move it.
export const drawPieces = (items) => items.map((it) => (it.piece ? `<g data-piece="${it.piece}">${it.svg}</g>` : it.svg)).join("");

// A whole toy page from its spec (the words), its figure (the svg) and its live script.
export function kidsPage({ spec, svg, controls, css = "", live, geometry, explode = null, width = 720, nav = true }) {
  const order = explode ? explode.order : [];
  const moves = explode ? explode.moves : {};
  const plate = k.plateHtml({
    fig: `Fig ${spec.fig}`,
    title: spec.name,
    hint: spec.hint,
    readout: spec.readout,
    keys: spec.keys,
    caption: spec.caption,
    body: `<div class="iso-stage" tabindex="0" role="${spec.role ?? "group"}" aria-label="${esc(spec.aria)}" data-order='${JSON.stringify(order)}' data-moves='${JSON.stringify(moves)}'>${svg}</div>`,
  });
  const apartBtn = explode ? `<button class="jk-btn jk-btn-ghost" id="apartBtn" type="button">Take it apart</button>` : "";
  const body = `
${nav ? `<nav class="jk-nav"><a href="../">← All toys</a><span>${esc(spec.family)}</span></nav>` : ""}
<header class="jk-head"><h1>${esc(spec.title)}</h1><p class="jk-sub" id="subtitle">${esc(spec.subtitle)}</p></header>
${plate}
${predictHtml(spec.predict)}
<div class="jk-controls">${controls}${apartBtn}${statusHtml(spec.status)}</div>
${stepsHtml(spec.steps)}
${spec.home ? `<div class="jk-home"><b>Build it at home:</b> ${esc(spec.home)}</div>` : ""}
${grownHtml(spec.grown)}
`;
  const script = `${kitScript()}\n${latheScript()}\n${tubeScript()}\n(() => {\n${geometryScript(geometry)}\n${LIVE_COMMON}\n${live}\n})();`;
  return k
    .pageHtml({ title: spec.title, theme: "light", body, script, width })
    .replace("</style>", `${KIDS_CSS}${css}</style>`)
    .replace("</head>", `${headExtras({ title: spec.title, description: spec.blurb, path: `/${spec.id}/`, depth: 1 })}</head>`)
    .replace('<body class="iso" data-theme="light">', `<body class="iso" data-theme="light" data-toy="${spec.id}">`);
}
