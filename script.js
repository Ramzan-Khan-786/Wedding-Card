const card = document.getElementById("invitationCard");
const faces = card.querySelector(".card-faces");
const btnEn = document.getElementById("btnEn");
const btnUr = document.getElementById("btnUr");
const btnAudio = document.getElementById("btnAudio");
const btnPrint = document.getElementById("btnPrint");
const btnTheme = document.getElementById("btnTheme");
const naatAudio = document.getElementById("naatAudio");
const audioGate = document.getElementById("audioGate");
const audioGateBtn = document.getElementById("audioGateBtn");
const topbar = document.getElementById("topbar");
const menuToggle = document.getElementById("menuToggle");
const topbarControls = document.getElementById("topbarControls");
const appRoot = document.querySelector(".app");

let audioEnabled = true;

function setLang(lang) {
  const next = lang === "ur" ? "ur" : "en";
  card.dataset.lang = next;

  btnEn.setAttribute("aria-pressed", String(next === "en"));
  btnUr.setAttribute("aria-pressed", String(next === "ur"));

  syncFacesHeight();
}
btnEn.addEventListener("click", () => setLang("en"));
btnUr.addEventListener("click", () => setLang("ur"));
btnPrint.addEventListener("click", () => window.print());

setLang("en");

let themeMode = "dark";
function applyTheme(next) {
  themeMode = next === "light" ? "light" : "dark";
  if (appRoot) appRoot.setAttribute("data-theme", themeMode);
  if (btnTheme) {
    btnTheme.setAttribute("aria-pressed", String(themeMode === "light"));
    btnTheme.textContent =
      themeMode === "light" ? "Theme: Light" : "Theme: Dark";
  }
}

if (btnTheme) {
  btnTheme.addEventListener("click", () => {
    applyTheme(themeMode === "dark" ? "light" : "dark");
  });
}

applyTheme("light");

function setMenuOpen(next) {
  if (!topbar || !menuToggle) return;
  const open = Boolean(next);
  topbar.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = topbar && topbar.classList.contains("menu-open");
    setMenuOpen(!isOpen);
  });
}

if (topbarControls) {
  topbarControls.addEventListener("click", (event) => {
    const target = event.target;
    if (!target) return;
    if (target.closest("button") || target.closest("a")) {
      setMenuOpen(false);
    }
  });
}

function updateAudioUI() {
  if (!btnAudio) return;
  btnAudio.setAttribute("aria-pressed", String(audioEnabled));
  btnAudio.textContent = audioEnabled ? "Naat: On" : "Naat: Off";
}

async function tryPlayNaat() {
  if (!naatAudio) return true;
  naatAudio.volume = 1;
  naatAudio.muted = false;
  try {
    await naatAudio.play();
    return true;
  } catch {
    return false;
  }
}

function pauseNaat() {
  if (!naatAudio) return;
  naatAudio.pause();
}

async function setAudioEnabled(next) {
  audioEnabled = Boolean(next);
  updateAudioUI();

  if (!naatAudio) return;
  if (!audioEnabled) {
    pauseNaat();
    if (audioGate) audioGate.hidden = true;
    return;
  }

  const ok = await tryPlayNaat();
  if (!ok && audioGate) audioGate.hidden = false;
}

if (btnAudio) {
  btnAudio.addEventListener("click", () => {
    setAudioEnabled(!audioEnabled);
  });
}

if (audioGateBtn) {
  audioGateBtn.addEventListener("click", async () => {
    const ok = await tryPlayNaat();
    if (ok && audioGate) audioGate.hidden = true;
  });
}

if (naatAudio) {
  naatAudio.addEventListener("error", () => {
    audioEnabled = false;
    updateAudioUI();
    if (btnAudio) btnAudio.textContent = "Naat: Missing";
    if (audioGate) audioGate.hidden = true;
  });
}

// Autoplay attempt (may be blocked by browser policies)
updateAudioUI();
setAudioEnabled(true);

window.addEventListener("pageshow", () => {
  if (!audioEnabled) return;
  tryPlayNaat().then((ok) => {
    if (ok && audioGate) audioGate.hidden = true;
  });
});

// Fallback: first interaction tries to start audio
document.addEventListener(
  "pointerdown",
  async () => {
    if (!audioEnabled) return;
    const ok = await tryPlayNaat();
    if (ok && audioGate) audioGate.hidden = true;
  },
  { once: true },
);

function syncFacesHeight() {
  const en = card.querySelector(".face-en");
  const ur = card.querySelector(".face-ur");
  if (!en || !ur || !faces) return;

  const maxHeight = Math.max(en.offsetHeight, ur.offsetHeight);
  if (maxHeight > 0) faces.style.height = `${maxHeight}px`;
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  if (resizeTimer) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    buildSpinRings();
    syncFacesHeight();
  }, 120);
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    syncFacesHeight();
  });
}

const mobileMenuQuery = window.matchMedia("(max-width: 720px)");
function handleMenuQueryChange(event) {
  if (!event.matches) setMenuOpen(false);
}
if (mobileMenuQuery) {
  mobileMenuQuery.addEventListener("change", handleMenuQueryChange);
}

