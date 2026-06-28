// AI sections return ID lists; hydrate them into full products via Laravel
// (one batched request: /products?ids=…), preserving the AI ranking order.
// Returns null when the AI is unavailable so callers can fall back.
import { aiService, productService } from './api'
import { unwrapList } from '@/utils/helpers'

async function hydrate(ids) {
  if (!Array.isArray(ids) || !ids.length) return []
  try {
    const res = await productService.getAll({ ids: ids.join(','), per_page: ids.length })
    const byId = {}
    unwrapList(res).forEach(p => { byId[p.id] = p })
    return ids.map(id => byId[id]).filter(Boolean) // keep AI order
  } catch {
    return []
  }
}

export async function aiTrending(k = 8) {
  try {
    const r = await aiService.trending(k)
    const p = await hydrate(r.data?.ids)
    if (p.length) return p
  } catch { /* unavailable */ }
  return null
}

export async function aiExplore(k = 8) {
  try {
    const r = await aiService.explore(k)
    const p = await hydrate(r.data?.ids)
    if (p.length) return p
  } catch { /* unavailable */ }
  return null
}

export async function aiRecommend(userId, k = 8) {
  try {
    const r = await aiService.recommend(userId, k)
    const p = await hydrate(r.data?.ids)
    if (p.length) return { products: p, section: r.data?.section || 'Recommended for You' }
  } catch { /* unavailable */ }
  return null
}

export async function aiSimilar(productId, k = 8) {
  try {
    const r = await aiService.similar(productId, k)
    return await hydrate(r.data?.ids)
  } catch {
    return []
  }
}

// AI semantic search — /search returns a ranked id list; hydrate to products.
// Returns null when the AI is unavailable so callers can fall back to keyword search.
export async function aiSearch(query, k = 30) {
  if (!query || !query.trim()) return null
  try {
    const r = await aiService.search(query.trim(), k)
    const ids = (r.data?.ids || []).map(x => (typeof x === 'object' ? x.id : x))
    const p = await hydrate(ids)
    if (p.length) return p
  } catch { /* unavailable */ }
  return null
}

// "Complete the Setup" bundle — ids come back as objects {id, confidence, …}.
export async function aiBundle(productId, k = 4) {
  try {
    const r = await aiService.bundle(productId, k)
    const ids = (r.data?.ids || []).map(x => (typeof x === 'object' ? x.id : x))
    return { products: await hydrate(ids), section: r.data?.section || 'Complete the Setup' }
  } catch {
    return { products: [], section: 'Complete the Setup' }
  }
}
