// Where the site lives and what every page carries in its head: social preview
// tags, the icon, the manifest and offline worker, and Vercel's cookieless
// analytics (they load only on the Vercel host, never from a local file).
export const SITE = {
  url: "https://kidseducation-beta.vercel.app",
  name: "How does it work?",
  description: "Little see-through machines kids can play with: guess first, then push, turn and pull, and watch what moves.",
  themeColor: "#f3ede3",
};

// A Jack-in-the-box as a tiny icon: mint box, red clown, yellow pop.
export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="30" width="48" height="28" rx="6" fill="#bfe6d6" stroke="#4a9a7f" stroke-width="3"/><rect x="6" y="24" width="52" height="8" rx="3" fill="#8fcbb3" stroke="#4a9a7f" stroke-width="3"/><circle cx="32" cy="18" r="10" fill="#f7d6ba" stroke="#c48a60" stroke-width="2.5"/><path d="M22 10 L32 -2 L42 10 Z" fill="#e8575f"/><circle cx="28" cy="16" r="1.6" fill="#2b2a33"/><circle cx="36" cy="16" r="1.6" fill="#2b2a33"/><path d="M27 21 Q32 25 37 21" fill="none" stroke="#9e2c35" stroke-width="2" stroke-linecap="round"/></svg>`;

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export function headExtras({ title, description, path = "/", depth = 0 }) {
  const root = depth ? "../".repeat(depth) : "./";
  const url = `${SITE.url}${path}`;
  return `
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="${SITE.themeColor}">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="manifest" href="${root}manifest.webmanifest">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}/preview.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE.url}/preview.png">
<script>
(function () {
  var host = location.hostname;
  if (location.protocol !== "https:" || /github\\.io$|localhost$|^127\\./.test(host)) return;
  var add = function (src) { var s = document.createElement("script"); s.defer = true; s.src = src; document.head.appendChild(s); };
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  add("/_vercel/insights/script.js");
  window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
  add("/_vercel/speed-insights/script.js");
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("${root}sw.js").catch(function () {});
})();
</script>`;
}

// Report a kid-level event to Vercel Analytics, if it is loaded. Used by the live
// scripts for the few moments that matter: a guess, a pop, a take-apart.
export const TRACK_JS = `const track = (name, data) => { try { window.va && window.va("event", { name, data }); } catch (e) {} };`;
