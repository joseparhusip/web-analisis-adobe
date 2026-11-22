const SETTLE_DELAY_MS = 1500;
const GIVE_UP_AFTER_MS = 12000;
const MAX_SAMPLES = 120;
const ASSET_LINK_PATTERN =
  /^https:\/\/stock\.adobe\.com\/(?:[a-z]{2}(?:[-_][a-zA-Z]{2})?\/)?(?:images|video|templates|3d-assets|audio)\/([^/?#]+)\/(\d+)/;
const TEXT_COUNT_PATTERNS = [
  /(\d[\d.,\s]*\d|\d)\s+(?:results?|hasil|assets?)\b/i,
  /(?:results?|hasil)\s*[:(]?\s*(\d[\d.,\s]*\d|\d)/i,
  /\bof\s+(\d[\d.,]*\d)\b/i,
];
const SCRIPT_COUNT_PATTERN = /"(?:total|nb_results|num_results|total_results|totalResults|search_results_count)"\s*:\s*"?(\d+)"?/;

let settleTimer;
let lastSignature = "";
let watchedUrl = "";
let watchStartedAt = 0;
let problemReported = false;

function send(type, payload) {
  return chrome.runtime.sendMessage({ type, payload }).catch(() => undefined);
}

function isSearchPage() {
  return new URL(location.href).searchParams.has("k");
}

function toNumber(raw) {
  const value = Number(String(raw).replace(/\D/g, ""));
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function totalFromText() {
  const text = document.body.innerText;
  for (const pattern of TEXT_COUNT_PATTERNS) {
    const value = toNumber(pattern.exec(text)?.[1] ?? "");
    if (value !== undefined) return value;
  }
  return undefined;
}

function totalFromScripts() {
  for (const script of document.querySelectorAll("script:not([src])")) {
    const value = toNumber(SCRIPT_COUNT_PATTERN.exec(script.textContent ?? "")?.[1] ?? "");
    if (value !== undefined) return value;
  }
  return undefined;
}

function readTotal() {
  return totalFromText() ?? totalFromScripts();
}

function titleFromSlug(slug) {
  return decodeURIComponent(slug).replace(/-/g, " ");
}

function thumbnailOf(image) {
  const source = image?.currentSrc || image?.src;
  return source && source.startsWith("https://") ? source : undefined;
}

function readSamples() {
  const samples = new Map();
  for (const anchor of document.querySelectorAll("a[href]")) {
    const match = ASSET_LINK_PATTERN.exec(anchor.href);
    if (!match || samples.has(match[2])) continue;

    const image = anchor.querySelector("img");
    samples.set(match[2], {
      id: match[2],
      title: (image?.alt || anchor.getAttribute("aria-label") || anchor.title || titleFromSlug(match[1])).trim().slice(0, 300),
      pageUrl: match[0],
      thumbnailUrl: thumbnailOf(image),
    });
    if (samples.size >= MAX_SAMPLES) break;
  }
  return [...samples.values()];
}

function showToast(message, isError) {
  const toast = document.createElement("div");
  toast.textContent = message;
  Object.assign(toast.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "2147483647",
    maxWidth: "360px",
    padding: "10px 14px",
    borderRadius: "10px",
    font: "500 13px system-ui, sans-serif",
    color: "#fff",
    background: isError ? "#b91c1c" : "#4f46e5",
    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
  });
  document.body.append(toast);
  setTimeout(() => toast.remove(), 4500);
}

function describePage(samples) {
  const text = document.body.innerText;
  const hints = [...text.matchAll(/.{0,40}(?:result|hasil|asset).{0,40}/gi)].slice(0, 6).map((match) => match[0].replace(/\s+/g, " "));
  const sampleLinks = [...document.querySelectorAll("a[href]")]
    .map((anchor) => anchor.href)
    .filter((href) => /\/\d{6,}/.test(href))
    .slice(0, 3);
  return JSON.stringify({ title: document.title, assetsFound: samples.length, hints, sampleLinks });
}

async function reportProblem(samples) {
  if (problemReported) return;
  problemReported = true;
  showToast("Stock Research: jumlah hasil tidak terbaca di halaman ini. Laporan dikirim ke aplikasi.", true);
  await send("status", { kind: "problem", url: location.href, detail: describePage(samples) });
}

async function capture() {
  if (!isSearchPage()) return;

  if (location.href !== watchedUrl) {
    watchedUrl = location.href;
    watchStartedAt = Date.now();
    problemReported = false;
  }

  const total = readTotal();
  const samples = readSamples();
  if (total === undefined) {
    if (Date.now() - watchStartedAt >= GIVE_UP_AFTER_MS) await reportProblem(samples);
    else scheduleCapture();
    return;
  }

  const signature = `${location.href}|${total}|${samples.length}`;
  if (signature === lastSignature) return;
  lastSignature = signature;

  const response = await send("ingest", { url: location.href, total, samples });
  if (response?.ok) {
    showToast(`Stock Research: ${response.data.keyword} · ${total.toLocaleString("id-ID")} hasil · ${samples.length} aset tercatat`, false);
  } else {
    showToast(`Stock Research: ${response?.error ?? "gagal mengirim data"}`, true);
  }
}

function scheduleCapture() {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(capture, SETTLE_DELAY_MS);
}

send("status", { kind: "heartbeat" });
new MutationObserver(scheduleCapture).observe(document.body, { childList: true, subtree: true });
scheduleCapture();