if ("ResizeObserver" in window) {
  const ro = new ResizeObserver(() => syncFacesHeight());
  const en = card.querySelector(".face-en");
  const ur = card.querySelector(".face-ur");
  if (en) ro.observe(en);
  if (ur) ro.observe(ur);
}

// Initial sizing pass
syncFacesHeight();

/* ═══════════════════════════════════════════════════════════════════
   SPINNING STICK RINGS
   Generates four SVG rings around the Allah calligraphy.
   Each ring is made of evenly-spaced tick marks (short lines)
   arranged around a circle – an Islamic geometric ornament.

   Ring design vocabulary:
     r      – orbit radius (distance from centre to tick midpoint)
     count  – number of ticks on the ring
     len    – length of each tick (the "stick")
     w      – stroke-width of each tick
     color  – stroke colour (rgba)
     cls    – CSS animation class (spin-ring-1 … spin-ring-4)
     gap    – extra spacing between inner rings (decorative dots ring)
   ═══════════════════════════════════════════════════════════════════ */

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Build one ring of evenly-spaced sticks.
 * @param {object} cfg  Ring config
 * @returns {SVGElement}  A positioned <svg> element ready to insert
 */
function makeStickRing(cfg) {
  const {
    r, // orbit radius
    count, // tick count
    len, // tick length
    w, // stroke-width
    color, // stroke colour string
    cls, // animation class
    extraClass, // optional second class
    dots, // if true render dots instead of sticks
    dotR, // dot radius (when dots=true)
  } = cfg;

  // The SVG canvas must encompass the full ring
  const size = (r + len + 4) * 2;
  const cx = size / 2;
  const cy = size / 2;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

  // Position so (cx, cy) sits exactly at the wrap origin
  svg.style.cssText = `
    position:absolute;
    top:0; left:0;
    transform: translate(${-cx}px, ${-cy}px);
    overflow:visible;
  `;
  svg.classList.add("spin-ring", cls);
  if (extraClass) svg.classList.add(extraClass);

  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    if (dots) {
      // Small dot at the orbit radius
      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", String(cx + r * cos));
      circle.setAttribute("cy", String(cy + r * sin));
      circle.setAttribute("r", String(dotR || 1.5));
      circle.setAttribute("fill", color);
      svg.appendChild(circle);
    } else {
      // Tick mark: a line centred at the orbit point, oriented radially
      const half = len / 2;
      const x1 = cx + (r - half) * cos;
      const y1 = cy + (r - half) * sin;
      const x2 = cx + (r + half) * cos;
      const y2 = cy + (r + half) * sin;

      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", String(w));
      line.setAttribute("stroke-linecap", "round");
      svg.appendChild(line);
    }
  }

  return svg;
}

/**
 * Read the computed --allahHalo CSS custom-property in px.
 * Falls back to 260 if not found.
 */
function getHaloRadius() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--allahHalo")
    .trim();
  // value is like "260px" or "54vw" (after clamp resolves it's always px here)
  const px = parseFloat(raw);
  return isNaN(px) ? 260 : px;
}

/**
 * Remove all previously built rings from a container and rebuild them.
 */
function buildRingsInContainer(wrap) {
  if (!wrap) return;

  // Clear previous
  while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

  const halo = getHaloRadius();

  /*
    Four rings:
    ① Innermost – 36 short fine gold ticks, slow CW
    ② Second    – 48 medium ticks, gold/mint, medium CCW
    ③ Third     – 60 tiny dots, blush colour, slow CW  (dot ring for variety)
    ④ Outermost – 72 long ticks, faint mint/violet, slow CCW
  */

  const rings = [
    {
      r: halo * 0.46,
      count: 36,
      len: 9,
      w: 1.4,
      color: "rgba(246,215,123,0.72)",
      cls: "spin-ring-1",
    },
    {
      r: halo * 0.56,
      count: 48,
      len: 6,
      w: 1.0,
      color: "rgba(68,255,210,0.45)",
      cls: "spin-ring-2",
    },
    {
      r: halo * 0.66,
      count: 60,
      len: 0, // unused when dots=true
      w: 1.0,
      color: "rgba(255,123,212,0.40)",
      cls: "spin-ring-3",
      dots: true,
      dotR: 1.8,
    },
    {
      r: halo * 0.78,
      count: 72,
      len: 11,
      w: 0.8,
      color: "rgba(246,215,123,0.28)",
      cls: "spin-ring-4",
    },
  ];

  rings.forEach((cfg) => {
    const el = makeStickRing(cfg);
    wrap.appendChild(el);
  });
}

/**
 * Build (or rebuild) all spin-ring containers across both card faces.
 */
function buildSpinRings() {
  const containers = document.querySelectorAll(".spin-rings-wrap");
  containers.forEach((wrap) => buildRingsInContainer(wrap));
}

// Build on first load – wait for fonts & layout to stabilise
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    buildSpinRings();
    syncFacesHeight();
  });
} else {
  buildSpinRings();
}

// Also build immediately in case fonts.ready already fired
buildSpinRings();
