import { contextBridge, ipcRenderer } from "electron";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const api = {
  getPreloadPath: () => __filename,
  onToggleOmnibar: (callback) => {
    ipcRenderer.on("toggle-omnibar", callback);
  },
  removeToggleOmnibar: (callback) => {
    ipcRenderer.removeListener("toggle-omnibar", callback);
  },
  onAIEvent: (callback) => {
    ipcRenderer.on("ai-event", (event, data) => callback(data));
  }
};
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", {
      ipcRenderer: {
        send: (channel, ...args) => ipcRenderer.send(channel, ...args),
        on: (channel, func) => {
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      }
    });
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = { ipcRenderer };
  window.api = api;
}
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    try {
      ipcRenderer.sendToHost("toggle-omnibar");
    } catch {
      ipcRenderer.send("toggle-omnibar");
    }
  }
});
