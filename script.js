const body = document.body;
const btnMenu = document.getElementById("btnMenu");
const mobileMenu = document.getElementById("mobileMenu");
const menuBackdrop = document.getElementById("menuBackdrop");
const btnTheme = document.getElementById("btnTheme");
const btnLang = document.getElementById("btnLang");
const btnAudio = document.getElementById("btnAudio");
const btnCopy = document.getElementById("btnCopy");
const btnShare = document.getElementById("btnShare");
const naatAudio = document.getElementById("naatAudio");
const audioGate = document.getElementById("audioGate");
const audioGateBtn = document.getElementById("audioGateBtn");
const themeMeta = document.querySelector('meta[name="theme-color"]');

let audioEnabled = true;
let currentTheme = body.dataset.theme || "dark";
let currentLang = body.dataset.lang || "en";

function setMenuOpen(open) {
  if (!mobileMenu || !menuBackdrop || !btnMenu) return;
  mobileMenu.classList.toggle("open", open);
  menuBackdrop.hidden = !open;
  mobileMenu.setAttribute("aria-hidden", String(!open));
  btnMenu.setAttribute("aria-expanded", String(open));
}

if (btnMenu) {
  btnMenu.addEventListener("click", () => {
    const open = !mobileMenu.classList.contains("open");
    setMenuOpen(open);
  });
}
if (menuBackdrop) {
  menuBackdrop.addEventListener("click", () => setMenuOpen(false));
}

function setTheme(nextTheme) {
  const next = nextTheme === "light" ? "light" : "dark";
  currentTheme = next;
  body.dataset.theme = next;
  if (btnTheme) {
    btnTheme.textContent = next === "dark" ? "Theme: Dark" : "Theme: Light";
    btnTheme.setAttribute("aria-pressed", String(next === "dark"));
  }
  if (themeMeta) {
    themeMeta.setAttribute("content", next === "dark" ? "#07150f" : "#f3eee3");
  }
}

function setLang(nextLang) {
  const next = nextLang === "ur" ? "ur" : "en";
  currentLang = next;
  body.dataset.lang = next;
  if (btnLang) {
    btnLang.textContent = next === "ur" ? "Language: Urdu" : "Language: English";
    btnLang.setAttribute("aria-pressed", String(next === "ur"));
  }
}

if (btnTheme) {
  btnTheme.addEventListener("click", () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

if (btnLang) {
  btnLang.addEventListener("click", () => {
    setLang(currentLang === "en" ? "ur" : "en");
  });
}

function updateAudioUI() {
  if (!btnAudio) return;
  btnAudio.textContent = audioEnabled ? "Naat: On" : "Naat: Off";
  btnAudio.setAttribute("aria-pressed", String(audioEnabled));
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

if (btnCopy) {
  btnCopy.addEventListener("click", async () => {
    const text = document.getElementById("invitationCard").innerText.trim();
    try {
      await navigator.clipboard.writeText(text);
      btnCopy.textContent = "Copied";
      setTimeout(() => (btnCopy.textContent = "Copy Invite"), 1200);
    } catch {
      btnCopy.textContent = "Copy Failed";
      setTimeout(() => (btnCopy.textContent = "Copy Invite"), 1200);
    }
  });
}

if (btnShare) {
  btnShare.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Wedding Invitation",
          text: document.getElementById("invitationCard").innerText.trim(),
        });
      } catch {
        // ignore
      }
    } else if (btnCopy) {
      btnCopy.click();
    }
  });
}

// Initial setup
setTheme(currentTheme);
setLang(currentLang);
updateAudioUI();
setAudioEnabled(true);

// Fallback: first user interaction tries to start audio
window.addEventListener(
  "pointerdown",
  async () => {
    if (!audioEnabled) return;
    const ok = await tryPlayNaat();
    if (ok && audioGate) audioGate.hidden = true;
  },
  { once: true }
);
