const card = document.getElementById("invitationCard");
const faces = card.querySelector(".card-faces");
const btnEn = document.getElementById("btnEn");
const btnUr = document.getElementById("btnUr");
const btnTheme = document.getElementById("btnTheme");
const btnAudio = document.getElementById("btnAudio");
const btnPrint = document.getElementById("btnPrint");
const naatAudio = document.getElementById("naatAudio");
const audioGate = document.getElementById("audioGate");
const audioGateBtn = document.getElementById("audioGateBtn");
const themeMeta = document.querySelector('meta[name="theme-color"]');

let audioEnabled = true;
let currentTheme = document.body?.dataset?.theme || "dark";

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

function setTheme(nextTheme) {
  const next = nextTheme === "light" ? "light" : "dark";
  currentTheme = next;
  if (document.body) document.body.dataset.theme = next;
  if (btnTheme) {
    btnTheme.setAttribute("aria-pressed", String(next === "dark"));
    btnTheme.textContent = next === "dark" ? "Theme: Dark" : "Theme: Light";
  }
  if (themeMeta) {
    themeMeta.setAttribute("content", next === "dark" ? "#07150f" : "#f3eee3");
  }
}

if (btnTheme) {
  btnTheme.addEventListener("click", () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

setTheme(currentTheme);

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
  { once: true }
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
  resizeTimer = window.setTimeout(syncFacesHeight, 120);
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    syncFacesHeight();
  });
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
