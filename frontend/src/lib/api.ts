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

/** خواندن اطلاعات کاربر از localStorage و ارسال هدر احراز هویت */
function getAuthHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem('besaz-user')
    if (stored) {
      const user = JSON.parse(stored)
      if (user.id && user.role !== 'Guest') {
        return {
          'X-User-Id': user.id,
          'X-User-Name': user.name || 'کاربر',
        }
      }
    }
  } catch { /* fallthrough */ }
  return {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = getAuthHeaders()
  const contentType = init?.body ? { 'Content-Type': 'application/json' } : {}
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...authHeaders,
      ...contentType,
      ...init?.headers,
    },
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
    parametersJson?: string
    makerId?: string
  }) => request<CreateProjectResponse>('/projects', { method: 'POST', body: JSON.stringify(body) }),

  listProjects: () =>
    request<{ page: number; pageSize: number; total?: number; items: unknown[] }>('/projects'),

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

  /* Suppliers — route is /api/suppliers */
  listSuppliers: () =>
    request<{
      items: Array<{
        id: string
        name: string
        baseUrl?: string
        productCount: number
      }>
    }>('/suppliers'),

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

  listOrders: (params?: { status?: string; page?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.page) q.set('page', params.page!.toString())
    const qs = q.toString()
    return request<{
      page: number
      pageSize: number
      total: number
      items: Array<{
        id: number
        projectId: number
        status: string
        total: number
        recipientName: string | null
        itemCount: number
        createdAt: string
      }>
    }>(`/orders${qs ? `?${qs}` : ''}`)
  },

  /* Auth */
  register: (body: { name: string; email: string; phone?: string; password: string; role: string }) =>
    request<{
      id: string
      name: string
      email: string | null
      phone: string | null
      role: string
    }>('/users/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{
      id: string
      name: string
      email: string | null
      phone: string | null
      role: string
    }>('/users/login', { method: 'POST', body: JSON.stringify(body) }),

  /* Makers */
  listMakers: (params?: { city?: string; specialty?: string; page?: number }) => {
    const q = new URLSearchParams()
    if (params?.city) q.set('city', params.city)
    if (params?.specialty) q.set('specialty', params.specialty)
    if (params?.page) q.set('page', params.page!.toString())
    const qs = q.toString()
    return request<{
      page: number
      pageSize: number
      total: number
      items: Array<{
        id: string
        displayName: string
        bio: string | null
        specialties: string | null
        city: string | null
        avatarUrl: string | null
        isVerified: boolean
        rating: number
        ratingCount: number
        serviceCount: number
        createdAt: string
      }>
    }>(`/makers${qs ? `?${qs}` : ''}`)
  },

  getMaker: (id: string) =>
    request<{
      id: string
      displayName: string
      bio: string | null
      specialties: string | null
      city: string | null
      avatarUrl: string | null
      isVerified: boolean
      rating: number
      ratingCount: number
      userName: string
      createdAt: string
      services: Array<{
        id: number
        title: string
        description: string | null
        price: number
        unit: string
        leadTimeDays: number
      }>
    }>(`/makers/${id}`),

  listMakerServices: (makerId: string) =>
    request<{
      page: number
      pageSize: number
      total: number
      items: Array<{
        id: number
        title: string
        description: string | null
        price: number
        unit: string
        leadTimeDays: number
      }>
    }>(`/makers/${makerId}/services`),

  requestQuote: (body: { makerId: string; projectId?: number; description: string }) =>
    request<{ id: number; makerId: string; status: string; createdAt: string }>(
      '/makers/quote',
      { method: 'POST', body: JSON.stringify(body) }
    ),

  /* Admin */
  adminDashboard: () =>
    request<{
      stats: {
        recipes: number
        approvedRecipes: number
        pendingRecipes: number
        users: number
        projects: number
        orders: number
        parts: number
        suppliers: number
      }
      recentProjects: Array<{
        id: number
        title: string
        recipeId: string
        status: string
        createdAt: string
      }>
      recentOrders: Array<{
        id: number
        projectId: number
        status: string
        total: number
        createdAt: string
      }>
    }>('/admin/dashboard'),

  adminListUsers: (page = 1) =>
    request<{
      page: number
      pageSize: number
      total: number
      items: Array<{
        id: string
        name: string
        email: string | null
        phone: string | null
        role: string
        createdAt: string
      }>
    }>(`/admin/users?page=${page}`),

  adminChangeUserRole: (id: string, role: string) =>
    request<{ id: string; role: string }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  adminPendingRecipes: () =>
    request<{
      items: Array<{
        id: string
        title: string
        category: string
        difficulty: string
        safetyLevel: string
        status: string
        createdAt: string
      }>
      total: number
    }>('/admin/recipes/pending'),

  adminApproveRecipe: (id: string) =>
    request<{ id: string; status: string }>(`/admin/recipes/${id}/approve`, { method: 'POST' }),

  adminRejectRecipe: (id: string) =>
    request<{ id: string; status: string }>(`/admin/recipes/${id}/reject`, { method: 'POST' }),

  adminListOrders: (page = 1, status?: string) => {
    const q = new URLSearchParams({ page: page.toString() })
    if (status) q.set('status', status)
    return request<{
      page: number
      pageSize: number
      total: number
      items: Array<{
        id: number
        projectId: number
        status: string
        total: number
        recipientName: string | null
        createdAt: string
      }>
    }>(`/admin/orders?${q.toString()}`)
  },

  adminAuditLog: (page = 1) =>
    request<{
      page: number
      pageSize: number
      total: number
      items: Array<{
        id: number
        entityType: string
        entityId: string
        action: string
        actorId: string
        dataJson: string | null
        timestamp: string
      }>
    }>(`/admin/audit?page=${page}`),

  /* Users */
  getUserProfile: () =>
    request<{
      id: string
      name: string
      email: string | null
      phone: string | null
      role: string
      createdAt: string
      stats: { projects: number; orders: number }
    }>('/users/me'),

  updateUserProfile: (body: { name?: string; email?: string; phone?: string }) =>
    request<{
      id: string
      name: string
      email: string | null
      phone: string | null
      role: string
    }>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
}
