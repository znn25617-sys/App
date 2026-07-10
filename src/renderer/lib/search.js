import FlexSearch from 'flexsearch'

// Offline local search engine built on FlexSearch.
// Indexes company name, specialization, phone, and location so users can
// search instantly without an internet connection.
let index = null
let docMap = new Map() // flexsearch id -> company doc

function ensureIndex() {
  if (index) return
  index = new FlexSearch.Index({
    tokenize: 'forward',
    cache: 100,
    resolution: 9,
    context: {
      resolution: 3,
      depth: 2,
      bidirectional: true,
    },
  })
}

/**
 * Rebuild the entire search index from a list of company documents.
 * Call this on app startup and after any sync that adds new documents.
 */
export function rebuildIndex(companies) {
  ensureIndex()
  index.clear()
  docMap = new Map()
  for (const company of companies) {
    addToIndex(company)
  }
}

let nextFlexId = 1
export function addToIndex(company) {
  ensureIndex()
  const flexId = nextFlexId++
  docMap.set(flexId, company)
  const searchable = [
    company.company_name,
    company.specialization,
    company.mobile_number,
    company.company_location,
    company.website_or_page_link || '',
  ].join(' ')
  index.add(flexId, searchable)
}

export function removeFromIndex(company) {
  ensureIndex()
  for (const [flexId, doc] of docMap.entries()) {
    if (doc._id === company._id) {
      index.remove(flexId)
      docMap.delete(flexId)
      return
    }
  }
}

/**
 * Search companies by name, specialization, phone, or location.
 * Returns matching company documents sorted by relevance.
 */
export function searchCompanies(query) {
  ensureIndex()
  if (!query || !query.trim()) return []
  const results = index.search(query.trim(), { limit: 100 })
  return results.map((flexId) => docMap.get(flexId)).filter(Boolean)
}
