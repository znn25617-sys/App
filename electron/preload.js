const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal, safe API surface to the renderer for P2P coordination.
contextBridge.exposeInMainWorld('electronP2P', {
  getPeers: () => ipcRenderer.invoke('p2p:get-peers'),
  getLocalIPs: () => ipcRenderer.invoke('p2p:get-local-ips'),
  onPeerDiscovered: (callback) => {
    ipcRenderer.on('p2p:peer-discovered', (_e, peer) => callback(peer))
  },
  onGetAllDocs: (callback) => {
    ipcRenderer.on('p2p:get-all-docs', () => callback())
  },
  sendAllDocsResponse: (payload) => {
    ipcRenderer.send('p2p:all-docs-response', payload)
  },
  onReceiveDocs: (callback) => {
    ipcRenderer.on('p2p:receive-docs', (_e, docs) => callback(docs))
  },
})
