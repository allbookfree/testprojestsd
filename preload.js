const { contextBridge, ipcRenderer } = require('electron');

// Expose a controlled API to the renderer process (your React app).
// This is the secure way to bridge Electron's main and renderer processes.
contextBridge.exposeInMainWorld('electronAPI', {
  saveMetadata: (filePath, metadata) => ipcRenderer.invoke('save-metadata', filePath, metadata),
});
