import type {
  BomItem,
  BomResult,
  CreateProjectResponse,
  IntentResult,
  RecipeDetail,
  RecipeSummary,
} from './types'

/** API client — connects to backend via Vite proxy /api → localhost:5090 */

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export class ApiError extends Error {
  status: number
  errors?: string[]

  constructor(status: number, message: string, errors?: string[]) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })

  if (!res.ok) {
    let payload: { message?: string; errors?: string[] } | null = null
    try {
      payload = (await res.json()) as { message?: string; errors?: string[] }
    } catch { /* non-JSON */ }
    const message =
      payload?.message ?? payload?.errors?.[0] ?? `خطای سرور (${res.status})`
    throw new ApiError(res.status, message, payload?.errors)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/* ---------- Recipes ---------- */

export interface RecipeListResponse {
  page: number
  pageSize: number
  total?: number
  items: RecipeSummary[]
}

export const api = {
  health: () => request<{ status: string; db: string }>('/health'),

  /* Recipes */
  listRecipes: (params?: { search?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.category) q.set('category', params.category)
    if (params?.status) q.set('status', params.status)
    const qs = q.toString()
    return request<RecipeListResponse>(`/recipes${qs ? `?${qs}` : ''}`)
  },

  getRecipe: (id: string) =>
    request<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`),

  /* BOM */
  generateBom: (body: {
    recipeId: string
    parameters?: Record<string, number | string | boolean>
  }) => request<BomResult>('/bom/generate', { method: 'POST', body: JSON.stringify(body) }),

  /* Projects */
  createProject: (body: {
    title?: string
    recipeId: string
    parameters?: Record<string, number | string | boolean>
  }) => request<CreateProjectResponse>('/projects', { method: 'POST', body: JSON.stringify(body) }),

  listProjects: () =>
    request<{ page: number; pageSize: number; total?: number; items: unknown[] }>('/projects'),

  /* AI */
  intent: (text: string) =>
    request<IntentResult>('/ai/intent', { method: 'POST', body: JSON.stringify({ text }) }),

  /* Parts catalog — route is /api/parts */
  listParts: (params?: { search?: string; category?: string }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.category) q.set('category', params.category)
    const qs = q.toString()
    return request<{
      page: number
      pageSize: number
      total?: number
      items: Array<{
        id: string
        nameFa: string
        nameEn: string
        category: string
        unit: string
        description?: string
        specCount: number
        minPriceToman?: number
        supplierCount: number
      }>
    }>(`/parts${qs ? `?${qs}` : ''}`)
  },

  getPart: (id: string) =>
    request<{
      id: string
      nameFa: string
      nameEn: string
      category: string
      unit: string
      description?: string
      specifications: Array<{ key: string; value: string; unit?: string }>
      products: Array<{
        id: number
        supplier?: string
        sku?: string
        mpn?: string
        title: string
        price: number
        stock: string
        stockQty: number
        url?: string
        lastSyncAt: string
      }>
    }>(`/parts/${encodeURIComponent(id)}`),

  /* Suppliers — route is /api/suppliers, returns { items: [...] } */
  listSuppliers: () =>
    request<{
      items: Array<{
        id: string
        name: string
        baseUrl?: string
        productCount: number
      }>
    }>('/suppliers'),

  /* Projects — individual */
  getProject: (id: number) =>
    request<{
      id: number
      title: string
      description: string | null
      userDisplayName: string
      recipeId: string
      recipeVersion: string
      status: string
      isPublic: boolean
      bomId: number | null
      parameters: Record<string, unknown>
      createdAt: string
      updatedAt: string
    }>(`/projects/${id}`),

  getBomForProject: (projectId: number) =>
    request<{
      isValid: boolean
      bomId: number | null
      total: number | null
      recipeTitle: string
      recipeVersion: string
      items: BomItem[]
      errors: string[]
      warnings: string[]
    }>(`/projects/${projectId}/bom`),

  changeProjectStatus: (id: number, status: string) =>
    request<{ id: number; status: string }>(`/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  /* Orders */
  createOrder: (body: { projectId: number; recipientName?: string; shippingAddress?: string }) =>
    request<{
      order: { id: number; projectId: number; status: string; total: number; items: BomItem[] }
      payment: { id: number; gateway: string; status: string; amount: number; note: string }
    }>('/orders', { method: 'POST', body: JSON.stringify(body) }),

  getOrder: (id: number) =>
    request<{
      id: number
      projectId: number
      status: string
      total: number
      recipientName: string | null
      shippingAddress: string | null
      createdAt: string
      items: BomItem[]
    }>(`/orders/${id}`),
}