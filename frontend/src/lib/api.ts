import type {
  BomResult,
  CreateProjectResponse,
  IntentResult,
  ProjectSummary,
  RecipeDetail,
  RecipeSummary,
} from './types'

/**
 * کلاینت سبک API — از طریق proxy وی‌یت به بک‌اند متصل می‌شود.
 * هر خطا به شکل ApiError با پیام قابل‌نمایش پرتاب می‌شود.
 */

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
    } catch {
      /* پاسخ JSON نیست */
    }
    const message = payload?.message ?? payload?.errors?.[0] ?? `خطای سرور (${res.status})`
    throw new ApiError(res.status, message, payload?.errors)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  health: () => request<{ status: string; db: string }>('/health'),

  listRecipes: (params?: { search?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.category) q.set('category', params.category)
    if (params?.status) q.set('status', params.status)
    const qs = q.toString()
    return request<{ page: number; pageSize: number; items: RecipeSummary[] }>(
      `/recipes${qs ? `?${qs}` : ''}`,
    )
  },

  getRecipe: (id: string) => request<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`),

  generateBom: (body: {
    recipeId: string
    parameters?: Record<string, number | string | boolean>
  }) =>
    request<BomResult>('/bom/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  createProject: (body: {
    title?: string
    recipeId: string
    parameters?: Record<string, number | string | boolean>
  }) =>
    request<CreateProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listProjects: () =>
    request<{ page: number; pageSize: number; items: ProjectSummary[] }>('/projects'),

  intent: (text: string) =>
    request<IntentResult>('/ai/intent', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
}