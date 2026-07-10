const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const http = require('http')
const os = require('os')
const dgram = require('dgram')

let mainWindow = null
let p2pServer = null
let discoverySocket = null
const SYNC_PORT = 51820
const DISCOVERY_PORT = 51821
const SERVICE_ID = 'companies-p2p-sync-v1'
const knownPeers = new Map() // address -> { host, port, lastSeen }

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'دليل الشركات - مزامنة محلية',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------------------------------------------------------------------
// P2P HTTP sync server
// Exposes /all-docs and /bulk-docs endpoints over the local Wi-Fi network.
// Each peer runs this server; peers pull from each other via PouchDB replication
// proxied through the renderer using these endpoints.
// ---------------------------------------------------------------------------

function getLocalIPs() {
  const ifaces = os.networkInterfaces()
  const results = []
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        results.push(iface.address)
      }
    }
  }
  return results
}

function startP2PServer() {
  p2pServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      return res.end()
    }

    if (req.method === 'GET' && req.url === '/peer-info') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ service: SERVICE_ID, port: SYNC_PORT }))
    }

    if (req.method === 'GET' && req.url === '/all-docs') {
      // The renderer will respond via IPC with the full docs payload
      ipcMain.once('p2p:all-docs-response', (_e, payload) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(payload))
      })
      mainWindow.webContents.send('p2p:get-all-docs')
      return
    }

    if (req.method === 'POST' && req.url === '/bulk-docs') {
      let body = ''
      req.on('data', (chunk) => { body += chunk })
      req.on('end', () => {
        try {
          const docs = JSON.parse(body)
          mainWindow.webContents.send('p2p:receive-docs', docs)
        } catch (err) {
          // ignore malformed payloads
        }
      })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ ok: true }))
    }

    res.writeHead(404)
    res.end('Not found')
  })

  p2pServer.listen(SYNC_PORT, '0.0.0.0', () => {
    const ips = getLocalIPs()
    console.log(`[P2P] Sync server listening on port ${SYNC_PORT} (${ips.join(', ')})`)
  })
}

// ---------------------------------------------------------------------------
// UDP multicast/broadcast discovery
// Peers announce themselves on the local network; we collect their addresses.
// ---------------------------------------------------------------------------

function startDiscovery() {
  discoverySocket = dgram.createSocket({ type: 'udp4', reuseAddr: true })

  discoverySocket.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString())
      if (data.service === SERVICE_ID) {
        const key = `${rinfo.address}:${data.port}`
        knownPeers.set(key, { host: rinfo.address, port: data.port, lastSeen: Date.now() })
        if (mainWindow) {
          mainWindow.webContents.send('p2p:peer-discovered', { host: rinfo.address, port: data.port })
        }
      }
    } catch (err) {
      // ignore non-JSON packets
    }
  })

  discoverySocket.on('error', (err) => {
    console.error('[P2P] Discovery socket error:', err.message)
  })

  discoverySocket.bind(DISCOVERY_PORT, '0.0.0.0', () => {
    discoverySocket.setBroadcast(true)
    announceSelf()
    setInterval(announceSelf, 5000)
  })
}

function announceSelf() {
  const announcement = JSON.stringify({ service: SERVICE_ID, port: SYNC_PORT })
  const msg = Buffer.from(announcement)
  // Broadcast to the subnet
  discoverySocket.send(msg, 0, msg.length, DISCOVERY_PORT, '255.255.255.255')
}

// ---------------------------------------------------------------------------
// IPC: renderer requests the list of currently known peers
// ---------------------------------------------------------------------------

ipcMain.handle('p2p:get-peers', () => {
  return Array.from(knownPeers.values()).filter(
    (p) => Date.now() - p.lastSeen < 30000 // peers seen in the last 30s
  )
})

ipcMain.handle('p2p:get-local-ips', () => getLocalIPs())

app.whenReady().then(() => {
  createWindow()
  startP2PServer()
  startDiscovery()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (p2pServer) p2pServer.close()
  if (discoverySocket) discoverySocket.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (p2pServer) p2pServer.close()
  if (discoverySocket) discoverySocket.close()
})
