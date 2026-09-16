import { z } from "zod";

// ─── Shared enums ────────────────────────────────────────────────────────────

export const CollegeTypeEnum = z.enum(["Govt", "Private", "Deemed"]);
export const DegreeLevelEnum = z.enum(["UG", "PG"]);
export const CategoryEnum = z.enum(["General", "OBC", "SC", "ST", "EWS"]);
export const SortEnum = z.enum(["rating", "fees_asc", "fees_desc", "rank", "name"]);

// ─── GET /api/v1/colleges query params ───────────────────────────────────────

export const collegesQuerySchema = z.object({
  q: z.string().optional(),
  state: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : []))
    .optional(),
  city: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : []))
    .optional(),
  type: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : []))
    .pipe(z.array(CollegeTypeEnum).optional())
    .optional(),
  exam: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : []))
    .optional(),
  branch: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : []))
    .optional(),
  minFees: z.coerce.number().min(0).optional(),
  maxFees: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: SortEnum.default("rating"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CollegesQuery = z.infer<typeof collegesQuerySchema>;

// ─── GET /api/v1/colleges/:slug ──────────────────────────────────────────────

export const collegeSlugSchema = z.object({
  slug: z.string().min(1),
});

// ─── GET /api/v1/colleges/compare ────────────────────────────────────────────

export const compareQuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((s) => s.split(",").map(Number))
    .pipe(z.array(z.number().int().positive()).min(2).max(3)),
});

// ─── POST /api/v1/predict ────────────────────────────────────────────────────

export const predictSchema = z.object({
  exam: z.string().min(1, "Exam is required"),
  rank: z.coerce.number().int().positive("Rank must be a positive number"),
  category: CategoryEnum,
  preferredStates: z.array(z.string()).optional(),
});

export type PredictInput = z.infer<typeof predictSchema>;

// ─── Saved colleges ──────────────────────────────────────────────────────────

export const savedCollegeSchema = z.object({
  collegeId: z.number().int().positive(),
});

// ─── Saved comparisons ──────────────────────────────────────────────────────

export const savedComparisonSchema = z.object({
  collegeIds: z.array(z.number().int().positive()).min(2).max(3),
  title: z.string().min(1).max(200),
});

export const deleteSavedComparisonSchema = z.object({
  comparisonId: z.number().int().positive(),
});

// ─── API response envelope ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
    facets?: Record<string, Record<string, number>>;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Helper to create error responses ────────────────────────────────────────

export function apiError(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return { error: { code, message, details } };
}

export function zodError(error: z.ZodError): ApiError {
  return {
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request parameters",
      details: error.flatten().fieldErrors,
    },
  };
}
