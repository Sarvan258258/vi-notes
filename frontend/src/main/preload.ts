import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("viNotes", {
  getAppVersion: () => ipcRenderer.invoke("app:getVersion")
});
