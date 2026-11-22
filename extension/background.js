const DEFAULT_APP_URL = "http://localhost:3000";
const ENDPOINTS = { ingest: "/api/adobe/ingest", status: "/api/adobe/status" };

async function config() {
  const { appUrl, workspace } = await chrome.storage.sync.get(["appUrl", "workspace"]);
  return {
    appUrl: (appUrl || DEFAULT_APP_URL).replace(/\/+$/, ""),
    workspace: (workspace || "default").trim() || "default",
  };
}

async function post(path, payload) {
  try {
    const { appUrl, workspace } = await config();
    const response = await fetch(`${appUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, workspace }),
    });
    const body = await response.json();
    return response.ok ? { ok: true, data: body } : { ok: false, error: body.error };
  } catch {
    return { ok: false, error: "aplikasi Stock Research tidak bisa dihubungi. Pastikan npm run dev berjalan." };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const path = ENDPOINTS[message?.type];
  if (!path) return false;
  post(path, message.payload).then(sendResponse);
  return true;
});
