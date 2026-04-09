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
    buildSprinkledRings();
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
   SPRINKLED RING
   Builds a single dotted ring around the Allah calligraphy.
   ═══════════════════════════════════════════════════════════════════ */

const SVG_NS = "http://www.w3.org/2000/svg";

function getHaloRadius() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--allahHalo")
    .trim();
  const px = parseFloat(raw);
  return isNaN(px) ? 260 : px;
}

function buildDottedRing(wrap, cfg) {
  if (!wrap) return;
  const { r, count, dotR, color, cls } = cfg;

  const size = (r + dotR + 4) * 2;
  const cx = size / 2;
  const cy = size / 2;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.style.cssText = `
    position:absolute;
    top:0; left:0;
    transform: translate(${-cx}px, ${-cy}px);
    overflow:visible;
  `;
  svg.classList.add("spin-ring", cls);

  const angleStep = (2 * Math.PI) / count;
  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", String(x));
    circle.setAttribute("cy", String(y));
    circle.setAttribute("r", String(dotR));
    circle.setAttribute("fill", color);
    svg.appendChild(circle);
  }

  wrap.appendChild(svg);
}

function buildSprinkledRings() {
  const containers = document.querySelectorAll(".spin-rings-wrap");
  const halo = getHaloRadius();
  const rings = [
    {
      r: halo * 0.55,
      count: 40,
      dotR: 1.25,
      color: "rgba(255,214,118,0.48)",
      cls: "spin-ring-dots",
    },
    {
      r: halo * 0.67,
      count: 52,
      dotR: 1.4,
      color: "rgba(255,120,190,0.44)",
      cls: "spin-ring-dots-2",
    },
    {
      r: halo * 0.82,
      count: 68,
      dotR: 1.1,
      color: "rgba(88,245,210,0.38)",
      cls: "spin-ring-dots-3",
    },
  ];

  containers.forEach((wrap) => {
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    rings.forEach((cfg) => buildDottedRing(wrap, cfg));
  });
}

// Build on first load – wait for fonts & layout to stabilise
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    buildSprinkledRings();
    syncFacesHeight();
  });
} else {
  buildSprinkledRings();
}

buildSprinkledRings();
