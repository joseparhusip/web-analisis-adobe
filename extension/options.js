const appUrlInput = document.getElementById("appUrl");
const workspaceInput = document.getElementById("workspace");
const status = document.getElementById("status");

chrome.storage.sync.get(["appUrl", "workspace"]).then(({ appUrl, workspace }) => {
  appUrlInput.value = appUrl || "http://localhost:3000";
  workspaceInput.value = workspace || "default";
});

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({
    appUrl: appUrlInput.value.trim(),
    workspace: workspaceInput.value.trim() || "default",
  });
  status.textContent = "Tersimpan.";
});
