const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveMetadata: (filePath, metadata) => ipcRenderer.invoke('save-metadata', filePath, metadata),
});
