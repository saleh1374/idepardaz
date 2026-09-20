// انواع DTO — دقیقاً هم‌شکل خروجی/ورودی API بساز

export interface RecipeSummary {
  id: string
  slug: string
  title: string
  category: string
  difficulty: string // beginner | intermediate | advanced
  safetyLevel: string // LOW | MEDIUM | HIGH | CRITICAL
  estimatedMinutes: number
  status: string // Draft | UnderReview | Approved | Rejected | Deprecated | Archived
  currentVersion: string | null
  summary: string | null
}

export interface ParameterOption {
  value: string
  label: string
}

export interface ParameterAffect {
  logicalPartId: string
  expression: string
}

export interface RecipeParameter {
  key: string
  label: string
  type: 'integer' | 'enum' | 'boolean'
  min?: number | null
  max?: number | null
  step?: number | null
  default?: number | string | boolean | null
  options?: ParameterOption[] | null
  affects?: ParameterAffect[] | null
}

export interface RecipeComponent {
  logicalPartId: string
  role: 'Required' | 'Optional' | 'Alternative'
  qtyFormula?: string | null
  alternatives?: string[] | null
  notes?: string | null
}

export interface RecipeStep {
  n: number
  title: string
  description?: string | null
  safety?: string | null
}

export interface RecipeTest {
  name: string
  expected: string
  tolerance?: string | null
}

export interface RecipePayload {
  title: string
  category: string
  difficulty: string
  safetyLevel: string
  estimatedMinutes: number
  skills?: string[] | null
  summary?: string | null
  description?: string | null
  parameters?: RecipeParameter[] | null
  components?: RecipeComponent[] | null
  tools?: string[] | null
  steps?: RecipeStep[] | null
  tests?: RecipeTest[] | null
  safetyWarnings?: string[] | null
  license?: string | null
  authorId?: string | null
  reviewerIds?: string[] | null
}

export interface VersionDto {
  id: number
  version: string
  status: string
  createdAt: string
}

export interface RecipeDetail extends RecipeSummary {
  description: string | null
  license: string
  versions: VersionDto[]
  payload: RecipePayload
}

export interface BomItem {
  logicalPartId: string
  logicalPartName: string
  role: string // Required | Optional | Alternative
  quantity: number
  supplierProductId: number | null
  supplierName?: string | null
  sku?: string | null
  unitPrice?: number | null
  lineTotal?: number | null
  stockStatus?: string | null
  url?: string | null
  notes?: string | null
}

export interface BomResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  bomId: number | null
  total: number | null
  recipeTitle: string
  recipeVersion: string
  items: BomItem[]
}

export interface IntentResult {
  intent: string
  requirements: string[]
  missingRequirements: string[]
  recommendedRecipeId: string | null
  recommendedRecipeTitle: string | null
  confidence: number
  warnings: string[]
}

export interface CreateProjectResponse {
  project: {
    id: number
    title: string
    recipeId: string
    recipeVersion: string
    status: string
    bomId: number | null
  }
  bom: {
    isValid: boolean
    total: number | null
    items: BomItem[]
    warnings: string[]
  }
}

export interface ProjectSummary {
  id: number
  title: string
  recipeId: string
  recipeVersion: string
  status: string
  bomId: number | null
  createdAt: string
}

export interface ApiErrorPayload {
  message?: string
  errors?: string[]
}