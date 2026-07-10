import localDB, { getAllCompanies } from './db.js'

/**
 * P2P local Wi-Fi sync.
 *
 * Strategy: each device runs an HTTP sync server (in the Electron main
 * process) that exposes /all-docs and /bulk-docs. Peers are discovered via
 * UDP broadcast. When a peer is discovered, we pull its docs and push ours.
 *
 * To avoid duplicate writes we use PouchDB's _rev-based conflict resolution:
 * incoming docs are bulk-upserted with include_docs. PouchDB keeps the
 * winning revision automatically.
 */

let syncInterval = null

export function startP2PSync() {
  if (syncInterval) return
  // Periodically pull from and push to all known peers.
  syncInterval = setInterval(syncWithAllPeers, 15000)
  // Run once immediately.
  syncWithAllPeers()
}

export function stopP2PSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

async function syncWithAllPeers() {
  if (!window.electronP2P) return
  const peers = await window.electronP2P.getPeers()
  for (const peer of peers) {
    pullFromPeer(peer)
  }
}

async function pullFromPeer(peer) {
  try {
    const res = await fetch(`http://${peer.host}:${peer.port}/all-docs`)
    if (!res.ok) return
    const data = await res.json()
    if (data.docs && data.docs.length > 0) {
      await bulkUpsert(data.docs)
    }
  } catch (err) {
    // peer may be offline; ignore
  }
}

export async function pushToPeer(peer, docs) {
  try {
    await fetch(`http://${peer.host}:${peer.port}/bulk-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docs),
    })
  } catch (err) {
    // ignore offline peers
  }
}

/**
 * Upsert a batch of incoming docs into the local PouchDB.
 * If a doc with the same _id exists, we keep the existing _rev and let
 * PouchDB resolve the conflict (highest-rev wins).
 */
export async function bulkUpsert(incomingDocs) {
  const docsToWrite = []
  for (const incoming of incomingDocs) {
    try {
      const existing = await localDB.get(incoming._id)
      // Only write if the incoming revision is newer.
      if (!incoming._rev || incoming._rev !== existing._rev) {
        docsToWrite.push({ ...incoming, _rev: existing._rev })
      }
    } catch (err) {
      if (err.status === 404) {
        // New doc from peer; strip _rev so PouchDB assigns one.
        const { _rev, ...clean } = incoming
        docsToWrite.push(clean)
      }
    }
  }
  if (docsToWrite.length > 0) {
    await localDB.bulkDocs(docsToWrite)
  }
}

/**
 * Respond to a peer's /all-docs request by sending our full doc list back
 * through the Electron main process.
 */
export async function handleGetAllDocsRequest() {
  if (!window.electronP2P) return
  window.electronP2P.onGetAllDocs(async () => {
    const docs = await getAllCompanies()
    window.electronP2P.sendAllDocsResponse({ docs })
  })
}

/**
 * Receive docs pushed from a peer via the /bulk-docs endpoint.
 */
export function handleReceiveDocs() {
  if (!window.electronP2P) return
  window.electronP2P.onReceiveDocs(async (docs) => {
    await bulkUpsert(docs)
  })
}

export async function pushToAllPeers() {
  if (!window.electronP2P) return
  const peers = await window.electronP2P.getPeers()
  const docs = await getAllCompanies()
  for (const peer of peers) {
    pushToPeer(peer, docs)
  }
}
